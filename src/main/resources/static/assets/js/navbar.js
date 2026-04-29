function updateNavForUser(user) {
    const navActions = document.getElementById('nav-auth-actions');
    if (!navActions) return;

    let dashboardLink = '';
    if (user.role === 'ADMIN') {
        dashboardLink = '/pages/admin/admin-dashboard.html';
    } else if (user.role === 'DRIVER') {
        dashboardLink = '/pages/driver/driver-dashboard.html';
    } else if (user.role === 'STUDENT') {
        dashboardLink = '/pages/student/student-dashboard.html';
    }

    const roleBadgeColor = { ADMIN: '#e53935', DRIVER: '#1e88e5', STUDENT: '#43a047' };
    const color = roleBadgeColor[user.role] || '#666';

    navActions.innerHTML = `
        ${dashboardLink ? `<a href="${dashboardLink}" class="nav-link" style="margin-right: 15px; font-weight: 600;">Dashboard</a>` : ''}
        <span class="nav-user-badge" id="nav-user-badge" style="background:${color}20;color:${color};border:1px solid ${color}40;">
            ${user.role}
        </span>
        <span class="nav-user-email" id="nav-user-email">${user.email}</span>
        <button class="nav-btn-logout" id="nav-logout-btn" onclick="logout()">Logout</button>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof isAuthenticated !== 'undefined' && typeof getCurrentUser !== 'undefined') {
        if (isAuthenticated()) {
            const user = getCurrentUser();
            if (user) {
                updateNavForUser(user);
            }
        }
    }
});
