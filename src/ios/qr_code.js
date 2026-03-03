import './qr_code.css';

const video = document.querySelector('#preview');
const cameraSelect = document.querySelector('#cameraSelect');
const startButton = document.querySelector('#startButton');
const scanner = document.querySelector('#scanner');
const statusMsg = document.querySelector('#statusMsg');

let currentStream = null;
let isScanning = false;
let camerasLoaded = false;

// ── UI helpers ──────────────────────────────────────────────────────────────

function setStatus(text, type = 'info') {
    // type: 'info' | 'success' | 'error' | 'loading'
    if (!statusMsg) return;
    const icons = { info: '📷', success: '✅', error: '❌', loading: '⏳' };
    statusMsg.textContent = `${icons[type]} ${text}`;
    statusMsg.className = 'status-msg status-' + type;
    statusMsg.style.display = 'block';
}

function hideStatus() {
    if (statusMsg) statusMsg.style.display = 'none';
}

function setButtonReady(ready) {
    startButton.disabled = !ready;
    startButton.innerHTML = ready
        ? '<i class="fas fa-camera"></i> Aktifkan Kamera'
        : '<i class="fas fa-spinner fa-spin"></i> Memuat…';
}

// ── Camera loader ───────────────────────────────────────────────────────────

async function loadCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const existing = Array.from(cameraSelect.options).map(o => o.value);

        devices.forEach(device => {
            if (device.kind === 'videoinput' && !existing.includes(device.deviceId)) {
                const opt = document.createElement('option');
                opt.value = device.deviceId;
                opt.text = device.label || `Kamera ${cameraSelect.length + 1}`;
                cameraSelect.appendChild(opt);
            }
        });

        if (cameraSelect.options.length > 0) {
            cameraSelect.selectedIndex = 0;
            camerasLoaded = true;
            setButtonReady(true);
            setStatus('Kamera siap. Tekan tombol untuk mulai scan.', 'success');
        } else {
            setStatus('Tidak ada kamera ditemukan.', 'error');
        }
    } catch (err) {
        console.error('loadCameras:', err);
        setStatus('Gagal memuat daftar kamera.', 'error');
    }
}

// ── Permission request ──────────────────────────────────────────────────────

async function requestPermissionAndLoad() {
    setStatus('Meminta izin kamera…', 'loading');
    setButtonReady(false);

    try {
        // Request permission — we open then immediately stop the stream
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(t => t.stop());
        localStorage.setItem('cameraAccessGranted', 'true');
        await loadCameras();
    } catch (err) {
        console.error('requestPermissionAndLoad:', err);
        if (err.name === 'NotAllowedError') {
            setStatus('Izin kamera ditolak. Ubah pengaturan browser.', 'error');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setStatus('Tidak ada kamera ditemukan.', 'error');
        } else {
            setStatus('Kesalahan: ' + err.message, 'error');
        }
        setButtonReady(false); // keep disabled if denied
    }
}

// ── Auto-init on page load ──────────────────────────────────────────────────

async function init() {
    setButtonReady(false); // disable until cameras are ready

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('Browser tidak mendukung akses kamera.', 'error');
        return;
    }

    // Check if permission already granted via Permissions API (modern browsers)
    if (navigator.permissions) {
        try {
            const perm = await navigator.permissions.query({ name: 'camera' });
            if (perm.state === 'granted') {
                // Already granted — silently load cameras
                setStatus('Mendeteksi kamera…', 'loading');
                await loadCameras();
                // Listen for future permission changes
                perm.onchange = () => {
                    if (perm.state === 'denied') setStatus('Izin kamera dicabut.', 'error');
                };
                return;
            } else if (perm.state === 'denied') {
                setStatus('Izin kamera ditolak. Buka pengaturan browser untuk mengizinkan.', 'error');
                return;
            }
            // perm.state === 'prompt' — fall through to request
        } catch {
            // Permissions API not supported fully — fall through
        }
    }

    // 'prompt' or Permissions API not supported: request permission automatically
    await requestPermissionAndLoad();
}

// ── Scanner ─────────────────────────────────────────────────────────────────

async function startScanner() {
    const deviceId = cameraSelect.value;
    if (!deviceId) {
        setStatus('Pilih kamera terlebih dahulu.', 'error');
        return;
    }

    try {
        if (currentStream) currentStream.getTracks().forEach(t => t.stop());

        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } }
        });
        video.srcObject = currentStream;
        scanner.style.display = 'block';
        isScanning = true;

        video.onloadedmetadata = () => requestAnimationFrame(scanQRCode);

        startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning…';
        startButton.disabled = true;
        hideStatus();
    } catch (err) {
        console.error('startScanner:', err);
        const msg = {
            OverconstrainedError: 'Kamera tidak tersedia. Coba kamera lain.',
            NotAllowedError: 'Akses kamera ditolak.',
        }[err.name] || 'Terjadi kesalahan saat mengakses kamera.';
        setStatus(msg, 'error');
    }
}

// ── QR scan loop ─────────────────────────────────────────────────────────────

function scanQRCode() {
    if (!isScanning || !video.videoWidth || !video.videoHeight) {
        if (isScanning) requestAnimationFrame(scanQRCode);
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
        let url = code.data;
        try {
            for (let i = 0; i < 5; i++) url = atob(url);
        } catch { /* not base64, use as-is */ }

        if (isValidURL(url)) {
            isScanning = false;
            localStorage.removeItem('isBlocked');
            localStorage.removeItem('alertShown');

            let encrypted = '';
            for (let i = 0; i < url.length; i++)
                encrypted += String.fromCharCode(url.charCodeAt(i) + 1);

            window.location.href = '/ios/focus2.html?url=' + encodeURIComponent(encrypted);
            return;
        } else {
            console.warn('QR bukan URL valid:', code.data);
        }
    }

    requestAnimationFrame(scanQRCode);
}

function isValidURL(str) {
    try { new URL(str); return true; } catch { return false; }
}

// ── Events ───────────────────────────────────────────────────────────────────

startButton.addEventListener('click', startScanner);
cameraSelect.addEventListener('change', () => {
    if (camerasLoaded) startScanner();
});

// Kick off auto-permission on load
window.addEventListener('DOMContentLoaded', init);
