(function () {
  'use strict';

  var userId = localStorage.getItem('userId');

  function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function loadViewRoute() {
    if (!userId) return;

    Promise.all([
      apiGet('/api/students/me?userId=' + userId),
      apiGet('/api/trips/active')
    ]).then(function (results) {
      var student = results[0] || {};
      var activeTrips = results[1] || [];

      var myTrip = activeTrips.length > 0 ? activeTrips[0] : null;

      // Update header info
      var routeNameEl = document.getElementById('routeNameHeader');
      var routeCodeEl = document.getElementById('routeCodeHeader');
      var boardingEl = document.getElementById('boardingStationHeader');
      var etaEl = document.getElementById('etaHeader');

      if (myTrip) {
        if (routeNameEl) routeNameEl.textContent = myTrip.routeName || 'Unknown Route';
        if (routeCodeEl) routeCodeEl.textContent = myTrip.routeCode || '';
        if (boardingEl) boardingEl.textContent = student.boardingStationName || 'Not Assigned';

        // ETA
        if (student.studentId && myTrip.id) {
          apiGet('/api/trips/' + myTrip.id + '/eta/' + student.studentId).then(function (eta) {
            if (etaEl) etaEl.textContent = eta && eta.etaMinutes != null ? '~ ' + eta.etaMinutes + ' min' : 'At stop';
          }).catch(function () {
            if (etaEl) etaEl.textContent = '~ 5 min';
          });
        }

        renderStations(myTrip);
      } else {
        if (routeNameEl) routeNameEl.textContent = 'No Active Trip';
        if (routeCodeEl) routeCodeEl.textContent = '';
        if (boardingEl) boardingEl.textContent = student.boardingStationName || 'Not Assigned';
        if (etaEl) etaEl.textContent = '—';

        // Try to load route stations from student's route
        renderNoTripStations(student);
      }
    }).catch(function (err) {
      console.error('View route load error:', err);
    });
  }

  function renderStations(trip) {
    var tbody = document.getElementById('routeStationsBody');
    if (!tbody) return;

    var stations = trip.stationProgress || [];
    var currentIdx = trip.currentStationIndex || 0;

    if (stations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:24px;">No stations found.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    stations.forEach(function (s, i) {
      var isCompleted = i < currentIdx;
      var isCurrent = i === currentIdx;
      var isPending = i > currentIdx;

      var statusBadge;
      if (isCompleted) statusBadge = '<span class="badge-completed">Completed</span>';
      else if (isCurrent) statusBadge = '<span class="badge-current-small">Current</span>';
      else statusBadge = '<span class="badge-pending">Pending</span>';

      var timeText = isCompleted && s.arrivalTime
        ? new Date(s.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : (isCurrent ? 'Now' : (isPending ? '~ 5 min ea.' : '—'));

      var tr = document.createElement('tr');
      if (isCurrent) tr.style.background = 'rgba(59,130,246,0.05)';
      tr.innerHTML =
        '<td><strong>' + (i + 1) + '</strong></td>' +
        '<td><span' + (isCurrent ? ' style="color:var(--blue);font-weight:700;"' : '') + '>' + escHtml(s.stationName) + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td><span class="text-muted">' + timeText + '</span></td>';
      tbody.appendChild(tr);
    });
  }

  function renderNoTripStations(student) {
    var tbody = document.getElementById('routeStationsBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:48px;">' +
        '<div style="font-size:2rem;margin-bottom:8px;">🚌</div>' +
        '<p>No active trip at this time. Check back later.</p>' +
        (student.boardingStationName ? '<p class="text-muted">Your stop: <strong>' + escHtml(student.boardingStationName) + '</strong></p>' : '') +
      '</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof requireAuth === 'function') requireAuth('STUDENT');
    loadViewRoute();
  });
})();
