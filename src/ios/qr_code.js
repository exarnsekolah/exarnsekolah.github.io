import './qr_code.css';

// Check localStorage for verification
// if (localStorage.getItem("isBlocked") === "true" || !localStorage.getItem("isVerified")) {
//     alert("Anda Tidak bisa mengakses halaman ini.");
//     window.location.href = "/ios/page.html";
// }

const video = document.querySelector("#preview");
const cameraSelect = document.querySelector("#cameraSelect");
const startButton = document.querySelector("#startButton");
const scanner = document.querySelector("#scanner");

let currentStream = null;
let isScanning = false;

// Update button text on first access
const firstAccess = !localStorage.getItem("cameraAccessGranted");
if (firstAccess) {
    startButton.innerText = "Aktifkan Kamera";
}

// Load available cameras after requesting permission
async function loadCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const existingCameraIds = Array.from(cameraSelect.options).map(option => option.value);

        devices.forEach((device) => {
            if (device.kind === 'videoinput' && !existingCameraIds.includes(device.deviceId)) {
                const option = document.createElement("option");
                option.value = device.deviceId;
                option.text = device.label || `Kamera ${cameraSelect.length + 1}`;
                cameraSelect.appendChild(option);
            }
        });

        if (cameraSelect.options.length > 0) {
            cameraSelect.selectedIndex = 0;
        } else {
            alert("Tidak ada kamera ditemukan.");
        }
    } catch (error) {
        console.error("Error loading cameras: ", error);
        alert("Gagal memuat daftar kamera. Periksa izin akses kamera.");
    }
}

// Start scanning with selected camera
async function startScanner() {
    const deviceId = cameraSelect.value;
    
    if (!deviceId) {
        alert("Silakan pilih kamera terlebih dahulu");
        return;
    }

    const constraints = {
        video: { deviceId: { exact: deviceId } }
    };

    try {
        // Stop existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        scanner.style.display = "block";
        isScanning = true;

        video.onloadedmetadata = () => {
            requestAnimationFrame(scanQRCode);
        };

        // Update button text after first activation
        startButton.innerText = "Mulai Pemindaian";
        localStorage.setItem("cameraAccessGranted", "true");
    } catch (error) {
        console.error("Error accessing camera: ", error);
        if (error.name === "OverconstrainedError") {
            alert("Kamera tidak tersedia. Coba kamera lain.");
        } else if (error.name === "NotAllowedError") {
            alert("Akses kamera ditolak. Periksa pengaturan izin browser Anda.");
        } else {
            alert("Terjadi kesalahan saat mengakses kamera. Coba lagi.");
        }
    }
}

// Scan QR code from video feed
async function scanQRCode() {
    if (!isScanning || !video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(scanQRCode);
        return;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
        let url = code.data;
        
        // Decode base64
        try {
            for (let i = 0; i < 5; i++) {
                url = atob(url);
            }
        } catch (e) {
            // URL tidak terenkripsi base64, gunakan sebagaimana adanya
        }

        if (isValidURL(url)) {
            isScanning = false;
            await localStorage.removeItem("isBlocked");
            await localStorage.removeItem("alertShown");
            
            // Encrypt URL
            var encrypted = '';
            for (var i = 0; i < url.length; i++) {
                encrypted += String.fromCharCode(url.charCodeAt(i) + 1);
            }
            
            window.location.href = '/ios/focus2.html?url=' + encodeURIComponent(encrypted);
        } else {
            console.warn("QR Code tidak berisi URL valid:", code.data);
        }
    }

    requestAnimationFrame(scanQRCode);
}

// Validate URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (e) {
        return false;
    }
}

// Request camera permission and load cameras
startButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            // Close the stream immediately, we just needed permission
            stream.getTracks().forEach(track => track.stop());
            
            // Now load available cameras
            loadCameras();
            
            // Start scanning with selected camera
            startScanner();
        })
        .catch(error => {
            console.error("Kesalahan akses kamera: ", error);
            if (error.name === "NotAllowedError") {
                alert("Izin kamera ditolak. Silakan ubah pengaturan browser Anda.");
            } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                alert("Tidak ada kamera ditemukan.");
            } else {
                alert("Terjadi kesalahan: " + error.message);
            }
        });
});

// Change camera when dropdown changes
cameraSelect.addEventListener('change', startScanner);

// Check device and browser compatibility
function checkDeviceAndBrowser() {
    // Device and browser check disabled - allow all user agents
    return;
}

// Run checks on page load
window.onload = checkDeviceAndBrowser;
