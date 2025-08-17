let currentBbox = null;
let currentVideo = null;


function drawBoundingBox(adjusted) {
    
    document.querySelectorAll('.bounding-box').forEach(el => el.remove());
    
    
    const box = document.createElement('div');
    box.className = 'bounding-box';
    box.style.position = 'absolute';
    box.style.border = '2px solid #00ff00';
    box.style.boxShadow = '0 0 10px #00ff00';
    box.style.pointerEvents = 'none';
    box.style.zIndex = '10';
    box.style.left = `${adjusted[0]}px`;
    box.style.top = `${adjusted[1]}px`;
    box.style.width = `${adjusted[2] - adjusted[0]}px`;
    box.style.height = `${adjusted[3] - adjusted[1]}px`;
    
    document.querySelector('.video-container').appendChild(box);
}


function adjustBoundingBox(bbox, video) {
    const origWidth = parseInt(video.dataset.origWidth);
    const origHeight = parseInt(video.dataset.origHeight);
    const displayWidth = video.offsetWidth;
    const displayHeight = video.offsetHeight;

    
    const scaleX = displayWidth / origWidth;
    const scaleY = displayHeight / origHeight;

    return [
        bbox[0] * scaleX,
        bbox[1] * scaleY,
        bbox[2] * scaleX,
        bbox[3] * scaleY
    ];
}


function showMatch(element) {
    const time = parseFloat(element.dataset.time);
    const bbox = JSON.parse(element.dataset.bbox);
    const similarity = parseFloat(element.dataset.similarity);

    const video = document.getElementById('result-video');
    currentVideo = video;
    currentBbox = bbox;

    
    video.currentTime = time;
    
    function drawBox() {
        const adjusted = adjustBoundingBox(bbox, video);
        drawBoundingBox(adjusted);
    }

    
    if (video.readyState >= 2) {
        drawBox();
    } 
    
    else {
        const onLoaded = () => {
            drawBox();
            video.removeEventListener('loadeddata', onLoaded);
        };
        video.addEventListener('loadeddata', onLoaded);
    }

    
    document.querySelectorAll('.timestamp-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    
    video.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


window.addEventListener('resize', function () {
    if (currentBbox && currentVideo) {
        const adjusted = adjustBoundingBox(currentBbox, currentVideo);
        drawBoundingBox(adjusted);
    }
});


window.addEventListener('load', () => {
    
    document.querySelectorAll('.timestamp-item').forEach(item => {
        item.addEventListener('click', function () {
            showMatch(this);
        });
    });

    
    const firstTimestamp = document.querySelector('.timestamp-item.active');
    if (firstTimestamp) {
        
        const video = document.getElementById('result-video');
        
        const tryShowMatch = () => {
            if (video.readyState >= 1) {  
                showMatch(firstTimestamp);
            } else {
                setTimeout(tryShowMatch, 100);
            }
        };
        
        tryShowMatch();
    }

    
    const video = document.getElementById('result-video');
    video.addEventListener('seeked', function () {
        if (currentBbox) {
            const adjusted = adjustBoundingBox(currentBbox, video);
            drawBoundingBox(adjusted);
        }
    });
    
    
    video.addEventListener('loadedmetadata', function() {
        if (currentBbox && firstTimestamp) {
            const adjusted = adjustBoundingBox(currentBbox, video);
            drawBoundingBox(adjusted);
        }
    });
});