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
      }
    });
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
});
