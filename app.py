from flask import Flask, render_template, request, redirect, url_for, session
import os
from werkzeug.utils import secure_filename
import cv2
from ultralytics import YOLO
from keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from keras.models import Model
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import threading
from queue import Queue

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Required for session
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'mp4'}

# Load models
yolo_model = YOLO('yolov8n.pt')
mobilenet = MobileNetV2(weights='imagenet', include_top=True)
feature_model = Model(inputs=mobilenet.input, outputs=mobilenet.layers[-2].output)

# Queue for storing results
result_queue = Queue()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def preprocess_image(img):
    img = cv2.resize(img, (224, 224))
    img = preprocess_input(img)
    return img

def get_embedding(img):
    img = preprocess_image(img)
    embedding = feature_model.predict(np.expand_dims(img, axis=0), verbose=0)
    return embedding

def compare_images(img1, img2):
    emb1 = get_embedding(img1)
    emb2 = get_embedding(img2)
    return cosine_similarity(emb1, emb2)[0][0]

def process_frame(frame, frame_count, fps, image_path):
    if frame_count % int(fps) == 0:
        small_frame = cv2.resize(frame, (640, 360))
        results = yolo_model(small_frame, verbose=False)
        for result in results:
            for box in result.boxes:
                if box.conf.item() > 0.5:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    cropped = small_frame[y1:y2, x1:x2]
                    similarity = compare_images(cv2.imread(image_path), cropped)
                    if similarity > 0.7:
                        result_queue.put({
                            'time': frame_count / fps,
                            'similarity': float(similarity),
                            'position': [x1, y1, x2, y2]
                        })

def process_video(video_path, image_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = 0
    threads = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        t = threading.Thread(
            target=process_frame,
            args=(frame, frame_count, fps, image_path)
        )
        t.start()
        threads.append(t)
        frame_count += 1

    for t in threads:
        t.join()
    cap.release()

    timestamps = []
    while not result_queue.empty():
        timestamps.append(result_queue.get())
    return timestamps

@app.route('/')
@app.route('/index', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        image_file = request.files.get('image')
        video_file = request.files.get('video')

        if not image_file or not video_file or image_file.filename == '' or video_file.filename == '':
            return redirect(request.url)

        if allowed_file(image_file.filename) and allowed_file(video_file.filename):
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            image_filename = secure_filename(f"img_{timestamp}.{image_file.filename.split('.')[-1]}")
            video_filename = secure_filename(f"vid_{timestamp}.{video_file.filename.split('.')[-1]}")

            image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
            video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)

            image_file.save(image_path)
            video_file.save(video_path)

            # Save paths to session for result route
            session['image_path'] = image_path
            session['video_path'] = video_path

            return redirect(url_for('result'))

    return render_template('index.html', show_results=False)

@app.route('/result')
def result():
    image_path = session.get('image_path')
    video_path = session.get('video_path')

    if not image_path or not video_path:
        return redirect(url_for('index'))

    timestamps = process_video(video_path, image_path)

    return render_template('result.html',
                           image_url=image_path,
                           video_url=video_path,
                           timestamps=timestamps,
                           show_results=True)

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True)
