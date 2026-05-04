(function () {
  var allTrips = [];
  var allRoutes = [];
  var allDrivers = [];

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    return (name || '?').split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
  }

  function formatDate(dStr) {
    if (!dStr) return '—';
    var d = new Date(dStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(dStr) {
    if (!dStr) return '—';
    var d = new Date(dStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function loadData() {
    Promise.all([
      apiGet('/api/trips'),
      apiGet('/admin/routes'),
      apiGet('/admin/drivers')
    ]).then(function(results) {
      allTrips = results[0] || [];
      allRoutes = results[1] || [];
      allDrivers = results[2] || [];

      updateStats();
      populateFilters();
      renderTable();
    }).catch(function(err) {
      alert("Error loading data: " + err.message);
    });
  }

  function updateStats() {
    var activeCount = allTrips.filter(function(t) { return t.status === 'IN_PROGRESS'; }).length;
    var completedCount = allTrips.filter(function(t) { return t.status === 'COMPLETED'; }).length;
    
    document.querySelector('.stat-card:nth-child(1) .stat-val').textContent = allTrips.length;
    document.querySelector('.stat-card:nth-child(2) .stat-val').textContent = activeCount;
    document.querySelector('.stat-card:nth-child(3) .stat-val').textContent = completedCount;
    document.querySelector('.stat-card:nth-child(4) .stat-val').textContent = allRoutes.length;
    document.querySelector('.stat-card:nth-child(4) .stat-label').textContent = 'Total Routes';
  }

  function populateFilters() {
    var routeSel = document.querySelector('.custom-select:nth-child(1)');
    if (routeSel) {
      routeSel.innerHTML = '<option value="">All Routes</option>';
      allRoutes.forEach(function(r) {
        routeSel.innerHTML += '<option value="' + r.id + '">' + escHtml(r.name) + ' (' + escHtml(r.code) + ')</option>';
      });
      routeSel.addEventListener('change', renderTable);
    }

    var driverSel = document.querySelector('.custom-select:nth-child(2)');
    if (driverSel) {
      driverSel.innerHTML = '<option value="">All Drivers</option>';
      allDrivers.forEach(function(d) {
        driverSel.innerHTML += '<option value="' + d.id + '">' + escHtml(d.name) + '</option>';
      });
      driverSel.addEventListener('change', renderTable);
    }

    var statusSel = document.querySelector('.custom-select:nth-child(3)');
    if (statusSel) {
      statusSel.innerHTML = '<option value="">All Status</option><option value="NOT_STARTED">Not Started</option><option value="IN_PROGRESS">Active</option><option value="COMPLETED">Completed</option>';
      statusSel.addEventListener('change', renderTable);
    }

    var searchInput = document.querySelector('.search-box input');
    if (searchInput) {
      searchInput.addEventListener('input', renderTable);
    }
  }

  function renderTable() {
    var tbody = document.querySelector('.trips-table tbody');
    if (!tbody) return;

    var routeFilter = document.querySelector('.custom-select:nth-child(1)').value;
    var driverFilter = document.querySelector('.custom-select:nth-child(2)').value;
    var statusFilter = document.querySelector('.custom-select:nth-child(3)').value;
    var searchQ = (document.querySelector('.search-box input').value || '').toLowerCase();

    var filtered = allTrips.filter(function(t) {
      if (routeFilter && t.routeId && t.routeId.toString() !== routeFilter) return false;
      if (driverFilter && (!t.driverUserId || t.driverUserId.toString() !== driverFilter)) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      
      if (searchQ) {
        var matchRoute = (t.routeName || '').toLowerCase().indexOf(searchQ) !== -1;
        var matchDriver = (t.driverName || '').toLowerCase().indexOf(searchQ) !== -1;
        if (!matchRoute && !matchDriver) return false;
      }
      return true;
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#6b7280;">No trips match your filters.</td></tr>';
      document.querySelector('.table-footer').textContent = 'Showing 0 trips';
      return;
    }

    filtered.forEach(function(t) {
      var stations = t.stationProgress || [];
      var currentIdx = t.currentStationIndex || 0;
      var totalStations = stations.length;
      var completedRatio = totalStations > 0 ? (currentIdx + ' / ' + totalStations) : '0 / 0';
      var nextStation = stations[currentIdx + 1];

      var statusBadgeCls = 'bg-gray-light';
      var statusBadgeTxt = 'Unknown';
      if (t.status === 'IN_PROGRESS') { statusBadgeCls = 'bg-blue-light text-blue'; statusBadgeTxt = 'Active'; }
      else if (t.status === 'COMPLETED') { statusBadgeCls = 'bg-green-light text-green'; statusBadgeTxt = 'Completed'; }
      else if (t.status === 'NOT_STARTED') { statusBadgeCls = 'bg-yellow-light text-yellow'; statusBadgeTxt = 'Pending'; }

      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td><span class="trip-id-badge ' + statusBadgeCls + '">' + statusBadgeTxt + '</span></td>' +
        '<td><div class="td-stack"><strong>' + escHtml(t.routeName || 'Unassigned') + '</strong><span class="text-muted">' + escHtml(t.routeCode || '') + '</span></div></td>' +
        '<td><div class="driver-cell"><div class="avatar bg-blue-light text-blue">' + initials(t.driverName) + '</div><span>' + escHtml(t.driverName || 'Unassigned') + '</span></div></td>' +
        '<td><div class="td-stack"><span>' + formatDate(t.startTime) + '</span><span class="text-muted">' + formatTime(t.startTime) + '</span></div></td>' +
        '<td><div class="current-station-cell"><div class="td-stack"><div><strong>' + escHtml(t.currentStationName || '—') + '</strong></div><span class="text-muted">' + (currentIdx + 1) + ' of ' + totalStations + '</span></div></div></td>' +
        '<td class="text-center">' + completedRatio + '</td>' +
        '<td><div class="capacity-cell"><div class="cap-text">—</div></div></td>' +
        '<td><div class="td-stack"><span>' + (nextStation ? escHtml(nextStation.stationName) : '—') + '</span><span class="text-muted">' + (nextStation ? '~ 5 min' : '') + '</span></div></td>' +
        '<td><button class="btn-action" data-view-trip="' + t.id + '"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg> View</button></td>';

      tr.querySelector('button').addEventListener('click', function() {
        renderTripDetails(t);
      });

      tbody.appendChild(tr);
    });

    document.querySelector('.table-footer').textContent = 'Showing ' + filtered.length + ' trips';
  }

  function renderTripDetails(trip) {
    var container = document.querySelector('.trip-details-card');
    if (!container) return;
    container.style.display = 'block';

    var stations = trip.stationProgress || [];
    var currentIdx = trip.currentStationIndex || 0;
    var totalStations = stations.length;

    container.querySelector('.table-card-header h2').textContent = 'Trip Details - ' + escHtml(trip.routeName);
    
    var infoVals = container.querySelectorAll('.details-left .info-value');
    if(infoVals.length >= 4) {
      infoVals[0].textContent = trip.id;
      infoVals[1].textContent = escHtml(trip.routeName) + ' (' + escHtml(trip.routeCode) + ')';
      infoVals[2].textContent = escHtml(trip.driverName);
      infoVals[3].textContent = formatDate(trip.startTime) + ' - ' + formatTime(trip.startTime);
    }

    var timeline = container.querySelector('.timeline');
    timeline.innerHTML = '';
    
    stations.forEach(function(s, i) {
      var isCompleted = (s.status || '').toLowerCase() === 'completed';
      var isCurrent = (s.status || '').toLowerCase() === 'current';
      
      var cls = 'timeline-item ' + (isCompleted ? 'completed' : isCurrent ? 'current active-highlight' : 'pending');
      if (i === stations.length - 1) cls += ' last';

      var icon = isCompleted ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>' : (i + 1);
      var currentBadge = isCurrent ? ' <span class="badge-current-small">Current</span>' : '';
      var timeText = isCompleted ? formatTime(s.arrivalTime) : (isCurrent ? 'Current' : 'Pending');

      timeline.innerHTML += 
        '<div class="' + cls + '">' +
          '<div class="tl-icon">' + icon + '</div>' +
          '<div class="tl-content">' +
            '<span class="tl-name ' + (isCurrent ? 'text-blue' : '') + '">' + escHtml(s.stationName) + currentBadge + '</span>' +
            '<span class="tl-time ' + (isCurrent ? 'text-blue' : '') + '">' + timeText + '</span>' +
          '</div>' +
        '</div>';
    });

    var summaryVals = container.querySelectorAll('.details-right .sum-val');
    if(summaryVals.length >= 4) {
      summaryVals[0].textContent = totalStations;
      summaryVals[1].textContent = currentIdx;
      summaryVals[2].textContent = Math.max(0, totalStations - currentIdx);
      summaryVals[3].textContent = '—';
    }

    var statusBadge = container.querySelector('.details-right .badge-status-active');
    if (statusBadge) {
      statusBadge.textContent = trip.status;
      statusBadge.className = trip.status === 'COMPLETED' ? 'badge-status-completed' : 'badge-status-active';
    }

    container.scrollIntoView({ behavior: 'smooth' });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var detailsCard = document.querySelector('.trip-details-card');
    if (detailsCard) detailsCard.style.display = 'none';
    
    loadData();
  });
})();
