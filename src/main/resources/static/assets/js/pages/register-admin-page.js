const raForm = document.getElementById('ra-form');
const submitBtn = document.getElementById('ra-submit-btn');
const errorBanner = document.getElementById('ra-error');
const nameInput = document.getElementById('ra-name');
const emailInput = document.getElementById('ra-email');
const passwordInput = document.getElementById('ra-password');
const nameError = document.getElementById('ra-name-error');
const emailError = document.getElementById('ra-email-error');
const passwordError = document.getElementById('ra-password-error');
const togglePwBtn = document.getElementById('ra-toggle-pw');
const togglePwIcon = document.getElementById('ra-pw-icon');

const EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_CLOSED = `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

togglePwBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePwIcon.innerHTML = isHidden ? EYE_OPEN : EYE_CLOSED;
});

function showFieldError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
}

function clearFieldError(el) {
    el.textContent = '';
    el.style.display = 'none';
}

function showBannerError(msg) {
    errorBanner.textContent = msg;
    errorBanner.style.display = 'block';
}

function clearBannerError() {
    errorBanner.textContent = '';
    errorBanner.style.display = 'none';
}

function disableForm() {
    raForm.querySelectorAll('input, button[type="submit"]').forEach(el => el.disabled = true);
}

function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
        ? 'Creating account…'
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Create Admin Account`;
}

raForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBannerError();
    clearFieldError(nameError);
    clearFieldError(emailError);
    clearFieldError(passwordError);

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let valid = true;

    if (!name || name.length < 3) {
        showFieldError(nameError, 'Name must be at least 3 characters.');
        valid = false;
    }

    if (!email) {
        showFieldError(emailError, 'Email is required.');
        valid = false;
    }

    if (!password || password.length < 6) {
        showFieldError(passwordError, 'Password must be at least 6 characters.');
        valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
        await registerAdmin(name, email, password);
    } catch (err) {
        const message = err.message || '';
        if (message.toLowerCase().includes('admin already exists')) {
            showBannerError('An admin account already exists. Only one admin is allowed.');
            disableForm();
        } else {
            showBannerError('Registration failed. Please try again.');
        }
    } finally {
        setLoading(false);
    }
});
