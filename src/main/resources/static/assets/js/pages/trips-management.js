(function () {
  'use strict';

  var allTrips    = [];
  var allRoutes   = [];
  var allDrivers  = [];
  var viewedTripId = null;   // tracks which trip the admin is currently viewing
  var pollInterval = null;
  var POLL_MS = 15000;       // refresh every 15 seconds

  // ── Helpers ──────────────────────────────────────────────────────────────
  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function initials(name) {
    return (name || '?').split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();
  }
  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function formatTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  function nowStr() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // ── Initial full load (trips + routes + drivers) ──────────────────────────
  function loadData() {
    Promise.all([
      apiGet('/api/trips'),
      apiGet('/admin/routes'),
      apiGet('/admin/drivers')
    ]).then(function(results) {
      allTrips   = results[0] || [];
      allRoutes  = results[1] || [];
      allDrivers = results[2] || [];
      updateStats();
      populateFilters();
      renderTable();
      updateLastRefreshed();
    }).catch(function(err) {
      console.error('Error loading trips:', err);
    });
  }

  // ── Lightweight poll — only re-fetch trips ────────────────────────────────
  function pollTrips() {
    apiGet('/api/trips').then(function(trips) {
      allTrips = trips || [];
      updateStats();
      renderTable();
      updateLastRefreshed();

      // If the admin is viewing a specific trip, refresh its details panel live
      if (viewedTripId !== null) {
        var updated = allTrips.find(function(t){ return t.id === viewedTripId; });
        if (updated) renderTripDetails(updated, false /* no scroll */);
      }
    }).catch(function(err) {
      console.error('Auto-refresh error:', err);
    });
  }

  function updateLastRefreshed() {
    var el = document.getElementById('lastRefreshedLabel');
    if (el) el.textContent = 'Last updated: ' + nowStr();
    // pulse the indicator
    var dot = document.getElementById('livePulseDot');
    if (dot) {
      dot.classList.add('pulse-flash');
      setTimeout(function(){ dot.classList.remove('pulse-flash'); }, 600);
    }
  }

  // ── Stats cards ───────────────────────────────────────────────────────────
  function updateStats() {
    var activeCount    = allTrips.filter(function(t){ return t.status === 'IN_PROGRESS'; }).length;
    var completedCount = allTrips.filter(function(t){ return t.status === 'COMPLETED'; }).length;
    var s1 = document.querySelector('.stat-card:nth-child(1) .stat-val');
    var s2 = document.querySelector('.stat-card:nth-child(2) .stat-val');
    var s3 = document.querySelector('.stat-card:nth-child(3) .stat-val');
    var s4 = document.querySelector('.stat-card:nth-child(4) .stat-val');
    var l4 = document.querySelector('.stat-card:nth-child(4) .stat-label');
    if (s1) s1.textContent = allTrips.length;
    if (s2) s2.textContent = activeCount;
    if (s3) s3.textContent = completedCount;
    if (s4) s4.textContent = allRoutes.length;
    if (l4) l4.textContent = 'Total Routes';
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  function populateFilters() {
    var routeSel = document.querySelector('.custom-select:nth-child(1)');
    if (routeSel && routeSel.options.length <= 1) {
      routeSel.innerHTML = '<option value="">All Routes</option>';
      allRoutes.forEach(function(r) {
        routeSel.innerHTML += '<option value="' + r.id + '">' + escHtml(r.name) + ' (' + escHtml(r.code) + ')</option>';
      });
      routeSel.addEventListener('change', renderTable);
    }
    var driverSel = document.querySelector('.custom-select:nth-child(2)');
    if (driverSel && driverSel.options.length <= 1) {
      driverSel.innerHTML = '<option value="">All Drivers</option>';
      allDrivers.forEach(function(d) {
        driverSel.innerHTML += '<option value="' + d.id + '">' + escHtml(d.name) + '</option>';
      });
      driverSel.addEventListener('change', renderTable);
    }
    var statusSel = document.querySelector('.custom-select:nth-child(3)');
    if (statusSel && statusSel.options.length <= 1) {
      statusSel.innerHTML = '<option value="">All Status</option><option value="NOT_STARTED">Not Started</option><option value="IN_PROGRESS">Active</option><option value="COMPLETED">Completed</option>';
      statusSel.addEventListener('change', renderTable);
    }
    var searchInput = document.querySelector('.search-box input');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.addEventListener('input', renderTable);
      searchInput.dataset.bound = '1';
    }
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  function renderTable() {
    var tbody = document.querySelector('.trips-table tbody');
    if (!tbody) return;

    var routeFilter  = (document.querySelector('.custom-select:nth-child(1)') || {}).value || '';
    var driverFilter = (document.querySelector('.custom-select:nth-child(2)') || {}).value || '';
    var statusFilter = (document.querySelector('.custom-select:nth-child(3)') || {}).value || '';
    var searchQ      = ((document.querySelector('.search-box input') || {}).value || '').toLowerCase();

    var filtered = allTrips.filter(function(t) {
      if (routeFilter  && t.routeId     && t.routeId.toString() !== routeFilter)   return false;
      if (driverFilter && (!t.driverUserId || t.driverUserId.toString() !== driverFilter)) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (searchQ) {
        var ok = (t.routeName  || '').toLowerCase().indexOf(searchQ) !== -1
              || (t.driverName || '').toLowerCase().indexOf(searchQ) !== -1;
        if (!ok) return false;
      }
      return true;
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#6b7280;">No trips match your filters.</td></tr>';
      var tf = document.querySelector('.table-footer');
      if (tf) tf.textContent = 'Showing 0 trips';
      return;
    }

    filtered.forEach(function(t) {
      var stations      = t.stationProgress || [];
      var currentIdx    = typeof t.currentStationIndex === 'number' ? t.currentStationIndex : 0;
      var totalStations = stations.length;
      var completedCount = stations.filter(function(s){ return (s.status||'').toUpperCase() === 'COMPLETED'; }).length;
      var nextStation   = stations[currentIdx + 1];
      var curStation    = stations[currentIdx] || {};
      // Use stationProgress as source of truth for the current station name
      var curStationName = curStation.stationName || t.currentStationName || '—';
      var isArrived     = curStation.hasArrived;

      var statusBadgeCls = 'bg-gray-light', statusBadgeTxt = 'Unknown';
      if      (t.status === 'IN_PROGRESS') { statusBadgeCls = 'bg-blue-light text-blue';   statusBadgeTxt = 'Active';    }
      else if (t.status === 'COMPLETED')   { statusBadgeCls = 'bg-green-light text-green'; statusBadgeTxt = 'Completed'; }
      else if (t.status === 'NOT_STARTED') { statusBadgeCls = 'bg-yellow-light text-yellow'; statusBadgeTxt = 'Pending'; }

      var arrivalLbl = t.status === 'IN_PROGRESS'
        ? '<span style="font-size:0.72rem;color:' + (isArrived ? '#15803d' : '#92400e') + ';display:block;margin-bottom:2px;">' + (isArrived ? '🚏 Arrived at' : '🕒 Approaching') + '</span>'
        : '';

      var isViewed = (t.id === viewedTripId);

      var tr = document.createElement('tr');
      if (isViewed) tr.style.background = 'rgba(59,130,246,0.06)';

      tr.innerHTML =
        '<td><span class="trip-id-badge ' + statusBadgeCls + '">' + statusBadgeTxt + '</span></td>' +
        '<td><div class="td-stack"><strong>' + escHtml(t.routeName || 'Unassigned') + '</strong><span class="text-muted">' + escHtml(t.routeCode || '') + '</span></div></td>' +
        '<td><div class="driver-cell"><div class="avatar bg-blue-light text-blue">' + initials(t.driverName) + '</div><span>' + escHtml(t.driverName || 'Unassigned') + '</span></div></td>' +
        '<td><div class="td-stack"><span>' + formatDate(t.startTime) + '</span><span class="text-muted">' + formatTime(t.startTime) + '</span></div></td>' +
        '<td><div class="current-station-cell"><div class="td-stack"><div>' + arrivalLbl + '<strong>' + escHtml(curStationName) + '</strong></div><span class="text-muted">' + (currentIdx + 1) + ' of ' + totalStations + '</span></div></div></td>' +
        '<td class="text-center">' + completedCount + ' / ' + totalStations + '</td>' +
        '<td><div class="capacity-cell"><div class="cap-text">' + (t.passengerCount || 0) + '</div></div></td>' +
        '<td><div class="td-stack"><span>' + (nextStation ? escHtml(nextStation.stationName) : '—') + '</span><span class="text-muted">' + (nextStation ? '~ 5 min' : '') + '</span></div></td>' +
        '<td><button class="btn-action" style="' + (isViewed ? 'background:var(--blue);color:white;' : '') + '">' +
          '<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' +
          (isViewed ? 'Viewing' : 'View') +
        '</button></td>';

      tr.querySelector('button').addEventListener('click', function() {
        viewedTripId = t.id;
        renderTripDetails(t, true);
        renderTable(); // re-render to highlight viewed row
      });

      tbody.appendChild(tr);
    });

    var tf = document.querySelector('.table-footer');
    if (tf) tf.textContent = 'Showing ' + filtered.length + ' trip' + (filtered.length !== 1 ? 's' : '');
  }

  // ── Details panel ─────────────────────────────────────────────────────────
  function renderTripDetails(trip, doScroll) {
    var container = document.querySelector('.trip-details-card');
    if (!container) return;
    container.style.display = 'block';

    var stations      = trip.stationProgress || [];
    var currentIdx    = typeof trip.currentStationIndex === 'number' ? trip.currentStationIndex : 0;
    var totalStations = stations.length;
    var completedCount = stations.filter(function(s){ return (s.status||'').toUpperCase() === 'COMPLETED'; }).length;
    var remainingCount = Math.max(0, totalStations - currentIdx - 1);
    var nextStation   = stations[currentIdx + 1];

    // Header
    var h2 = container.querySelector('.table-card-header h2');
    if (h2) h2.textContent = 'Trip Details — ' + (trip.routeName || 'Unknown Route');

    // Left info values
    var infoVals = container.querySelectorAll('.details-left .info-value');
    if (infoVals.length >= 5) {
      infoVals[0].textContent = '#' + trip.id;
      infoVals[1].textContent = (trip.routeName || '—') + (trip.routeCode ? ' (' + trip.routeCode + ')' : '');
      infoVals[2].textContent = trip.driverName || '—';
      infoVals[3].textContent = formatDate(trip.startTime) + ' · ' + formatTime(trip.startTime);
      infoVals[4].textContent = (trip.passengerCount || 0) + ' students';
    }

    // Timeline
    var timeline = container.querySelector('.timeline');
    if (timeline) {
      timeline.innerHTML = '';
      stations.forEach(function(s, i) {
        var isCompleted = (s.status || '').toUpperCase() === 'COMPLETED';
        var isCurrent   = (s.status || '').toUpperCase() === 'CURRENT';
        var isPending   = !isCompleted && !isCurrent;

        var cls = 'timeline-item ' + (isCompleted ? 'completed' : isCurrent ? 'current active-highlight' : 'pending');
        if (i === stations.length - 1) cls += ' last';

        var icon = isCompleted
          ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>'
          : (i + 1);

        var badge = '';
        if (isCurrent) {
          if (s.hasArrived) {
            badge = ' <span class="badge-current-small" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;">🚏 Arrived</span>';
          } else {
            badge = ' <span class="badge-current-small" style="background:#fef9c3;color:#854d0e;border:1px solid #fde68a;">🕒 Approaching</span>';
          }
        }

        var timeText = '';
        if (isCompleted) {
          timeText = formatTime(s.arrivalTime);
        } else if (isCurrent) {
          timeText = s.hasArrived ? 'At station' : 'Approaching';
        } else {
          var remaining = i - currentIdx;
          var futureMs  = Date.now() + (remaining * 5 * 60000);
          timeText = '~ ' + new Date(futureMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }

        timeline.innerHTML +=
          '<div class="' + cls + '">' +
            '<div class="tl-icon">' + icon + '</div>' +
            '<div class="tl-content">' +
              '<span class="tl-name' + (isCurrent ? ' text-blue' : '') + '">' + escHtml(s.stationName) + badge + '</span>' +
              '<span class="tl-time' + (isCurrent ? ' text-blue' : '') + '">' + timeText + '</span>' +
            '</div>' +
          '</div>';
      });
    }

    // ETA banner
    var etaBanner = container.querySelector('.eta-banner');
    if (etaBanner) {
      if (nextStation && trip.status === 'IN_PROGRESS') {
        var etaMs  = Date.now() + (5 * 60000);
        var etaStr = new Date(etaMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        etaBanner.innerHTML =
          '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          ' Estimated arrival at <strong>' + escHtml(nextStation.stationName) + '</strong>: <strong>' + etaStr + '</strong> (~5 min)';
        etaBanner.style.display = '';
      } else if (trip.status === 'COMPLETED') {
        etaBanner.innerHTML = '✅ Trip completed — all stations visited.';
        etaBanner.style.background = 'var(--green-light)';
        etaBanner.style.color = 'var(--green-dark)';
        etaBanner.style.display = '';
      } else {
        etaBanner.style.display = 'none';
      }
    }

    // Summary right panel
    var summaryVals = container.querySelectorAll('.details-right .sum-val');
    if (summaryVals.length >= 4) {
      summaryVals[0].textContent = totalStations;
      summaryVals[1].textContent = completedCount;
      summaryVals[2].textContent = remainingCount;
      var lastSt = stations[stations.length - 1];
      var etaLastMs = Date.now() + (remainingCount * 5 * 60000);
      summaryVals[3].textContent = trip.status === 'COMPLETED'
        ? formatTime(trip.endTime)
        : (remainingCount > 0 ? '~ ' + new Date(etaLastMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—');
    }

    // Status badge
    var statusBadge = container.querySelector('.details-right .badge-status-active, .details-right .badge-status-completed');
    if (statusBadge) {
      var labels = { 'IN_PROGRESS': 'Active', 'COMPLETED': 'Completed', 'NOT_STARTED': 'Pending' };
      statusBadge.textContent = labels[trip.status] || trip.status;
      statusBadge.className   = trip.status === 'COMPLETED' ? 'badge-status-completed' : 'badge-status-active';
    }

    // Legend update
    var legend = container.querySelector('.stations-header .stations-legend');
    if (legend) {
      legend.innerHTML =
        '<span class="legend-item"><span class="icon-completed"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span> Completed</span>' +
        '<span class="legend-item" style="margin-left:12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fef9c3;border:1px solid #854d0e;margin-right:4px;"></span>Approaching</span>' +
        '<span class="legend-item" style="margin-left:12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#dcfce7;border:1px solid #166534;margin-right:4px;"></span>Arrived</span>' +
        '<span class="legend-item" style="margin-left:12px;"><span class="icon-pending"></span>Pending</span>';
    }

    // Station header count
    var stationsHeader = container.querySelector('.stations-header h3');
    if (stationsHeader) stationsHeader.textContent = 'Route Stations (' + totalStations + ' Total)';

    if (doScroll) container.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    var detailsCard = document.querySelector('.trip-details-card');
    if (detailsCard) detailsCard.style.display = 'none';

    // Inject live-refresh bar into the filter bar
    var filtersBar = document.querySelector('.filters-bar');
    if (filtersBar) {
      var liveBar = document.createElement('div');
      liveBar.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:0.8rem;color:#6b7280;margin-top:8px;padding:6px 2px;';
      liveBar.innerHTML =
        '<span id="livePulseDot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0;transition:transform 0.3s,opacity 0.3s;"></span>' +
        '<span id="lastRefreshedLabel">Connecting...</span>';
      filtersBar.appendChild(liveBar);
    }

    loadData();

    // Start auto-polling
    pollInterval = setInterval(pollTrips, POLL_MS);
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', function() {
    if (pollInterval) clearInterval(pollInterval);
  });

  // CSS for pulse flash
  var style = document.createElement('style');
  style.textContent = '.pulse-flash { transform: scale(1.8); opacity: 0.5; }';
  document.head.appendChild(style);
})();
