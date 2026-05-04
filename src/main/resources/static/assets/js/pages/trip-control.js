(function () {
  'use strict';

  var userId = localStorage.getItem('userId');
  var tripId = null;
  var lastMoveTime = null;
  var MIN_COOLDOWN_MS = 60 * 1000; // 1 minute

  // ── Helpers ──────────────────────────────────────────────────────────────
  function setEl(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
  function showEl(id) { var e = document.getElementById(id); if (e) e.style.display = ''; }
  function hideEl(id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; }
  function now() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
  function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ── Load trip state ───────────────────────────────────────────────────────
  function loadTrip() {
    if (!userId) {
      renderNoRoute();
      return;
    }
    apiGet('/api/trips/my-trip?userId=' + userId).then(function (trip) {
      if (!trip) {
        renderNoRoute();
        return;
      }
      if (trip.status === 'NOT_STARTED') {
        renderNotStarted(trip);
      } else if (trip.status === 'IN_PROGRESS') {
        tripId = trip.id;
        renderInProgress(trip);
      } else if (trip.status === 'COMPLETED') {
        renderCompleted(trip);
      }
    }).catch(function (err) {
      console.error(err);
      renderNoRoute();
    });
  }

  // ── Render: No route assigned ─────────────────────────────────────────────
  function renderNoRoute() {
    var section = document.getElementById('noTripSection');
    if (!section) return;
    section.innerHTML =
      '<div class="card-box" style="text-align:center;padding:48px 24px;">' +
        '<div style="font-size:3rem;margin-bottom:16px;">🚌</div>' +
        '<h2 style="margin-bottom:8px;">No Route Assigned</h2>' +
        '<p class="text-muted">You don\'t have a route assigned yet. Please contact your admin.</p>' +
      '</div>';
    showEl('noTripSection');
    hideEl('tripSection');
  }

  // ── Render: Not started ───────────────────────────────────────────────────
  function renderNotStarted(trip) {
    var section = document.getElementById('noTripSection');
    if (section) {
      section.innerHTML =
        '<div class="card-box" style="text-align:center;padding:48px 24px;border:2px solid var(--green);background:var(--green-soft);">' +
          '<div style="font-size:3rem;margin-bottom:16px;">✅</div>' +
          '<h2 style="margin-bottom:8px;color:var(--green-dark);">Ready to Start?</h2>' +
          '<p class="text-muted" style="margin-bottom:24px;">Your route <strong>' + escHtml(trip.routeName) + '</strong> is ready. Press Start when you begin.</p>' +
          '<button id="startTripBtn" class="action-btn btn-green" style="background:var(--green);color:white;border:none;padding:14px 32px;border-radius:10px;font-size:1.1rem;font-weight:700;cursor:pointer;">' +
            '🚀 Start Trip' +
          '</button>' +
        '</div>';
      showEl('noTripSection');
      hideEl('tripSection');
      var btn = document.getElementById('startTripBtn');
      if (btn) btn.addEventListener('click', function () { startTrip(); });
    }
  }

  // ── Render: Completed ─────────────────────────────────────────────────────
  function renderCompleted(trip) {
    var section = document.getElementById('noTripSection');
    if (section) {
      section.innerHTML =
        '<div class="card-box" style="text-align:center;padding:48px 24px;border:2px solid var(--blue);background:var(--blue-light);">' +
          '<div style="font-size:3rem;margin-bottom:16px;">🏁</div>' +
          '<h2 style="margin-bottom:8px;color:var(--blue-dark);">Trip Completed!</h2>' +
          '<p class="text-muted">Route: <strong>' + escHtml(trip.routeName) + '</strong>. Great job today!</p>' +
        '</div>';
      showEl('noTripSection');
      hideEl('tripSection');
    }
  }

  // ── Render: In progress ───────────────────────────────────────────────────
  function renderInProgress(trip) {
    hideEl('noTripSection');
    showEl('tripSection');
    tripId = trip.id;

    var stations = trip.stationProgress || [];
    var currentIdx = trip.currentStationIndex || 0;
    var totalStations = stations.length;
    var currentStation = stations[currentIdx] || {};
    var nextStation = stations[currentIdx + 1] || null;

    setEl('topRouteName', (trip.routeName || '—') + (trip.routeCode ? ' (' + trip.routeCode + ')' : ''));
    setEl('topCurrentStation', trip.currentStationName || currentStation.stationName || '—');
    setEl('topStationProgress', (currentIdx + 1) + ' of ' + totalStations);
    setEl('topNextStation', nextStation ? nextStation.stationName : 'Last Station');
    setEl('panelCurrentStation', trip.currentStationName || currentStation.stationName || '—');
    setEl('panelNextStation', nextStation ? nextStation.stationName : 'End of Route');
    setEl('lastUpdatedPanel', 'Last updated: ' + now());

    renderTimeline(stations, currentIdx);
    setupButtons(trip);
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  function renderTimeline(stations, currentIdx) {
    var container = document.getElementById('timelineContainer');
    if (!container) return;
    container.innerHTML = '';
    stations.forEach(function (s, i) {
      var isCompleted = i < currentIdx;
      var isCurrent = i === currentIdx;
      var cls = 'timeline-item ' + (isCompleted ? 'completed' : isCurrent ? 'current active-highlight' : 'pending');
      var icon = isCompleted ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : (i + 1);
      var badge = isCurrent ? ' <span class="badge-current-small">Current</span>' : '';
      var div = document.createElement('div');
      div.className = cls;
      div.innerHTML =
        '<div class="tl-icon">' + icon + '</div>' +
        '<div class="tl-content">' +
          '<span class="tl-name ' + (isCurrent ? 'text-blue' : '') + '">' + escHtml(s.stationName) + badge + '</span>' +
          '<span class="tl-time ' + (isCurrent ? 'text-blue' : '') + '">' + (isCompleted ? (s.arrivalTime ? new Date(s.arrivalTime).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) : '✓') : (isCurrent ? 'Current' : 'Pending')) + '</span>' +
        '</div>';
      container.appendChild(div);
    });
  }

  // ── Buttons ───────────────────────────────────────────────────────────────
  function setupButtons(trip) {
    var stations = trip.stationProgress || [];
    var currentIdx = trip.currentStationIndex || 0;
    var isLastStation = currentIdx >= stations.length - 1;

    var nextBtn = document.getElementById('nextStationBtn');
    var endBtn = document.getElementById('endTripBtn');
    var nextBtnText = document.getElementById('nextStationBtnText');

    if (nextBtn) {
      if (isLastStation) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
        if (nextBtnText) nextBtnText.textContent = 'Last Station';
      } else {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        if (nextBtnText) nextBtnText.textContent = 'Next Station';
        nextBtn.onclick = function () { moveToNext(); };
      }
    }

    if (endBtn) {
      endBtn.onclick = function () {
        if (confirm('Are you sure you want to end the trip?')) endTrip();
      };
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function startTrip() {
    if (!userId) return;
    var btn = document.getElementById('startTripBtn');
    if (btn) { btn.textContent = 'Starting...'; btn.disabled = true; }
    apiPost('/api/trips/start?userId=' + userId, {}).then(function (trip) {
      tripId = trip.id;
      loadTrip();
    }).catch(function (err) {
      alert('Failed to start trip: ' + (err.message || err));
      if (btn) { btn.textContent = '🚀 Start Trip'; btn.disabled = false; }
    });
  }

  function moveToNext() {
    if (!tripId) return;
    var now = Date.now();
    if (lastMoveTime && (now - lastMoveTime) < MIN_COOLDOWN_MS) {
      var remaining = Math.ceil((MIN_COOLDOWN_MS - (now - lastMoveTime)) / 1000);
      alert('Please wait ' + remaining + ' more seconds before moving to the next station.');
      return;
    }
    var btn = document.getElementById('nextStationBtn');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    apiPut('/api/trips/' + tripId + '/next', {}).then(function (trip) {
      lastMoveTime = Date.now();
      renderInProgress(trip);
    }).catch(function (err) {
      alert('Error: ' + (err.message || err));
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    });
  }

  function endTrip() {
    if (!tripId) return;
    apiPut('/api/trips/' + tripId + '/end', {}).then(function (trip) {
      renderCompleted(trip);
    }).catch(function (err) {
      alert('Error ending trip: ' + (err.message || err));
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof requireAuth === 'function') requireAuth('DRIVER');
    loadTrip();
  });
})();
