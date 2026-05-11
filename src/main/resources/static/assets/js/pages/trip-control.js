(function () {
  'use strict';

  var userId = localStorage.getItem('userId');
  var tripId = null;
  var lastMoveTime = null;
  var globalCurrentIdx = 0;
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
        '<div class="card-box" style="text-align:center;padding:64px 24px;border:none;background:linear-gradient(135deg, #10b981 0%, #047857 100%);color:white;box-shadow:0 20px 40px rgba(16,185,129,0.2); border-radius: 24px; position:relative; overflow:hidden;">' +
          '<div style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%); pointer-events:none;"></div>' +
          '<div style="font-size:5rem;margin-bottom:24px; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.2));">🚌</div>' +
          '<h2 style="margin-bottom:12px; font-size: 2.2rem; font-weight:800; letter-spacing:-0.5px;">Ready to Roll!</h2>' +
          '<p style="margin-bottom:32px; font-size: 1.1rem; opacity:0.9; max-width: 400px; margin-left:auto; margin-right:auto;">Your route <strong>' + escHtml(trip.routeName) + '</strong> is fully configured and ready for boarding.</p>' +
          '<button id="startTripBtn" class="action-btn" style="background:white;color:#047857;border:none;padding:16px 40px;border-radius:12px;font-size:1.25rem;font-weight:800;cursor:pointer; box-shadow:0 10px 20px rgba(0,0,0,0.15); transition:transform 0.2s, box-shadow 0.2s;">' +
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
    var rawIdx = typeof trip.currentStationIndex === 'number' ? trip.currentStationIndex : 0;
    var maxIdx = stations.length > 0 ? stations.length - 1 : 0;
    var currentIdx = stations.length === 0 ? 0 : Math.min(Math.max(0, rawIdx), maxIdx);
    var totalStations = stations.length;
    var currentStation = stations[currentIdx] || {};
    var nextStation = stations[currentIdx + 1] || null;

    // Use stationProgress array as source of truth — NOT trip.currentStationName
    var currentStationName = currentStation.stationName || '—';
    var nextStationName    = nextStation ? nextStation.stationName : 'Last Station';

    setEl('topRouteName', (trip.routeName || '—') + (trip.routeCode ? ' (' + trip.routeCode + ')' : ''));
    setEl('topCurrentStation', currentStationName);
    setEl('topStationProgress', (currentIdx + 1) + ' of ' + totalStations);
    setEl('topNextStation', nextStationName);
    var pax = document.getElementById('topPassengers');
    if (pax) {
      pax.textContent = (typeof trip.passengerCount === 'number' && trip.passengerCount >= 0)
        ? String(trip.passengerCount)
        : '—';
    }
    setEl('panelCurrentStation', currentStationName);
    setEl('panelNextStation', nextStation ? nextStation.stationName : 'End of Route');
    setEl('lastUpdatedPanel', 'Last updated: ' + now());

    globalCurrentIdx = currentIdx;

    // hasArrived from the backend is the source of truth
    var isArrived = currentStation.hasArrived === true
      || localStorage.getItem('arrived_' + trip.id + '_' + currentIdx) === 'true';

    if (isArrived) {
      setEl('panelSubtitle', '\uD83D\uDEA9 Arrived at station');
    } else if (currentIdx === 0) {
      setEl('panelSubtitle', '\uD83D\uDE8C Starting at station');
    } else {
      setEl('panelSubtitle', '\uD83D\uDD52 Approaching station...');
    }

    renderTimeline(stations, currentIdx);
    setupButtons(trip, currentStation);
  }

  // ── Timeline ─────────────────────────────────────────────────────────────
  function renderTimeline(stations, currentIdx) {
    var container = document.getElementById('timelineContainer');
    if (!container) return;
    container.innerHTML = '';
    stations.forEach(function (s, i) {
      var isCompleted = i < currentIdx;
      var isCurrent   = i === currentIdx;
      var stateClass  = isCompleted ? 'completed' : isCurrent ? 'current active-highlight' : 'pending';

      // Icon: checkmark for completed, number for others
      var icon = isCompleted
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
        : (i + 1);

      // Time label
      var timeText = '';
      if (isCompleted && s.arrivalTime) {
        timeText = new Date(s.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (!isCurrent) {
        var remaining = i - currentIdx;
        var futureMs  = Date.now() + (remaining * 5 * 60000);
        timeText = '~ ' + new Date(futureMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }

      // Badge
      var badge = isCurrent ? ' <span class="badge-current-small">Current</span>' : '';

      // Right-side status pill
      var statusPill = isCompleted
        ? '<span class="badge-completed">Done</span>'
        : isCurrent
          ? '<span class="tl-time" style="color:#3b82f6;font-weight:600;">Now</span>'
          : '<span class="tl-time">' + timeText + '</span>';

      var div = document.createElement('div');
      div.className = 'tl-item ' + stateClass;
      div.innerHTML =
        '<div class="tl-icon">' + icon + '</div>' +
        '<div class="tl-content">' +
          '<div class="tl-left">' +
            // Station number INLINE before the name, no separate row
            '<span class="tl-name' + (isCurrent ? ' active-highlight' : '') + '">' +
              '<span style="font-size:0.72rem;color:#9ca3af;font-weight:500;margin-right:6px;">#' + (i + 1) + '</span>' +
              escHtml(s.stationName) + badge +
            '</span>' +
          '</div>' +
          '<div class="tl-right">' + statusPill + '</div>' +
        '</div>';
      container.appendChild(div);
    });
  }

  // ── Buttons ───────────────────────────────────────────────────────────────
  function setupButtons(trip, currentStation) {
    var stations = trip.stationProgress || [];
    var rawIdx = typeof trip.currentStationIndex === 'number' ? trip.currentStationIndex : 0;
    var maxIdx = stations.length > 0 ? stations.length - 1 : 0;
    var currentIdx = stations.length === 0 ? 0 : Math.min(Math.max(0, rawIdx), maxIdx);
    var isLastStation = stations.length === 0 || currentIdx >= stations.length - 1;
    currentStation     = currentStation || stations[currentIdx] || {};
    var stationName    = currentStation.stationName || '—';

    // — Arrived button —
    var arrivedBtn = document.getElementById('arrivedBtn');
    if (arrivedBtn) {
      arrivedBtn.disabled = false;
      arrivedBtn.onclick  = function () { arriveAtStation(stationName); };
    }

    // — Next Station button —
    var nextBtn     = document.getElementById('nextStationBtn');
    var nextBtnText = document.getElementById('nextStationBtnText');
    if (nextBtn) {
      if (isLastStation) {
        nextBtn.disabled  = true;
        nextBtn.style.opacity = '0.45';
        if (nextBtnText) nextBtnText.textContent = 'Last Station';
      } else {
        nextBtn.disabled  = false;
        nextBtn.style.opacity = '1';
        if (nextBtnText) nextBtnText.textContent = 'Next Station';
        nextBtn.onclick = function () { moveToNext(); };
      }
    }

    // — End Trip button —
    var endBtn = document.getElementById('endTripBtn');
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
      if (btn) { btn.textContent = '\uD83D\uDE80 Start Trip'; btn.disabled = false; }
    });
  }

  function arriveAtStation(stationName) {
    if (!tripId) return;
    var btn = document.getElementById('arrivedBtn');
    var lbl = btn ? btn.querySelector('span') : null;
    if (btn) btn.disabled = true;
    if (lbl) lbl.textContent = 'Sending...';
    apiPost('/api/trips/' + tripId + '/arrived', {}).then(function () {
      if (btn) btn.disabled = false;
      if (lbl) lbl.textContent = 'Arrived';
      // Persist arrived state
      localStorage.setItem('arrived_' + tripId + '_' + globalCurrentIdx, 'true');
      // Update UI panel immediately
      setEl('panelSubtitle', '\uD83D\uDEA9 Arrived at station');
      showToast('\uD83D\uDCE3 Students at "' + stationName + '" have been notified!', false);
    }).catch(function (err) {
      if (btn) btn.disabled = false;
      if (lbl) lbl.textContent = 'Arrived';
      var msg = (err && err.message) ? err.message : String(err);
      showToast('\u26A0 ' + msg, true);
    });
  }

  function showToast(msg, isError) {
    var t = document.getElementById('tripToast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = isError ? '#b91c1c' : '#15803d';
    t.style.display = 'block';
    setTimeout(function () { t.style.display = 'none'; }, 3000);
  }

  function moveToNext() {
    if (!tripId) return;
    var btn = document.getElementById('nextStationBtn');
    var btnText = document.getElementById('nextStationBtnText');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    if (btnText) btnText.textContent = 'Moving...';

    apiPut('/api/trips/' + tripId + '/next', {}).then(function (trip) {
      // Clear the arrived flag for the new current station so it shows "Approaching"
      var newIdx = trip.currentStationIndex || 0;
      localStorage.removeItem('arrived_' + trip.id + '_' + newIdx);

      // Immediately show Approaching in the UI
      setEl('panelSubtitle', '\uD83D\uDD52 Approaching station...');

      renderInProgress(trip);
      showToast('\uD83D\uDE8C Moving to next station — students notified!', false);
    }).catch(function (err) {
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
      if (btnText) btnText.textContent = 'Next Station';
      var msg = (err && err.message) ? err.message : String(err);
      showToast('\u26A0 ' + msg, true);
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
    (function clearStaleOverlay() {
      var ov = document.getElementById('sidebarOverlay');
      var ns = document.getElementById('notificationSidebar');
      var sb = document.getElementById('sidebar');
      if (ov && !((ns && ns.classList.contains('open')) || (sb && sb.classList.contains('open')))) {
        ov.classList.remove('active');
        document.body.style.overflow = '';
      }
    })();
    loadTrip();
  });
})();
