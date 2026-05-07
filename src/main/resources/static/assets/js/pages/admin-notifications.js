(function () {
  'use strict';

  var userId = localStorage.getItem('userId');
  var PAGE_SIZE = 10;
  var allNotifs = [];
  var filteredNotifs = [];
  var currentPage = 1;
  var currentFilter = 'all'; // 'all' | 'unread' | 'read'
  var searchQuery = '';

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getTypeIcon(n) {
    // Return a default bell icon; can be extended with n.type checks
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>';
  }

  function applyFilters() {
    var q = searchQuery.toLowerCase();
    filteredNotifs = allNotifs.filter(function (n) {
      var matchesStatus = currentFilter === 'all' ||
        (currentFilter === 'unread' && !n.read) ||
        (currentFilter === 'read' && n.read);
      var matchesSearch = !q ||
        (n.title || '').toLowerCase().indexOf(q) !== -1 ||
        (n.message || '').toLowerCase().indexOf(q) !== -1;
      return matchesStatus && matchesSearch;
    });
    currentPage = 1;
  }

  function loadNotifications() {
    if (!userId) return;
    apiGet('/api/notifications/user/' + userId).then(function (notifs) {
      allNotifs = Array.isArray(notifs) ? notifs : [];
      applyFilters();
      renderNotifications();
      updateSummaryCards();
      updateUnreadBadge();
    }).catch(function (err) {
      console.error('Failed to load notifications:', err);
      var container = document.getElementById('notificationsContainer');
      if (container) {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:48px; color:#ef4444;">Failed to load notifications. Please try again.</td></tr>';
      }
    });
  }

  function renderNotifications() {
    var container = document.getElementById('notificationsContainer');
    if (!container) return;

    if (filteredNotifs.length === 0) {
      container.innerHTML =
        '<tr><td colspan="4" style="text-align:center; padding:48px; color:#94a3b8;">' +
        '<div style="font-size:2.5rem; margin-bottom:12px;">🔔</div>' +
        '<p>No notifications found.</p>' +
        '</td></tr>';
      updatePaginationInfo(0, 0, 0);
      renderPagination(0);
      return;
    }

    var start = (currentPage - 1) * PAGE_SIZE;
    var page = filteredNotifs.slice(start, start + PAGE_SIZE);
    var html = '';

    page.forEach(function (n) {
      var isUnread = !n.read;
      var rowClass = isUnread ? 'unread-row hover-bg' : 'hover-bg';
      var rowStyle = isUnread ? 'font-weight: 600; background: #f0f9ff;' : 'opacity: 0.85;';
      var dotColor = isUnread ? '#3b82f6' : 'transparent';
      var iconBgColor = isUnread ? '#dbeafe' : '#f3f4f6';
      var iconColor = isUnread ? '#2563eb' : '#6b7280';
      var statusBadge = isUnread
        ? '<span class="badge badge-unread">Unread</span>'
        : '<span class="badge" style="background:#f1f5f9; color:#64748b;">Read</span>';

      html +=
        '<tr class="' + rowClass + '" style="' + rowStyle + '" data-id="' + n.id + '">' +
        '<td>' +
        '<div class="notif-cell">' +
        '<div class="notif-indicator unread-dot" style="background:' + dotColor + ';"></div>' +
        '<div class="icon-circle" style="background:' + iconBgColor + '; color:' + iconColor + ';">' +
        getTypeIcon(n) +
        '</div>' +
        '<div class="notif-text">' +
        '<strong>' + escHtml(n.title || 'Notification') + '</strong>' +
        '<p style="font-weight:400; color:#334155;">' + escHtml(n.message) + '</p>' +
        '</div>' +
        '</div>' +
        '</td>' +
        '<td>' +
        '<div class="time-stack"><span' + (isUnread ? '' : ' class="text-muted"') + '>' + timeAgo(n.createdAt) + '</span></div>' +
        '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' +
        (isUnread
          ? '<button class="btn-dots mark-read-btn" title="Mark as read" data-id="' + n.id + '">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
          '</button>'
          : '<button class="btn-dots" disabled title="Already read" style="opacity:0.4; cursor:default;">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
          '</button>') +
        '</td>' +
        '</tr>';
    });

    container.innerHTML = html;

    // Attach click listeners for mark-as-read buttons
    container.querySelectorAll('.mark-read-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-id'), 10);
        markAsRead(id);
      });
    });

    updatePaginationInfo(start + 1, Math.min(start + PAGE_SIZE, filteredNotifs.length), filteredNotifs.length);
    renderPagination(Math.ceil(filteredNotifs.length / PAGE_SIZE));
  }

  function updatePaginationInfo(from, to, total) {
    var el = document.getElementById('pageInfo');
    if (el) {
      el.textContent = total > 0
        ? 'Showing ' + from + ' to ' + to + ' of ' + total + ' notifications'
        : 'No notifications to show';
    }
  }

  function renderPagination(totalPages) {
    var container = document.getElementById('paginationContainer');
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // Prev button
    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>';
    prevBtn.disabled = currentPage === 1;
    if (currentPage === 1) prevBtn.style.opacity = '0.4';
    prevBtn.addEventListener('click', function () {
      if (currentPage > 1) { currentPage--; renderNotifications(); }
    });
    container.appendChild(prevBtn);

    // Page number buttons (max 5 shown)
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    for (var i = startPage; i <= endPage; i++) {
      (function (page) {
        var btn = document.createElement('button');
        btn.className = 'page-btn' + (page === currentPage ? ' active' : '');
        btn.textContent = page;
        btn.addEventListener('click', function () { currentPage = page; renderNotifications(); });
        container.appendChild(btn);
      })(i);
    }

    // Next button
    var nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn outline';
    nextBtn.innerHTML = 'Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
    nextBtn.disabled = currentPage === totalPages;
    if (currentPage === totalPages) nextBtn.style.opacity = '0.4';
    nextBtn.addEventListener('click', function () {
      if (currentPage < totalPages) { currentPage++; renderNotifications(); }
    });
    container.appendChild(nextBtn);
  }

  function updateSummaryCards() {
    var unread = allNotifs.filter(function (n) { return !n.read; }).length;
    var total = allNotifs.length;
    var unreadEl = document.getElementById('summaryUnreadCount');
    var totalEl = document.getElementById('summaryTotalCount');
    if (unreadEl) unreadEl.textContent = unread;
    if (totalEl) totalEl.textContent = total;
  }

  function updateUnreadBadge() {
    var unread = allNotifs.filter(function (n) { return !n.read; }).length;
    var badge = document.getElementById('unreadBadge');
    if (badge) {
      badge.textContent = unread > 0 ? unread : '';
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
    // Also update global badge
    var globalBadge = document.querySelector('.notification-badge');
    if (globalBadge && globalBadge !== badge) {
      globalBadge.textContent = unread > 0 ? unread : '';
      globalBadge.style.display = unread > 0 ? 'flex' : 'none';
    }
  }

  function markAsRead(id) {
    apiPut('/api/notifications/' + id + '/read', {}).then(function () {
      var notif = allNotifs.find(function (n) { return n.id === id; });
      if (notif) notif.read = true;
      applyFilters();
      renderNotifications();
      updateSummaryCards();
      updateUnreadBadge();
      if (window.refreshNotifications) window.refreshNotifications();
    }).catch(console.error);
  }

  function markAllRead() {
    if (!userId) return;
    apiPut('/api/notifications/user/' + userId + '/mark-all-read', {}).then(function () {
      allNotifs.forEach(function (n) { n.read = true; });
      applyFilters();
      renderNotifications();
      updateSummaryCards();
      updateUnreadBadge();
      if (window.refreshNotifications) window.refreshNotifications();
    }).catch(console.error);
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadNotifications();

    var markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) markAllBtn.addEventListener('click', markAllRead);

    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = this.value.trim();
        applyFilters();
        renderNotifications();
      });
    }

    var filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
      filterStatus.addEventListener('change', function () {
        currentFilter = this.value;
        applyFilters();
        renderNotifications();
      });
    }

    var filterUnreadBtn = document.getElementById('filterUnreadBtn');
    if (filterUnreadBtn) {
      filterUnreadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        currentFilter = 'unread';
        var filterStatusEl = document.getElementById('filterStatus');
        if (filterStatusEl) filterStatusEl.value = 'unread';
        applyFilters();
        renderNotifications();
      });
    }

    var filterAllBtn = document.getElementById('filterAllBtn');
    if (filterAllBtn) {
      filterAllBtn.addEventListener('click', function (e) {
        e.preventDefault();
        currentFilter = 'all';
        var filterStatusEl = document.getElementById('filterStatus');
        if (filterStatusEl) filterStatusEl.value = 'all';
        applyFilters();
        renderNotifications();
      });
    }
  });
})();
