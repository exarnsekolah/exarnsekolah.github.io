import './focus2.css';

// ── URL decode ───────────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const iframeUrl = params.get('url');

let iframeSrc = '';
if (iframeUrl) {
    let decrypted = '';
    for (let i = 0; i < iframeUrl.length; i++)
        decrypted += String.fromCharCode(iframeUrl.charCodeAt(i) - 1);
    try {
        iframeSrc = new URL(decrypted).href;
    } catch {
        iframeSrc = decrypted;
    }
}

// ── Elements ─────────────────────────────────────────────────────────────────
const iframe = document.getElementById('myIframe');
const overlay = document.getElementById('overlay');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const btnRefresh = document.getElementById('btnRefresh');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnExit = document.getElementById('btnExit');
const iconExpand = document.getElementById('iconExpand');
const iconCompress = document.getElementById('iconCompress');
const clockEl = document.getElementById('clock');
const batteryEl = document.getElementById('battery');
const customAlert = document.getElementById('customAlert');

// ── Load iframe ──────────────────────────────────────────────────────────────
if (iframeSrc) iframe.src = iframeSrc;

// ── Real-time clock (24h HH:MM:SS) ──────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
}
updateClock();
setInterval(updateClock, 1000);

// ── Battery API ──────────────────────────────────────────────────────────────
async function initBattery() {
    if (!navigator.getBattery) {
        batteryEl.textContent = '🔋';
        return;
    }
    try {
        const bat = await navigator.getBattery();
        const update = () => {
            const pct = Math.round(bat.level * 100);
            batteryEl.textContent = `${pct}%`;
        };
        update();
        bat.addEventListener('levelchange', update);
        bat.addEventListener('chargingchange', update);
    } catch {
        batteryEl.textContent = '–%';
    }
}
initBattery();

// ── Fullscreen ───────────────────────────────────────────────────────────────
let isFullscreen = false;
let alertCount = 0;

function enterFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.mozRequestFullScreen ||
        el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) req.call(el).catch(() => { });
}

function exitFullscreen() {
    const exit = document.exitFullscreen || document.mozCancelFullScreen ||
        document.webkitExitFullscreen || document.msExitFullscreen;
    if (exit) exit.call(document).catch(() => { });
}

function syncFullscreenUI(fs) {
    isFullscreen = fs;
    iconExpand.style.display = fs ? 'none' : '';
    iconCompress.style.display = fs ? '' : 'none';
}

// island fullscreen button — toggle
btnFullscreen.addEventListener('click', () => {
    document.fullscreenElement ? exitFullscreen() : enterFullscreen();
});

// overlay "Go Fullscreen" button
fullscreenBtn.addEventListener('click', () => {
    overlay.style.display = 'none'; // Sembunyikan permanen setelah diklik
    enterFullscreen();
});

document.addEventListener('fullscreenchange', () => {
    const fs = !!document.fullscreenElement;
    syncFullscreenUI(fs);

    if (fs) {
        overlay.style.display = 'none';
    } else {
        showAlert('Keluar dari fullscreen. Tekan tombol expand di atas untuk kembali.');
    }
});

// ── Refresh ──────────────────────────────────────────────────────────────────
btnRefresh.addEventListener('click', () => {
    if (iframe.src) {
        iframe.src = iframe.src; // reload
    } else if (iframeSrc) {
        iframe.src = iframeSrc;
    }
});

// ── Exit (dummy — just go back) ───────────────────────────────────────────────
btnExit.addEventListener('click', () => {
    // dummy — navigate to page.html (soft exit)
    window.location.href = '/ios/page.html';
});

// ── Visibility / focus guard ─────────────────────────────────────────────────
// BAD CODE FOR EXAM 🤣🤣

// document.addEventListener('visibilitychange', () => {
//     if (document.visibilityState === 'hidden' && isFullscreen) {
//         alertCount++;
//         if (alertCount >= 1) {
//             localStorage.setItem('isBlocked', 'true');
//             localStorage.setItem('isVerified', 'false');
//             setTimeout(() => { window.location.href = '/ios/page.html'; }, 2000);
//         }
//         showAlert('Anda meninggalkan halaman. Kembali ke fullscreen.');
//     }
// });

// ── Alert helper ─────────────────────────────────────────────────────────────
let alertTimer = null;
function showAlert(msg) {
    customAlert.textContent = msg;
    customAlert.style.display = 'block';
    clearTimeout(alertTimer);
    alertTimer = setTimeout(() => { customAlert.style.display = 'none'; }, 3000);
}
