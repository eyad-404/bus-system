(function () {
  'use strict';

  var userId    = localStorage.getItem('userId');
  var PAGE_SIZE = 10;
  var allNotifs = [];
  var filtered  = [];
  var currentPage = 1;

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var d    = new Date(dateStr);
    var diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60)    return diff + 's ago';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ── Load ─────────────────────────────────────────────────────────────────
  function loadNotifications() {
    if (!userId) return;
    apiGet('/api/notifications/user/' + userId).then(function (notifs) {
      allNotifs = notifs || [];
      filtered  = allNotifs.slice();
      updateSummary();
      renderNotifications();
    }).catch(function (err) {
      console.error('Failed to load notifications:', err);
    });
  }

  // ── Summary cards ─────────────────────────────────────────────────────────
  function updateSummary() {
    var unread = allNotifs.filter(function (n) { return !n.read; }).length;
    var unreadEl = document.getElementById('summaryUnreadCount');
    var totalEl  = document.getElementById('summaryTotalCount');
    if (unreadEl) unreadEl.textContent = unread;
    if (totalEl)  totalEl.textContent  = allNotifs.length;

    // Update top badge too
    var badge = document.querySelector('.notification-badge');
    if (badge) {
      badge.textContent = unread > 0 ? unread : '';
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }

    if (window.refreshNotifications) window.refreshNotifications();
  }

  // ── Render list ───────────────────────────────────────────────────────────
  function renderNotifications() {
    var container = document.getElementById('notificationsContainer');
    if (!container) return;

    var start = (currentPage - 1) * PAGE_SIZE;
    var page  = filtered.slice(start, start + PAGE_SIZE);

    if (filtered.length === 0) {
      container.innerHTML =
        '<div class="notif-empty">' +
          '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
          '<p>No notifications yet.</p>' +
        '</div>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    container.innerHTML = '';
    page.forEach(function (n) {
      var div = document.createElement('div');
      div.className = 'notif-row' + (n.read ? '' : ' unread');
      div.dataset.id = n.id;

      div.innerHTML =
        '<div class="notif-row-icon ' + (n.read ? 'read-icon' : 'unread-icon') + '">' +
          '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
        '</div>' +
        '<div class="notif-row-body">' +
          '<div class="notif-row-title">' +
            escHtml(n.title || 'Bus Update') +
            (n.read ? '' : '<span class="notif-row-dot"></span>') +
          '</div>' +
          '<div class="notif-row-msg">' + escHtml(n.message) + '</div>' +
        '</div>' +
        '<span class="notif-row-time">' + timeAgo(n.createdAt) + '</span>';

      div.addEventListener('click', function () { markAsRead(n.id, div, n); });
      container.appendChild(div);
    });

    renderPagination();
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  function renderPagination() {
    var container  = document.getElementById('paginationContainer');
    if (!container) return;
    var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    container.innerHTML = '';
    if (totalPages <= 1) return;
    for (var i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.className   = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      (function (page) {
        btn.addEventListener('click', function () { currentPage = page; renderNotifications(); });
      })(i);
      container.appendChild(btn);
    }
  }

  // ── Mark as read ──────────────────────────────────────────────────────────
  function markAsRead(id, el, n) {
    if (n.read) return;
    apiPut('/api/notifications/' + id + '/read', {}).then(function () {
      n.read = true;
      el.classList.remove('unread');
      var dot = el.querySelector('.notif-row-dot');
      if (dot) dot.remove();
      var icon = el.querySelector('.notif-row-icon');
      if (icon) { icon.classList.remove('unread-icon'); icon.classList.add('read-icon'); }
      updateSummary();
    }).catch(console.error);
  }

  // ── Mark all read ─────────────────────────────────────────────────────────
  function markAllRead() {
    if (!userId) return;
    apiPut('/api/notifications/user/' + userId + '/mark-all-read', {}).then(function () {
      allNotifs.forEach(function (n) { n.read = true; });
      filtered = allNotifs.slice();
      renderNotifications();
      updateSummary();
    }).catch(console.error);
  }

  // ── Search ────────────────────────────────────────────────────────────────
  function applySearch(q) {
    q = (q || '').toLowerCase();
    filtered = q
      ? allNotifs.filter(function (n) {
          return (n.title || '').toLowerCase().indexOf(q) !== -1 ||
                 (n.message || '').toLowerCase().indexOf(q) !== -1;
        })
      : allNotifs.slice();
    currentPage = 1;
    renderNotifications();
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof requireAuth === 'function') requireAuth('STUDENT');
    loadNotifications();

    var markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) markAllBtn.addEventListener('click', markAllRead);

    var searchInput = document.getElementById('notifSearch');
    if (searchInput) searchInput.addEventListener('input', function () { applySearch(this.value); });
  });
})();
