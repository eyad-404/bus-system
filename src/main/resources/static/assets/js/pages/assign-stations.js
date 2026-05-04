(function () {
  var allStudents = [];
  var routeStations = [];
  var currentRouteId = null;
  var searchQuery = '';

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    return (name || '?').split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
  }

  var AVATAR_COLORS = [
    ['#dbeafe', '#1d4ed8'], ['#fce7f3', '#db2777'], ['#dcfce7', '#16a34a'],
    ['#fef08a', '#ca8a04'], ['#e0e7ff', '#4f46e5'], ['#ffedd5', '#ea580c'],
    ['#f3e8ff', '#9333ea'], ['#e0f2fe', '#0369a1']
  ];

  function avatarColor(idx) { return AVATAR_COLORS[idx % AVATAR_COLORS.length]; }

  function loadRoutes() {
    apiGet('/api/routes').then(function (routes) {
      var sel = document.getElementById('routeSelect');
      sel.innerHTML = '<option value="">-- Select a route to begin --</option>';
      (routes || []).forEach(function (r) {
        var o = document.createElement('option');
        o.value = r.id;
        o.textContent = r.code + ' – ' + r.name;
        sel.appendChild(o);
      });
    }).catch(handleError);
  }

  function onRouteChange(routeId) {
    currentRouteId = routeId ? parseInt(routeId, 10) : null;
    routeStations = [];
    document.getElementById('stationSelect').innerHTML = '<option value="">All Stations</option>';

    if (!currentRouteId) {
      renderTable([]);
      renderStationsPanel([]);
      return;
    }

    apiGet('/api/routes/' + currentRouteId + '/stations').then(function (stations) {
      routeStations = stations || [];
      var sel = document.getElementById('stationSelect');
      sel.innerHTML = '<option value="">All Stations</option>';
      routeStations.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s.stationId;
        o.textContent = s.name;
        sel.appendChild(o);
      });
      renderStationsPanel(routeStations);
      renderTable(allStudents);
    }).catch(handleError);
  }

  function loadStudents() {
    apiGet('/admin/students/with-station').then(function (students) {
      allStudents = students || [];
      updateStats();
      renderTable(allStudents);
    }).catch(handleError);
  }

  function updateStats() {
    var assigned = allStudents.filter(function (s) { return s.boardingStationId; }).length;
    var unassigned = allStudents.length - assigned;
    setEl('statTotal', allStudents.length);
    setEl('statAssigned', assigned);
    setEl('statUnassigned', unassigned);
  }

  function setEl(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

  function renderTable(students) {
    var tbody = document.getElementById('studentsTableBody');
    var filterStn = (document.getElementById('stationSelect').value || '').toString();
    var q = searchQuery.toLowerCase();

    var visible = students.filter(function (s) {
      var matchSearch = !q || s.name.toLowerCase().indexOf(q) !== -1 || (s.email || '').toLowerCase().indexOf(q) !== -1;
      var matchStation = !filterStn || (s.boardingStationId && s.boardingStationId.toString() === filterStn);
      return matchSearch && matchStation;
    });

    document.getElementById('pageInfo').textContent = 'Showing ' + visible.length + ' of ' + students.length + ' students';
    tbody.innerHTML = '';
    visible.forEach(function (student, idx) {
      tbody.appendChild(buildStudentRow(student, idx));
    });
  }

  function buildStudentRow(student, idx) {
    var colors = avatarColor(idx);
    var isAssigned = !!student.boardingStationId;
    var tr = document.createElement('tr');
    tr.dataset.studentId = student.studentId;

    var stationDropdown = '<select class="table-select ' + (isAssigned ? 'assigned' : 'unassigned') + '" data-student-id="' + student.studentId + '">';
    stationDropdown += '<option value="">-- Select Station --</option>';
    routeStations.forEach(function (rs) {
      var sel = (student.boardingStationId && student.boardingStationId.toString() === rs.stationId.toString()) ? ' selected' : '';
      stationDropdown += '<option value="' + rs.stationId + '"' + sel + '>' + escHtml(rs.name) + '</option>';
    });
    stationDropdown += '</select>';

    var badge = isAssigned
      ? '<span class="badge badge-green"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Assigned</span>'
      : '<span class="badge badge-orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Unassigned</span>';

    var actionBtn = isAssigned
      ? '<button class="action-btn" aria-label="Reset" data-action="reset" data-student-id="' + student.studentId + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>'
      : '<button class="action-btn add" aria-label="Assign" data-action="assign" data-student-id="' + student.studentId + '"><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>';

    tr.innerHTML =
      '<td>' + escHtml(student.studentId) + '</td>' +
      '<td><div class="avatar-cell"><div class="avatar-circle" style="background:' + colors[0] + ';color:' + colors[1] + '">' + initials(student.name) + '</div><span>' + escHtml(student.name) + '</span></div></td>' +
      '<td>' + escHtml(student.email) + '</td>' +
      '<td>' + stationDropdown + '</td>' +
      '<td>' + badge + '</td>' +
      '<td>' + actionBtn + '</td>';

    tr.querySelector('select[data-student-id]').addEventListener('change', function () {
      if (this.value) assignStation(student.studentId, this.value);
    });

    var btn = tr.querySelector('[data-action]');
    if (btn) {
      btn.addEventListener('click', function () {
        if (this.dataset.action === 'reset') clearStation(student.studentId);
        else {
          var sel = tr.querySelector('select');
          if (sel && sel.value) assignStation(student.studentId, sel.value);
        }
      });
    }
    return tr;
  }

  function assignStation(studentId, stationId) {
    apiPut('/admin/students/' + studentId + '/assign-station?stationId=' + stationId, {})
      .then(function () { loadStudents(); showToast('Station assigned'); })
      .catch(handleError);
  }

  function clearStation(studentId) {
    apiDelete('/admin/students/' + studentId + '/assign-station')
      .then(function () { loadStudents(); showToast('Assignment cleared'); })
      .catch(handleError);
  }

  function renderStationsPanel(stations) {
    var tbody = document.getElementById('stationsPanelBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!stations.length) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:24px;">Select a route</td></tr>';
      return;
    }
    stations.forEach(function (s) {
      var count = allStudents.filter(function (st) { return st.boardingStationId && st.boardingStationId.toString() === s.stationId.toString(); }).length;
      var tr = document.createElement('tr');
      if (count === 0) tr.style.color = '#94a3b8';
      tr.innerHTML = '<td>' + s.orderIndex + '</td><td>' + escHtml(s.name) + '</td><td>' + count + '</td>';
      tbody.appendChild(tr);
    });
  }

  function handleError(err) { showToast((err && err.message) || 'Error', true); }

  function showToast(msg, isError) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = isError ? '#ef4444' : '#22c55e';
    t.style.display = 'block';
    setTimeout(function () { t.style.display = 'none'; }, 2500);
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadRoutes();
    loadStudents();

    document.getElementById('routeSelect').addEventListener('change', function () {
      onRouteChange(this.value);
    });
    document.getElementById('stationSelect').addEventListener('change', function () {
      renderTable(allStudents);
    });
    document.getElementById('studentSearch').addEventListener('input', function () {
      searchQuery = this.value;
      renderTable(allStudents);
    });
  });
})();
