(function () {
  'use strict';

  var userId = localStorage.getItem('userId');

  function setEl(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
  function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function loadStudentDashboard() {
    if (!userId) return;

    // Load student info + active trips in parallel
    Promise.all([
      apiGet('/api/students/me?userId=' + userId),
      apiGet('/api/trips/active')
    ]).then(function (results) {
      var student = results[0] || {};
      var activeTrips = results[1] || [];

      // Student info
      setEl('studentName', student.name || 'Student');
      setEl('studentEmail', student.email || '');

      var boardingStation = student.boardingStationName;
      setEl('boardingStationName', boardingStation || 'Not Assigned');
      setEl('boardingStationBadge', boardingStation ? 'Assigned' : 'Not Assigned');

      // Find active trip where bus is headed toward the student's station
      var myTrip = activeTrips.length > 0 ? activeTrips[0] : null;

      if (myTrip) {
        setEl('tripRouteName', myTrip.routeName || '—');
        setEl('tripRouteCode', myTrip.routeCode || '');
        setEl('tripStatus', 'In Progress');
        setEl('tripCurrentStation', myTrip.currentStationName || '—');

        var stations = myTrip.stationProgress || [];
        var currentIdx = myTrip.currentStationIndex || 0;
        setEl('tripProgress', (currentIdx + 1) + ' / ' + stations.length);

        // Load ETA if student has a boarding station and there's a trip
        if (student.studentId && myTrip.id) {
          apiGet('/api/trips/' + myTrip.id + '/eta/' + student.studentId).then(function (eta) {
            if (eta) {
              setEl('etaMinutes', eta.etaMinutes != null ? eta.etaMinutes + ' min' : 'At your stop');
              setEl('etaStation', student.boardingStationName || '—');
            }
          }).catch(function () {
            setEl('etaMinutes', '~ 5 min');
          });
        }
          renderTimeline(stations, currentIdx);
        } else {
          setEl('tripRouteName', 'No Active Trip');
          setEl('tripStatus', 'Not Started');
          setEl('tripCurrentStation', '—');
          setEl('tripProgress', '—');
          setEl('etaMinutes', '—');
          setEl('etaStation', '—');
          renderTimeline([], 0);
        }



        // Recent Notifications
        apiGet('/api/notifications/user/' + userId).then(function (notifs) {
          renderRecentNotifications(notifs || []);
        }).catch(function (err) {
          console.error('Failed to load recent notifications:', err);
        });

      }).catch(function (err) {
        console.error('Dashboard load error:', err);
      });
    }

    function timeAgo(dateStr) {
      if (!dateStr) return '';
      var d = new Date(dateStr);
      var diff = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diff < 60) return diff + 's ago';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function renderRecentNotifications(notifs) {
      var container = document.getElementById('recentNotificationsList');
      if (!container) return;
      container.innerHTML = '';
      
      var recent = notifs.slice(0, 3);
      if (recent.length === 0) {
        container.innerHTML = '<div style="padding:16px;text-align:center;color:#94a3b8;">No recent notifications.</div>';
        return;
      }

      recent.forEach(function (n) {
        var iconStr = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
        var div = document.createElement('div');
        div.className = 'activity-item' + (!n.read ? ' unread' : '');
        div.style.cursor = 'pointer';
        div.innerHTML =
          '<div class="act-icon bg-blue-soft text-blue">' + iconStr + '</div>' +
          '<div class="act-content">' +
            '<div class="act-title">' + escHtml(n.title || 'Notification') + '</div>' +
            '<div class="act-desc">' + escHtml(n.message) + '</div>' +
          '</div>' +
          '<div class="act-meta">' +
            '<span class="act-time">' + timeAgo(n.createdAt) + '</span>' +
            (!n.read ? '<i class="dot dot-red"></i>' : '') +
          '</div>';
        
        div.onclick = function() {
          if (!n.read) {
            apiPut('/api/notifications/' + n.id + '/read', {}).then(function() {
              if (window.refreshNotifications) {
                window.refreshNotifications();
              }
              loadStudentDashboard(); // Reload to refresh both count and list
            });
          }
        };
        container.appendChild(div);
      });
    }

    function renderTimeline(stations, currentIdx) {
      var container = document.getElementById('timelineContainer');
      if (!container) return;
      container.innerHTML = '';
      
      if (!stations || stations.length === 0) {
        container.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8;">No active trip progress to show.</div>';
        return;
      }
      
      stations.forEach(function (s, i) {
        var isCompleted = i < currentIdx;
        var isCurrent = i === currentIdx;
        var cls = 'tl-item ' + (isCompleted ? 'completed' : isCurrent ? 'current active-highlight' : 'pending');
        if (i === stations.length - 1) cls += ' last';
        
        var icon = isCompleted ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : (i + 1);
        var badge = isCurrent ? ' <span class="badge-current-small">Current</span>' : '';
        var statusBadge = isCompleted ? '<span class="badge-completed">Completed</span>' : (isCurrent ? '' : '<span class="badge-pending">Pending</span>');
        
        var timeText = isCompleted && s.arrivalTime
          ? new Date(s.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : (isCurrent ? 'Now' : 'Pending');

        var div = document.createElement('div');
        div.className = cls;
        div.innerHTML =
          '<div class="tl-icon">' + icon + '</div>' +
          '<div class="tl-content">' +
            '<div class="tl-left">' +
              '<span class="tl-num' + (isCurrent ? ' text-blue' : '') + '">' + (i + 1) + '</span>' +
              '<span class="tl-name' + (isCurrent ? ' text-blue' : '') + '">' + escHtml(s.stationName) + badge + '</span>' +
            '</div>' +
            '<div class="tl-right">' +
              '<span class="tl-time' + (isCurrent ? ' text-blue' : '') + '">' + timeText + '</span>' +
              (statusBadge ? statusBadge : '') +
            '</div>' +
          '</div>';
        container.appendChild(div);
      });
    }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof requireAuth === 'function') requireAuth('STUDENT');
    loadStudentDashboard();
  });
})();
