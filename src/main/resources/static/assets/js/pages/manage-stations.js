(function () {
  var currentRouteId = null;
  var dragSrcIndex = null;
  var stationsCache = [];

  function renderRouteOptions(routes) {
    var sel = document.getElementById('routeSelect');
    sel.innerHTML = '';
    routes.forEach(function (r) {
      var opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name + ' (' + r.code + ')';
      sel.appendChild(opt);
    });
    if (routes.length > 0) {
      currentRouteId = routes[0].id;
      sel.value = currentRouteId;
    }
  }

  function renderTable(stations) {
    stationsCache = stations;
    var tbody = document.getElementById('stationsTableBody');
    var totalEl = document.getElementById('totalStations');
    tbody.innerHTML = '';

    if (totalEl) totalEl.textContent = 'Total Stations: ' + stations.length;

    var q = (document.getElementById('stationSearch').value || '').toLowerCase();
    var visible = q ? stations.filter(function (s) { return s.name.toLowerCase().indexOf(q) !== -1; }) : stations;

    visible.forEach(function (station, idx) {
      tbody.appendChild(buildRow(station, idx, visible.length));
    });

    initDragDrop();
  }

  function buildRow(station, idx, total) {
    var tr = document.createElement('tr');
    tr.setAttribute('draggable', 'true');
    tr.dataset.rsId = station.id;

    var tdOrder = document.createElement('td');
    tdOrder.innerHTML =
      '<div class="order-cell">' +
        '<div class="drag-handle" title="Drag to reorder">' +
          '<span><i></i><i></i></span>' +
          '<span><i></i><i></i></span>' +
          '<span><i></i><i></i></span>' +
        '</div>' +
        '<input type="text" class="order-input" value="' + station.orderIndex + '" readonly />' +
      '</div>';

    var tdName = document.createElement('td');
    tdName.innerHTML =
      '<div class="station-name-cell">' +
        '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' +
        escHtml(station.name) +
      '</div>';

    var tdActions = document.createElement('td');
    tdActions.innerHTML =
      '<div class="action-btns">' +
        '<button class="action-btn move" title="Move Up"' + (idx === 0 ? ' disabled' : '') + ' data-action="up">' +
          '<svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>' +
        '</button>' +
        '<button class="action-btn move" title="Move Down"' + (idx === total - 1 ? ' disabled' : '') + ' data-action="down">' +
          '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>' +
        '</button>' +
        '<button class="action-btn" title="Edit" data-action="edit">' +
          '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</button>' +
        '<button class="action-btn delete" title="Delete" data-action="delete">' +
          '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
        '</button>' +
      '</div>';

    tdActions.querySelector('[data-action="up"]').addEventListener('click', function () { moveStation(station.id, -1); });
    tdActions.querySelector('[data-action="down"]').addEventListener('click', function () { moveStation(station.id, 1); });
    tdActions.querySelector('[data-action="edit"]').addEventListener('click', function () { openEditModal(station); });
    tdActions.querySelector('[data-action="delete"]').addEventListener('click', function () { deleteStation(station.id); });

    tr.appendChild(tdOrder);
    tr.appendChild(tdName);
    tr.appendChild(tdActions);
    return tr;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadRoutes() {
    apiGet('/api/routes').then(function (routes) {
      if (!routes || routes.length === 0) return;
      renderRouteOptions(routes);
      loadStations();
    }).catch(handleError);
  }

  function loadStations() {
    if (!currentRouteId) return;
    apiGet('/api/routes/' + currentRouteId + '/stations').then(function (stations) {
      renderTable(stations || []);
    }).catch(handleError);
  }

  function moveStation(rsId, dir) {
    var idx = stationsCache.findIndex(function (s) { return s.id === rsId; });
    var newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= stationsCache.length) return;

    var ids = stationsCache.map(function (s) { return s.id; });
    var removed = ids.splice(idx, 1)[0];
    ids.splice(newIdx, 0, removed);

    apiPut('/api/routes/' + currentRouteId + '/stations/reorder', { routeStationIds: ids })
      .then(function (updated) { renderTable(updated); })
      .catch(handleError);
  }

  function deleteStation(rsId) {
    apiDelete('/api/routes/' + currentRouteId + '/stations/' + rsId)
      .then(function () { loadStations(); })
      .catch(handleError);
  }

  function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Station';
    document.getElementById('stationNameInput').value = '';
    document.getElementById('editingStationRsId').value = '';
    document.getElementById('stationModal').classList.add('open');
    document.getElementById('stationNameInput').focus();
  }

  function openEditModal(station) {
    document.getElementById('modalTitle').textContent = 'Edit Station';
    document.getElementById('stationNameInput').value = station.name;
    document.getElementById('editingStationRsId').value = station.id;
    document.getElementById('stationModal').classList.add('open');
    document.getElementById('stationNameInput').focus();
  }

  function closeModal() {
    document.getElementById('stationModal').classList.remove('open');
  }

  function saveStation() {
    var name = document.getElementById('stationNameInput').value.trim();
    if (!name) {
      document.getElementById('stationNameInput').focus();
      return;
    }
    var rsId = document.getElementById('editingStationRsId').value;
    var promise = rsId
      ? apiPut('/api/routes/' + currentRouteId + '/stations/' + rsId, { name: name })
      : apiPost('/api/routes/' + currentRouteId + '/stations', { name: name });

    promise.then(function () {
      closeModal();
      loadStations();
    }).catch(handleError);
  }

  function initDragDrop() {
    var tbody = document.getElementById('stationsTableBody');
    var rows = tbody.querySelectorAll('tr[draggable]');

    rows.forEach(function (row, i) {
      row.addEventListener('dragstart', function (e) {
        dragSrcIndex = i;
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('dragging');
      });
      row.addEventListener('dragend', function () {
        row.classList.remove('dragging');
        tbody.querySelectorAll('tr').forEach(function (r) { r.classList.remove('drag-over'); });
      });
      row.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        tbody.querySelectorAll('tr').forEach(function (r) { r.classList.remove('drag-over'); });
        row.classList.add('drag-over');
      });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        if (dragSrcIndex === null || dragSrcIndex === i) return;

        var ids = stationsCache.map(function (s) { return s.id; });
        var removed = ids.splice(dragSrcIndex, 1)[0];
        ids.splice(i, 0, removed);
        dragSrcIndex = null;

        apiPut('/api/routes/' + currentRouteId + '/stations/reorder', { routeStationIds: ids })
          .then(function (updated) { renderTable(updated); })
          .catch(handleError);
      });
    });
  }

  function handleError(err) {
    console.error(err);
    showToast((err && err.message) ? err.message : 'An error occurred', true);
  }

  function showToast(msg, isError) {
    var toast = document.getElementById('orderSavedToast');
    toast.textContent = msg;
    toast.style.background = isError ? '#c62828' : '#2e7d32';
    toast.style.display = 'block';
    setTimeout(function () { toast.style.display = 'none'; }, 2800);
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadRoutes();

    document.getElementById('routeSelect').addEventListener('change', function () {
      currentRouteId = parseInt(this.value, 10);
      loadStations();
    });

    document.getElementById('addStationBtn').addEventListener('click', openAddModal);
    document.getElementById('saveStationBtn').addEventListener('click', saveStation);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    document.getElementById('stationModalOverlay').addEventListener('click', closeModal);

    document.getElementById('stationSearch').addEventListener('input', function () {
      renderTable(stationsCache);
    });

    document.getElementById('saveOrderBtn').addEventListener('click', function () {
      var ids = stationsCache.map(function (s) { return s.id; });
      apiPut('/api/routes/' + currentRouteId + '/stations/reorder', { routeStationIds: ids })
        .then(function (updated) {
          renderTable(updated);
          showToast('Order saved successfully', false);
        }).catch(handleError);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Enter' && document.getElementById('stationModal').classList.contains('open')) saveStation();
    });
  });
})();
