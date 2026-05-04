(function () {
  'use strict';

  function setEl(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }

  function loadDashboard() {
    Promise.all([
      apiGet('/admin/students'),
      apiGet('/admin/drivers'),
      apiGet('/admin/routes'),
      apiGet('/api/trips/active')
    ]).then(function (results) {
      var students = results[0] || [];
      var drivers = results[1] || [];
      var routes = results[2] || [];
      var activeTrips = results[3] || [];

      setEl('statTotalStudents', students.length);
      setEl('statTotalDrivers', drivers.length);
      setEl('statTotalRoutes', routes.length);
      setEl('statActiveTrips', activeTrips.length);

      renderActiveTrips(activeTrips);
      renderRecentActivity(students, routes);
    }).catch(function (err) {
      console.error('Dashboard load error:', err);
    });
  }

  function renderActiveTrips(trips) {
    var container = document.getElementById('activeTripsContainer');
    if (!container) return;
    if (trips.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:24px;">No active trips right now.</p>';
      return;
    }
    container.innerHTML = '';
    trips.forEach(function (t) {
      var stations = t.stationProgress || [];
      var total = stations.length;
      var current = t.currentStationIndex || 0;
      var pct = total > 0 ? Math.round((current / total) * 100) : 0;

      var card = document.createElement('div');
      card.className = 'active-trip-card';
      card.innerHTML =
        '<div class="atc-header">' +
          '<span class="atc-route">' + escHtml(t.routeName || 'Unknown Route') + '</span>' +
          '<span class="badge-status-in-progress">In Progress</span>' +
        '</div>' +
        '<div class="atc-driver">Driver: <strong>' + escHtml(t.driverName || '—') + '</strong></div>' +
        '<div class="atc-station">At: <strong>' + escHtml(t.currentStationName || '—') + '</strong></div>' +
        '<div class="atc-progress-bar"><div class="atc-progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="atc-progress-text">' + (current) + ' / ' + total + ' stations</div>';
      container.appendChild(card);
    });
  }

  function renderRecentActivity(students, routes) {
    var container = document.getElementById('recentActivityContainer');
    if (!container) return;
    var assigned = students.filter(function (s) { return s.boardingStationId; }).length;
    var unassigned = students.length - assigned;
    container.innerHTML =
      '<div class="activity-item"><span class="text-blue">👥 Total Students:</span> <strong>' + students.length + '</strong></div>' +
      '<div class="activity-item"><span class="text-green">✅ Assigned:</span> <strong>' + assigned + '</strong></div>' +
      '<div class="activity-item"><span class="text-orange">⏳ Unassigned:</span> <strong>' + unassigned + '</strong></div>' +
      '<div class="activity-item"><span class="text-red">🛣️ Routes:</span> <strong>' + routes.length + '</strong></div>';
  }

  function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof requireAuth === 'function') requireAuth('ADMIN');
    loadDashboard();
  });
})();
