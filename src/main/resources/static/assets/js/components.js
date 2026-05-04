document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  const notificationBtn = document.getElementById('notificationBtn');
  const notificationSidebar = document.getElementById('notificationSidebar');
  const closeNotifBtn = document.getElementById('closeNotifBtn');

  function openSidebar() {
    if (notificationSidebar && notificationSidebar.classList.contains('open')) {
      notificationSidebar.classList.remove('open');
    }
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (notificationSidebar) notificationSidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function openNotificationSidebar() {
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
    notificationSidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  if (hamburgerBtn && sidebar && sidebarOverlay) {
    hamburgerBtn.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (notificationBtn && notificationSidebar && sidebarOverlay) {
    notificationBtn.addEventListener('click', () => {
      if (notificationSidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openNotificationSidebar();
        loadSidebarNotifications();
      }
    });
  }

  function loadSidebarNotifications() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const container = notificationSidebar.querySelector('.notif-sidebar-content');
    if (!container) return;

    // Show loading state
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">Loading...</div>';

    fetch(`/api/notifications/user/${userId}`)
      .then(res => res.json())
      .then(notifs => {
        container.innerHTML = '';
        const recent = notifs.slice(0, 5);
        if (recent.length === 0) {
          container.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">No notifications</div>';
          return;
        }

        recent.forEach(n => {
          const item = document.createElement('div');
          item.className = 'notif-sidebar-item' + (n.read ? '' : ' unread');
          item.style.cursor = 'pointer';
          item.innerHTML = `
            <strong>${n.title || 'Notification'}</strong>
            <p>${n.message}</p>
            <span>${timeAgo(n.createdAt)}</span>
          `;
          item.onclick = () => {
            if (!n.read) {
              fetch(`/api/notifications/${n.id}/read`, { method: 'PUT' })
                .then(() => {
                  if (window.refreshNotifications) {
                    window.refreshNotifications();
                  } else {
                    loadSidebarNotifications();
                  }
                });
            }
          };
          container.appendChild(item);
        });
      })
      .catch(err => {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Error loading notifications</div>';
      });
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (closeNotifBtn) {
    closeNotifBtn.addEventListener('click', closeSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ((sidebar && sidebar.classList.contains('open')) || (notificationSidebar && notificationSidebar.classList.contains('open'))) {
        closeSidebar();
      }
    }
  });

  // Global unread count
  function updateGlobalUnreadCount() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    fetch(`/api/notifications/user/${userId}/unread-count`)
      .then(res => res.json())
      .then(data => {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
          if (data.unreadCount > 0) {
            badge.textContent = data.unreadCount;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }
      })
      .catch(() => {});
  }

  updateGlobalUnreadCount();

  // Expose global refresh
  window.refreshNotifications = function() {
    updateGlobalUnreadCount();
    if (notificationSidebar && notificationSidebar.classList.contains('open')) {
      loadSidebarNotifications();
    }
  };
});
