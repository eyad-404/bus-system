(function () {
  var allRoutes = [];
  var allDrivers = [];

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    return (name || '?').split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
  }

  function loadData() {
    Promise.all([
      apiGet('/admin/routes'),
      apiGet('/admin/drivers')
    ]).then(function (results) {
      allRoutes = results[0] || [];
      allDrivers = results[1] || [];
      renderAssignedTable();
      renderAvailableTable();
      updateStats();
    }).catch(handleError);
  }

  function assignedRoutes() {
    return allRoutes.filter(function (r) { return r.driverId; });
  }

  function unassignedRoutes() {
    return allRoutes.filter(function (r) { return !r.driverId; });
  }

  function assignedDriverIds() {
    return assignedRoutes().map(function (r) { return String(r.driverId); });
  }

  function freeDrivers() {
    var taken = assignedDriverIds();
    return allDrivers.filter(function (d) { return taken.indexOf(String(d.id)) === -1; });
  }

  function driverById(id) {
    return allDrivers.find(function (d) { return String(d.id) === String(id); }) || null;
  }

  function updateStats() {
    setEl('statTotalRoutes', allRoutes.length);
    setEl('statAssigned', assignedRoutes().length);
    setEl('statUnassigned', unassignedRoutes().length);
    setEl('statFreeDrivers', freeDrivers().length);
  }

  function setEl(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

  function renderAssignedTable() {
    var tbody = document.getElementById('assignedTableBody');
    var rows = assignedRoutes();
    tbody.innerHTML = '';
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:32px;">No routes have an assigned driver yet.</td></tr>';
      return;
    }
    rows.forEach(function (route) {
      var driver = driverById(route.driverId);
      var driverName = route.driverName || (driver ? driver.name : 'Unknown');
      var driverEmail = driver ? driver.email : '';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="route-badge">' + escHtml(route.code) + '</span></td>' +
        '<td>' + escHtml(route.name) + '</td>' +
        '<td><div class="avatar-cell"><div class="avatar-circle">' + initials(driverName) + '</div><span>' + escHtml(driverName) + '</span></div></td>' +
        '<td>' + escHtml(driverEmail) + '</td>' +
        '<td><div class="action-btns">' +
          '<button class="action-btn delete" aria-label="Remove driver" title="Remove driver" data-route-id="' + route.id + '">' +
            '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' +
          '</button>' +
        '</div></td>';
      tr.querySelector('[data-route-id]').addEventListener('click', function () {
        removeDriver(route.id);
      });
      tbody.appendChild(tr);
    });
  }

  function renderAvailableTable() {
    var tbody = document.getElementById('availableTableBody');
    var drivers = freeDrivers();
    var openRoutes = unassignedRoutes();
    tbody.innerHTML = '';
    if (!drivers.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:32px;">All drivers are assigned.</td></tr>';
      return;
    }
    drivers.forEach(function (driver) {
      var routeSel = '<select class="table-select" data-driver-id="' + driver.id + '">';
      routeSel += '<option value="">-- Select Route --</option>';
      openRoutes.forEach(function (r) {
        routeSel += '<option value="' + r.id + '">' + escHtml(r.code) + ' – ' + escHtml(r.name) + '</option>';
      });
      routeSel += '</select>';

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><div class="avatar-cell"><div class="avatar-circle">' + initials(driver.name) + '</div><span>' + escHtml(driver.name) + '</span></div></td>' +
        '<td>' + escHtml(driver.email || '') + '</td>' +
        '<td>' + routeSel + '</td>' +
        '<td>' +
          '<button class="btn-outline-assign" data-driver-id="' + driver.id + '">' +
            '<svg viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
            ' Assign' +
          '</button>' +
        '</td>';

      tr.querySelector('button[data-driver-id]').addEventListener('click', function () {
        var sel = tr.querySelector('select[data-driver-id]');
        if (!sel || !sel.value) { showToast('Select a route first', true); return; }
        assignDriver(parseInt(sel.value, 10), driver.id);
      });
      tbody.appendChild(tr);
    });
  }

  function assignDriver(routeId, driverId) {
    apiPut('/admin/routes/' + routeId + '/assign-driver?driverId=' + driverId, {})
      .then(function () { loadData(); showToast('Driver assigned successfully'); })
      .catch(handleError);
  }

  function removeDriver(routeId) {
    apiDelete('/admin/routes/' + routeId + '/driver')
      .then(function () { loadData(); showToast('Driver removed'); })
      .catch(handleError);
  }

  function handleError(err) { showToast((err && err.message) || 'Error', true); }

  function showToast(msg, isError) {
    var t = document.getElementById('adToast');
    t.textContent = msg;
    t.style.background = isError ? '#ef4444' : '#22c55e';
    t.style.display = 'block';
    setTimeout(function () { t.style.display = 'none'; }, 2500);
  }

  document.addEventListener('DOMContentLoaded', loadData);
})();
