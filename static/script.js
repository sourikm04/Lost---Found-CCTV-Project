window.addEventListener('beforeunload', function () {
    window.scrollTo(0, 0);
});


document.addEventListener('DOMContentLoaded', function () {
    const uploadSections = document.querySelectorAll('.upload-section');
    uploadSections.forEach((section, index) => {
        setTimeout(() => {
            section.style.animation = 'fadeInUp 0.8s ease forwards';
            section.style.opacity = '0';
        }, index * 200);
    });
});


document.getElementById('image-input').addEventListener('change', function (e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'No file selected';
    document.getElementById('image-name').textContent = fileName;


    const container = this.closest('.file-input-container');
    container.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        container.style.animation = '';
    }, 500);
});

document.getElementById('video-input').addEventListener('change', function (e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'No file selected';
    document.getElementById('video-name').textContent = fileName;


    const container = this.closest('.file-input-container');
    container.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        container.style.animation = '';
    }, 500);
});


const dropContainers = document.querySelectorAll('.file-input-container');

dropContainers.forEach(container => {
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.style.borderColor = '#4e54c8';
        container.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    });

    container.addEventListener('dragleave', () => {
        container.style.borderColor = '#6a71e6';
        container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.style.borderColor = '#6a71e6';
        container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';

        const input = container.querySelector('input[type="file"]');
        if (input) {
            input.files = e.dataTransfer.files;


            const event = new Event('change');
            input.dispatchEvent(event);


            container.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                container.style.animation = '';
            }, 500);
        }
    });
});


document.getElementById('tracking-form').addEventListener('submit', function (e) {

    const imageInput = document.getElementById('image-input');
    const videoInput = document.getElementById('video-input');


    if (!imageInput.files.length || !videoInput.files.length) {
        e.preventDefault();

        const sections = document.querySelectorAll('.upload-section');
        sections.forEach(section => {

            section.classList.add('shake');


            setTimeout(() => {
                section.classList.remove('shake');
            }, 500);
        });


        if (!imageInput.files.length) {
            document.querySelector('#image-input').closest('.upload-section').style.border = '2px solid #ff4d4d';
        }
        if (!videoInput.files.length) {
            document.querySelector('#video-input').closest('.upload-section').style.border = '2px solid #ff4d4d';
        }


        setTimeout(() => {
            sections.forEach(section => {
                section.style.border = '1px dashed var(--primary-light)';
            });
        }, 2000);

        return;
    }


    const loadingSection = document.getElementById('loading');
    loadingSection.style.display = 'block';


    setTimeout(() => {
        loadingSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, 50);
});