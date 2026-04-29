redirectIfAuthenticated();

const loginForm = document.getElementById('login-form');
const submitBtn = document.getElementById('login-submit-btn');
const formError = document.getElementById('form-error');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const togglePwBtn = document.getElementById('toggle-pw-btn');
const togglePwIcon = document.getElementById('toggle-password-icon');

const EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_CLOSED = `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

function showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
}

function clearError(el) {
    el.textContent = '';
    el.style.display = 'none';
}

function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
        ? 'Logging in…'
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Login`;
}

if (togglePwBtn) {
    togglePwBtn.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        togglePwIcon.innerHTML = isHidden ? EYE_OPEN : EYE_CLOSED;
    });
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearError(formError);
    clearError(emailError);
    clearError(passwordError);

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let valid = true;

    if (!email) {
        showError(emailError, 'Email address is required.');
        emailInput.classList.add('input-field--error');
        valid = false;
    } else {
        emailInput.classList.remove('input-field--error');
    }

    if (!password) {
        showError(passwordError, 'Password is required.');
        passwordInput.classList.add('input-field--error');
        valid = false;
    } else {
        passwordInput.classList.remove('input-field--error');
    }

    if (!valid) return;

    setLoading(true);
    try {
        await login(email, password);
    } catch {
        showError(formError, 'Invalid email or password. Please try again.');
        formError.style.display = 'block';
        setLoading(false);
    }
});
