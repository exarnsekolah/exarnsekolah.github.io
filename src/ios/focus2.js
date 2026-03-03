import './focus2.css';

const draggable = document.getElementById('draggable');
let isDragging = false;
let offsetX, offsetY;

draggable.addEventListener('touchstart', function (e) {
    e.preventDefault();
});

draggable.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDrag);

draggable.addEventListener('touchstart', startDrag);
document.addEventListener('touchmove', drag);
document.addEventListener('touchend', stopDrag);

function startDrag(e) {
    isDragging = true;
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    offsetX = clientX - draggable.getBoundingClientRect().left;
    offsetY = clientY - draggable.getBoundingClientRect().top;
    draggable.style.transition = 'none';
    draggable.style.cursor = 'grabbing';
}

function drag(e) {
    if (isDragging) {
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        draggable.style.left = `${clientX - offsetX}px`;
        draggable.style.top = `${clientY - offsetY}px`;
    }
}

function stopDrag() {
    isDragging = false;
    draggable.style.cursor = 'grab';
    snapToEdge();
}

function snapToEdge() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const rect = draggable.getBoundingClientRect();

    if (rect.left < screenWidth / 2) {
        draggable.style.left = '10px';
    } else {
        draggable.style.left = `${screenWidth - rect.width - 10}px`;
    }

    if (rect.top < screenHeight / 2) {
        draggable.style.top = '10px';
    } else {
        draggable.style.top = `${screenHeight - rect.height - 10}px`;
    }

    draggable.style.transition = '0.3s';
}

const params = new URLSearchParams(window.location.search);
const iframeUrl = params.get("url");
var decrypted = '';
for (var i = 0; i < iframeUrl.length; i++) {
    decrypted += String.fromCharCode(iframeUrl.charCodeAt(i) - 1);
}
const url = new URL(decrypted);
console.log(url.href);
document.getElementById("myIframe").src = url.href;

document.addEventListener("DOMContentLoaded", function () {
    const iframe = document.getElementById('myIframe');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const customAlert = document.getElementById('customAlert');
    const overlay = document.getElementById('overlay');
    let alertShown = false;
    let isFullscreenEnabled = false;
    let alertCount = 0;

    // if (localStorage.getItem("isBlocked") === "true" || !localStorage.getItem("isVerified")) {
    //     alert("Anda tidak bisa mengakses halaman ini.");
    //     window.location.href = "page.html";
    //     return;
    // }

    function enterFullscreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
        isFullscreenEnabled = true;
        fullscreenBtn.style.display = 'none';
        overlay.style.display = 'none';
    }

    fullscreenBtn.addEventListener('click', function() {
        if (!isFullscreenEnabled) {
            enterFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', function() {
        if (!document.fullscreenElement) {
            customAlert.textContent = 'You have exited fullscreen mode. Please return for the best experience.';
            resetFullscreenState();
        }
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden' && isFullscreenEnabled) {
            showAlert('You have lost focus on the page. Please return to fullscreen.');
            alertCount++;

            if (alertCount >= 1) {
                localStorage.setItem("isBlocked", "true");
                localStorage.setItem("isVerified", "false");
                setTimeout(() => {
                    window.location.href = "/ios/page.html";
                }, 2000);
            }
        } else if (document.visibilityState === 'visible') {
            customAlert.style.display = 'none';
        }
    });

    function resetFullscreenState() {
        isFullscreenEnabled = false;
        fullscreenBtn.style.display = 'block';
        overlay.style.display = 'flex';
    }

    function showAlert(message) {
        customAlert.textContent = message;
        customAlert.style.display = 'block';
        alertShown = true;
    }

    document.addEventListener('click', function () {
        if (alertShown) {
            customAlert.style.display = 'none';
            alertShown = false;
        }
    });

    document.addEventListener('click', function (event) {
        if (!isFullscreenEnabled && event.target !== fullscreenBtn) {
            event.preventDefault();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (!isFullscreenEnabled) {
            event.preventDefault();
        }
    });
});

function checkDeviceAndBrowser() {
    // Device and browser check disabled - allow all user agents
    return;
}

window.onload = checkDeviceAndBrowser;
