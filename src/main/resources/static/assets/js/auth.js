const ROUTES = {
    ADMIN: '/pages/admin/admin-dashboard.html',
    DRIVER: '/pages/driver/driver-dashboard.html',
    STUDENT: '/pages/student/student-dashboard.html',
    LOGIN: '/pages/common/login.html',
    CHANGE_PASSWORD: '/pages/common/change-password.html',
};

function getToken() {
    return localStorage.getItem('token');
}

function getRole() {
    return localStorage.getItem('role');
}

function getFirstLogin() {
    return localStorage.getItem('firstLogin') === 'true';
}

function isAuthenticated() {
    return !!getToken();
}

function decodeTokenPayload(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

function getCurrentUser() {
    const token = getToken();
    if (!token) return null;
    const payload = decodeTokenPayload(token);
    if (!payload) return null;
    return {
        email: payload.sub,
        role: payload.role || getRole(),
    };
}

function getDashboardRoute(role) {
    return ROUTES[role] || ROUTES.LOGIN;
}

function redirectByRole(role) {
    window.location.replace(getDashboardRoute(role));
}

function requireAuth(requiredRole) {
    if (!isAuthenticated()) {
        window.location.replace(ROUTES.LOGIN);
        return;
    }

    const role = getRole();

    if (requiredRole && role !== requiredRole) {
        window.location.replace(getDashboardRoute(role));
        return;
    }
}

function redirectIfAuthenticated() {
    if (!isAuthenticated()) return;
    const role = getRole();
    if (getFirstLogin()) {
        window.location.replace(ROUTES.CHANGE_PASSWORD);
    } else {
        redirectByRole(role);
    }
}

async function login(email, password) {
    const data = await apiPost('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('firstLogin', data.firstLogin);

    if (data.firstLogin) {
        window.location.replace(ROUTES.CHANGE_PASSWORD);
    } else {
        redirectByRole(data.role);
    }
}

async function changePassword(newPassword) {
    await apiPost('/auth/change-password', { newPassword });
    localStorage.setItem('firstLogin', 'false');
    redirectByRole(getRole());
}

async function registerAdmin(name, email, password) {
    await apiPost('/auth/register-admin', { name, email, password });
    window.location.replace(ROUTES.LOGIN);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('firstLogin');
    window.location.replace(ROUTES.LOGIN);
}
