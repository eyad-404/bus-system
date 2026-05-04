async function initHome() {
    if (typeof isAuthenticated !== 'undefined' && isAuthenticated()) {
        const heroLoginBtn = document.getElementById('hero-login-btn');
        if (heroLoginBtn) {
            heroLoginBtn.remove();
        }
    }

    try {
        const hasAdminResponse = await fetch('http://localhost:8080/auth/has-admin');
        if (hasAdminResponse.ok) {
            const hasAdminText = await hasAdminResponse.text();
            if (hasAdminText === 'false') {
                const modal = document.getElementById('adminSetupModal');
                const form = document.getElementById('adminSetupForm');
                if (modal && form) {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';

                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const btn = form.querySelector('button');
                        btn.textContent = 'Creating...';
                        btn.disabled = true;

                        const name = document.getElementById('setupName').value;
                        const email = document.getElementById('setupEmail').value;
                        const password = document.getElementById('setupPassword').value;

                        try {
                            if (typeof registerAdmin === 'function') {
                                await registerAdmin(name, email, password);
                            } else {
                                await apiPost('/auth/register-admin', { name, email, password });
                                window.location.replace('/pages/common/login.html');
                            }
                        } catch (err) {
                            alert('Failed to setup admin: ' + err.message);
                            btn.textContent = 'Create Admin Account';
                            btn.disabled = false;
                        }
                    });
                }
            }
        }
    } catch (e) {
        console.error('Failed to check admin status:', e);
    }
}

document.addEventListener('DOMContentLoaded', initHome);
