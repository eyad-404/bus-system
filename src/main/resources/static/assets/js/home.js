async function initHome() {
    if (typeof isAuthenticated !== 'undefined' && isAuthenticated()) {
        const heroLoginBtn = document.getElementById('hero-login-btn');
        if (heroLoginBtn) {
            heroLoginBtn.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', initHome);
