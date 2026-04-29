requireAuth();

const cpForm = document.getElementById('cp-form');
const submitBtn = document.getElementById('cp-submit-btn');
const errorBanner = document.getElementById('cp-error');
const newPasswordInput = document.getElementById('cp-new-password');
const confirmPasswordInput = document.getElementById('cp-confirm-password');

document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', function () {
        const input = this.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
    });
});

function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.style.display = 'block';
}

function clearError() {
    errorBanner.textContent = '';
    errorBanner.style.display = 'none';
}

function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
        ? 'Updating…'
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> Update Password`;
}

cpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!newPassword || newPassword.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    setLoading(true);
    try {
        await changePassword(newPassword);
    } catch (err) {
        showError('Failed to update password. Please try again.');
    } finally {
        setLoading(false);
    }
});
