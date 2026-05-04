(function () {
  'use strict';

  var userId = localStorage.getItem('userId');
  var PAGE_SIZE = 10;
  var allNotifs = [];
  var currentPage = 1;

  function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function loadNotifications() {
    if (!userId) return;
    apiGet('/api/notifications/user/' + userId).then(function (notifs) {
      allNotifs = notifs || [];
      renderNotifications();
      updateUnreadBadge();
    }).catch(function (err) {
      console.error('Failed to load notifications:', err);
    });
  }

  function renderNotifications() {
    var container = document.getElementById('notificationsContainer');
    if (!container) return;

    var start = (currentPage - 1) * PAGE_SIZE;
    var page = allNotifs.slice(start, start + PAGE_SIZE);

    if (allNotifs.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:48px;color:#94a3b8;"><div style="font-size:2.5rem;margin-bottom:12px;">🔔</div><p>No notifications yet.</p></div>';
      return;
    }

    container.innerHTML = '';
    page.forEach(function (n) {
      var div = document.createElement('div');
      div.className = 'notif-item' + (n.read ? '' : ' unread');
      div.dataset.id = n.id;
      div.innerHTML =
        '<div class="notif-icon ' + (n.read ? 'bg-gray-light' : 'bg-blue-light text-blue') + '">' +
          '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
        '</div>' +
        '<div class="notif-body">' +
          '<strong class="notif-title">' + escHtml(n.title || 'Notification') + '</strong>' +
          '<p class="notif-msg">' + escHtml(n.message) + '</p>' +
          '<span class="notif-time">' + timeAgo(n.createdAt) + '</span>' +
        '</div>' +
        (n.read ? '' : '<span class="unread-dot"></span>');
      div.addEventListener('click', function () { markAsRead(n.id, div); });
      container.appendChild(div);
    });

    renderPagination();
  }

  function renderPagination() {
    var container = document.getElementById('paginationContainer');
    if (!container) return;
    var totalPages = Math.ceil(allNotifs.length / PAGE_SIZE);
    container.innerHTML = '';
    for (var i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      (function (page) {
        btn.addEventListener('click', function () { currentPage = page; renderNotifications(); });
      })(i);
      container.appendChild(btn);
    }
  }

  function updateUnreadBadge() {
    var unread = allNotifs.filter(function (n) { return !n.read; }).length;
    var badge = document.getElementById('unreadBadge');
    if (badge) badge.textContent = unread > 0 ? unread : '';
  }

  function markAsRead(id, el) {
    apiPut('/api/notifications/' + id + '/read', {}).then(function () {
      el.classList.remove('unread');
      var dot = el.querySelector('.unread-dot');
      if (dot) dot.remove();
      var notif = allNotifs.find(function (n) { return n.id === id; });
      if (notif) notif.read = true;
      updateUnreadBadge();
    }).catch(console.error);
  }

  function markAllRead() {
    if (!userId) return;
    apiPut('/api/notifications/user/' + userId + '/mark-all-read', {}).then(function () {
      allNotifs.forEach(function (n) { n.read = true; });
      renderNotifications();
      updateUnreadBadge();
    }).catch(console.error);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof requireAuth === 'function') requireAuth('ADMIN');
    loadNotifications();
    var markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) markAllBtn.addEventListener('click', markAllRead);
  });
})();
