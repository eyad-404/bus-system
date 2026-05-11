(function () {
  'use strict';

  function setEl(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
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

  var pollInterval = null;
  var POLL_MS = 15000;

  function loadDashboard() {
    Promise.all([
      apiGet('/admin/students'),
      apiGet('/admin/drivers'),
      apiGet('/admin/routes'),
      apiGet('/api/trips/active')
    ]).then(function (results) {
      var students    = results[0] || [];
      var drivers     = results[1] || [];
      var routes      = results[2] || [];
      var activeTrips = results[3] || [];

      setEl('statTotalStudents', students.length);
      setEl('statTotalDrivers',  drivers.length);
      setEl('statTotalRoutes',   routes.length);
      setEl('statActiveTrips',   activeTrips.length);

      renderRouteMonitoring(activeTrips);
    }).catch(function (err) {
      console.error('Dashboard load error:', err);
    });

    loadRecentNotifications();
  }

  function pollActiveTrips() {
    apiGet('/api/trips/active').then(function (activeTrips) {
      activeTrips = activeTrips || [];
      setEl('statActiveTrips', activeTrips.length);
      renderRouteMonitoring(activeTrips);
      updateLiveIndicator();
    }).catch(function (err) {
      console.error('Poll error:', err);
    });
  }

  function updateLiveIndicator() {
    var label = document.getElementById('dashLastUpdated');
    if (label) label.textContent = 'Updated ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var dot = document.getElementById('dashPulseDot');
    if (dot) {
      dot.style.transform = 'scale(1.8)';
      dot.style.opacity = '0.4';
      setTimeout(function () { dot.style.transform = ''; dot.style.opacity = ''; }, 500);
    }
  }

  // ── Live Route Monitoring Cards ───────────────────────────────────────────
  function renderRouteMonitoring(trips) {
    var container = document.getElementById('activeTripsContainer');
    if (!container) return;

    if (!trips || trips.length === 0) {
      container.innerHTML =
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;gap:12px;color:#9ca3af;">' +
          '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/></svg>' +
          '<p style="margin:0;font-size:0.9rem;font-weight:500;">No active trips right now</p>' +
          '<p style="margin:0;font-size:0.8rem;">Trips will appear here once drivers start their routes.</p>' +
        '</div>';
      return;
    }

    container.innerHTML = '';
    trips.forEach(function (t) {
      var stations  = t.stationProgress || [];
      var total     = stations.length;
      var current   = typeof t.currentStationIndex === 'number' ? t.currentStationIndex : 0;
      var pct       = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
      var remaining = Math.max(0, total - current - 1);

      // Use stationProgress as source of truth for current station name
      var curStation     = stations[current] || {};
      var curStationName = curStation.stationName || t.currentStationName || '—';
      var isArrived      = curStation.hasArrived;
      var statusLabel    = isArrived
        ? '<span style="font-size:0.7rem;color:#15803d;display:block;line-height:1.2;">\uD83D\uDEA9 Arrived at</span>'
        : '<span style="font-size:0.7rem;color:#92400e;display:block;line-height:1.2;">\uD83D\uDD52 Approaching</span>';

      var card = document.createElement('div');
      card.className = 'route-monitor-card';
      card.innerHTML =
        '<div class="rmc-header">' +
          '<div class="rmc-route-info">' +
            '<span class="rmc-route-name">' + escHtml(t.routeName || 'Unknown Route') + '</span>' +
            (t.routeCode ? '<span class="rmc-route-code">' + escHtml(t.routeCode) + '</span>' : '') +
          '</div>' +
          '<span class="rmc-badge-live">&bull; Live</span>' +
        '</div>' +
        '<div class="rmc-stats">' +
          '<div class="rmc-stat">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
            '<span>' + escHtml(t.driverName || 'No driver') + '</span>' +
          '</div>' +
          '<div class="rmc-stat">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' +
            '<span>' + statusLabel + escHtml(curStationName) + '</span>' +
          '</div>' +
          '<div class="rmc-stat rmc-stat-right">' +
            '<span class="rmc-stations-left">' + remaining + ' stop' + (remaining !== 1 ? 's' : '') + ' left</span>' +
          '</div>' +
        '</div>' +
        '<div class="rmc-progress-wrap">' +
          '<div class="rmc-progress-bar">' +
            '<div class="rmc-progress-fill" style="width:' + pct + '%;"></div>' +
          '</div>' +
          '<div class="rmc-progress-labels">' +
            '<span>' + (current + 1) + ' / ' + total + ' stations</span>' +
            '<span>' + pct + '%</span>' +
          '</div>' +
        '</div>';

      container.appendChild(card);
    });
  }

  // ── Recent Notifications ──────────────────────────────────────────────────
  function loadRecentNotifications() {
    var userId = localStorage.getItem('userId');
    var container = document.getElementById('recentActivityContainer');
    if (!container) return;

    if (!userId) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:24px;">Sign in to view notifications.</p>';
      return;
    }

    apiGet('/api/notifications/user/' + userId).then(function (notifs) {
      notifs = notifs || [];
      container.innerHTML = '';

      if (notifs.length === 0) {
        container.innerHTML =
          '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;gap:8px;color:#9ca3af;">' +
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
            '<p style="margin:0;font-size:0.88rem;">No notifications yet</p>' +
          '</div>';
        return;
      }

      notifs.slice(0, 6).forEach(function (n) {
        var item = document.createElement('div');
        item.className = 'notification-item' + (n.read ? '' : ' notif-unread');
        item.style.cursor = 'pointer';
        item.innerHTML =
          '<div class="noti-icon' + (n.read ? '' : ' noti-icon-unread') + '">' +
            '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
          '</div>' +
          '<div class="noti-content">' +
            '<div class="noti-title">' + escHtml(n.title || 'Notification') + (n.read ? '' : ' <span class="noti-dot"></span>') + '</div>' +
            '<div class="noti-message">' + escHtml(n.message) + '</div>' +
          '</div>' +
          '<span class="noti-time">' + timeAgo(n.createdAt) + '</span>';

        item.onclick = function () {
          if (!n.read) {
            apiPut('/api/notifications/' + n.id + '/read', {}).then(function () {
              n.read = true;
              item.classList.remove('notif-unread');
              var dot = item.querySelector('.noti-dot');
              if (dot) dot.remove();
              var icon = item.querySelector('.noti-icon');
              if (icon) icon.classList.remove('noti-icon-unread');
              if (window.refreshNotifications) window.refreshNotifications();
            }).catch(console.error);
          }
        };

        container.appendChild(item);
      });
    }).catch(function (err) {
      console.error('Failed to load notifications:', err);
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:24px;color:#ef4444;">Failed to load notifications.</p>';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof requireAuth === 'function') requireAuth('ADMIN');
    loadDashboard();

    // Inject live indicator next to the section heading
    var monHeading = document.querySelector('#activeTripsContainer');
    if (monHeading) {
      var liveBar = document.getElementById('dashLiveBar');
      if (!liveBar) {
        liveBar = document.createElement('div');
        liveBar.id = 'dashLiveBar';
        liveBar.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#6b7280;padding:4px 0 8px 0;';
        liveBar.innerHTML =
          '<span id="dashPulseDot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;flex-shrink:0;transition:transform 0.3s,opacity 0.3s;"></span>' +
          '<span id="dashLastUpdated">Live monitoring active</span>';
        monHeading.parentNode.insertBefore(liveBar, monHeading);
      }
    }

    // Start polling
    pollInterval = setInterval(pollActiveTrips, POLL_MS);
  });

  window.addEventListener('beforeunload', function () {
    if (pollInterval) clearInterval(pollInterval);
  });
})();
