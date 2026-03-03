import './page.css';

// Make functions globally available for onclick handlers
window.showInputSection = showInputSection;
window.redirectToLink = redirectToLink;
window.submitVerificationCode = submitVerificationCode;
window.directToExam = directToExam;

function submitVerificationCode() {
    const code = document.getElementById("verificationCode").value.trim();
    if (code) {
        const formData = new FormData();
        formData.append('code', code);

        fetch('verif.php', {
            method: 'POST',
            body: formData
        }).then(response => response.json())
          .then(data => {
            if (data.valid === true) {
                localStorage.removeItem('isBlocked');
                localStorage.setItem('isVerified', 'true');
                document.getElementById("verificationModal").style.display = "none";
                document.body.classList.remove('modal-active');
            } else {
                alert("Kode verifikasi salah. Coba lagi.");
            }
        });
    } else {
        alert("Masukkan kode verifikasi.");
    }
}

function showInputSection() {
    document.getElementById("inputSection").style.display = "block";
}

function redirectToLink() {
    const manualLink = document.getElementById("manualLink").value.trim();
    if (manualLink) {
        try {
            const url = new URL(manualLink);
            var encrypted = '';
            for (var i = 0; i < url.href.length; i++) {
                encrypted += String.fromCharCode(url.href.charCodeAt(i) + 1);
            }
            window.location.href = `/ios/focus2.html?url=${encodeURIComponent(encrypted)}`;
        } catch (error) {
            alert("Masukkan link yang benar.");
        }
    } else {
        alert("Masukkan link terlebih dahulu.");
    }
}

function directToExam() {
    var url = 'https://rayzs.my.id';
    var encrypted = '';
    for (var i = 0; i < url.length; i++) {
        encrypted += String.fromCharCode(url.charCodeAt(i) + 1);
    }
    window.location.href = `/ios/focus2.html?url=${encodeURIComponent(encrypted)}`;
}

function checkDeviceAndBrowser() {
    // Device and browser check disabled - allow all user agents
    return;
}

// Run checks on page load
window.addEventListener('load', checkDeviceAndBrowser);
