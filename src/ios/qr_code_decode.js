import './qr_code.css';
import { fromBase64 } from 'js-base64';

const video = document.querySelector('#preview');
const cameraSelect = document.querySelector('#cameraSelect');
const startButton = document.querySelector('#startButton');
const scanner = document.querySelector('#scanner');
const resultBox = document.querySelector('#resultBox');
const resultText = document.querySelector('#resultText');
const copyBtn = document.querySelector('#copyBtn');
const decodeSteps = document.querySelector('#decodeSteps');

let currentStream = null;
let isScanning = false;
let lastScanned = null;

// ── helpers ──────────────────────────────────────────────────────────────────

function isBase64(str) {
    try {
        // Must be non-empty and match base64 charset
        return str.length > 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(str.trim()) && fromBase64(str).length > 0;
    } catch {
        return false;
    }
}

function isValidURL(str) {
    try { new URL(str); return true; } catch { return false; }
}

/**
 * Decode base64 repeatedly until it can no longer be decoded or max rounds reached.
 * Returns { result, steps } where steps is an array of intermediate values.
 */
function decodeBase64Loop(raw, maxRounds = 10) {
    let current = raw.trim();
    const steps = [];
    for (let i = 0; i < maxRounds; i++) {
        if (!isBase64(current)) break;
        try {
            const decoded = fromBase64(current);
            steps.push({ round: i + 1, value: decoded });
            current = decoded.trim();
        } catch {
            break;
        }
    }
    return { result: current, steps };
}

// ── camera ───────────────────────────────────────────────────────────────────

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
        if (cameraSelect.options.length === 0) alert('Tidak ada kamera ditemukan.');
    } catch (err) {
        console.error('loadCameras:', err);
        alert('Gagal memuat daftar kamera.');
    }
}

async function startScanner() {
    const deviceId = cameraSelect.value;
    if (!deviceId) { alert('Pilih kamera terlebih dahulu'); return; }
    try {
        if (currentStream) currentStream.getTracks().forEach(t => t.stop());
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
        video.srcObject = currentStream;
        scanner.style.display = 'block';
        isScanning = true;
        lastScanned = null;
        video.onloadedmetadata = () => requestAnimationFrame(scanQRCode);
        startButton.textContent = 'Mulai Pemindaian';
        localStorage.setItem('cameraAccessGranted', 'true');
    } catch (err) {
        console.error('startScanner:', err);
        const msg = {
            OverconstrainedError: 'Kamera tidak tersedia. Coba kamera lain.',
            NotAllowedError: 'Akses kamera ditolak.',
        }[err.name] || 'Terjadi kesalahan saat mengakses kamera.';
        alert(msg);
    }
}

// ── QR scanning ──────────────────────────────────────────────────────────────

function scanQRCode() {
    if (!isScanning || !video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(scanQRCode);
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code && code.data !== lastScanned) {
        lastScanned = code.data;
        handleResult(code.data);
    }

    requestAnimationFrame(scanQRCode);
}

// ── result display ───────────────────────────────────────────────────────────

function handleResult(raw) {
    const { result, steps } = decodeBase64Loop(raw);

    // Build step list
    decodeSteps.innerHTML = '';
    if (steps.length > 0) {
        const label = document.createElement('p');
        label.className = 'steps-label';
        label.textContent = `Base64 didekode ${steps.length}x:`;
        decodeSteps.appendChild(label);
        steps.forEach(s => {
            const el = document.createElement('div');
            el.className = 'step-item';
            el.textContent = `[${s.round}] ${s.value.length > 80 ? s.value.slice(0, 80) + '…' : s.value}`;
            decodeSteps.appendChild(el);
        });
    }

    // Show final result
    const isLink = isValidURL(result);
    resultText.textContent = result;

    if (isLink) {
        resultText.href = result;
        resultText.target = '_blank';
        resultText.rel = 'noopener noreferrer';
        resultText.classList.add('is-link');
        copyBtn.style.display = 'inline-flex';
    } else {
        resultText.removeAttribute('href');
        resultText.classList.remove('is-link');
        copyBtn.style.display = 'none';
    }

    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── copy button ──────────────────────────────────────────────────────────────

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(resultText.textContent);
        copyBtn.textContent = '✓ Tersalin!';
        copyBtn.disabled = true;
        setTimeout(() => {
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
            copyBtn.disabled = false;
        }, 2000);
    } catch {
        alert('Gagal menyalin. Salin manual.');
    }
});

// ── events ───────────────────────────────────────────────────────────────────

startButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            stream.getTracks().forEach(t => t.stop());
            loadCameras();
            startScanner();
        })
        .catch(err => {
            const msg = {
                NotAllowedError: 'Izin kamera ditolak.',
                NotFoundError: 'Tidak ada kamera ditemukan.',
                DevicesNotFoundError: 'Tidak ada kamera ditemukan.',
            }[err.name] || 'Terjadi kesalahan: ' + err.message;
            alert(msg);
        });
});

cameraSelect.addEventListener('change', startScanner);

window.onload = () => {/* compatible check disabled */ };
