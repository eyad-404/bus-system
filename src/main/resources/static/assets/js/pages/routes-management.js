(function () {
  var allRoutes = [];
  var searchQuery = '';
  var isSaving = false;  // guard against duplicate route submissions

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function updateStatCards(routes) {
    var totalEl = document.getElementById('statTotal');
    if (totalEl) totalEl.textContent = routes.length;
  }

  function renderTable(routes) {
    var tbody = document.getElementById('routesTableBody');
    var paginationText = document.getElementById('paginationText');
    if (!tbody) return;

    var filtered = searchQuery
      ? routes.filter(function (r) {
          var q = searchQuery.toLowerCase();
          return r.name.toLowerCase().indexOf(q) !== -1 || r.code.toLowerCase().indexOf(q) !== -1;
        })
      : routes;

    if (paginationText) {
      paginationText.textContent = 'Showing 1 to ' + filtered.length + ' of ' + filtered.length + ' route' + (filtered.length !== 1 ? 's' : '');
    }

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4" style="text-align:center;color:#9ca3af;padding:40px;">No routes found.</td>';
      tbody.appendChild(tr);
      return;
    }

    filtered.forEach(function (route) {
      tbody.appendChild(buildRow(route));
    });
  }

  function buildRow(route) {
    var tr = document.createElement('tr');
    tr.dataset.id = route.id;

    tr.innerHTML =
      '<td><span class="route-badge">' + escHtml(route.code) + '</span></td>' +
      '<td>' +
        '<div class="route-name">' + escHtml(route.name) + '</div>' +
      '</td>' +
      '<td>' +
        '<a href="manage-stations.html" class="view-order-link">Manage stations →</a>' +
      '</td>' +
      '<td>' +
        '<div class="action-btns">' +
          '<button class="action-btn" aria-label="Edit" data-action="edit">' +
            '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>' +
            '<span>Edit</span>' +
          '</button>' +
          '<button class="action-btn delete" aria-label="Delete" data-action="delete">' +
            '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' +
          '</button>' +
        '</div>' +
      '</td>';

    tr.querySelector('[data-action="edit"]').addEventListener('click', function () { openEditModal(route); });
    tr.querySelector('[data-action="delete"]').addEventListener('click', function () { confirmDelete(route); });

    return tr;
  }

  function loadRoutes() {
    apiGet('/api/routes').then(function (routes) {
      allRoutes = routes || [];
      updateStatCards(allRoutes);
      renderTable(allRoutes);
    }).catch(handleError);
  }

  function openAddModal() {
    document.getElementById('routeModalTitle').textContent = 'Add New Route';
    document.getElementById('routeNameInput').value = '';
    document.getElementById('routeCodeInput').value = '';
    document.getElementById('editingRouteId').value = '';
    document.getElementById('routeModal').classList.add('open');
    document.getElementById('routeNameInput').focus();
  }

  function openEditModal(route) {
    document.getElementById('routeModalTitle').textContent = 'Edit Route';
    document.getElementById('routeNameInput').value = route.name;
    document.getElementById('routeCodeInput').value = route.code;
    document.getElementById('editingRouteId').value = route.id;
    document.getElementById('routeModal').classList.add('open');
    document.getElementById('routeNameInput').focus();
  }

  function closeModal() {
    isSaving = false;
    var btn = document.getElementById('saveRouteBtn');
    if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
    document.getElementById('routeModal').classList.remove('open');
  }

  function saveRoute() {
    if (isSaving) return;  // prevent double submission
    var name = document.getElementById('routeNameInput').value.trim();
    var code = document.getElementById('routeCodeInput').value.trim();
    var editId = document.getElementById('editingRouteId').value;

    if (!name) { document.getElementById('routeNameInput').focus(); return; }
    if (!code) { document.getElementById('routeCodeInput').focus(); return; }

    isSaving = true;
    var saveBtn = document.getElementById('saveRouteBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

    var body = { name: name, code: code };
    var promise = editId
      ? apiPut('/api/routes/' + editId, body)
      : apiPost('/api/routes', body);

    promise.then(function () {
      closeModal();
      loadRoutes();
      showToast(editId ? 'Route updated successfully' : 'Route created successfully', false);
    }).catch(function (err) {
      isSaving = false;
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
      handleError(err);
    });
  }

  function confirmDelete(route) {
    document.getElementById('deleteRouteName').textContent = route.name + ' (' + route.code + ')';
    document.getElementById('confirmDeleteRouteId').value = route.id;
    document.getElementById('deleteModal').classList.add('open');
  }

  function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('open');
  }

  function executeDelete() {
    var id = document.getElementById('confirmDeleteRouteId').value;
    apiDelete('/api/routes/' + id).then(function () {
      closeDeleteModal();
      loadRoutes();
      showToast('Route deleted successfully', false);
    }).catch(handleError);
  }

  function handleError(err) {
    console.error(err);
    showToast((err && err.message) ? err.message : 'An error occurred', true);
  }

  function showToast(msg, isError) {
    var toast = document.getElementById('rmToast');
    toast.textContent = msg;
    toast.style.background = isError ? '#c62828' : '#2e7d32';
    toast.style.display = 'block';
    setTimeout(function () { toast.style.display = 'none'; }, 2800);
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadRoutes();

    document.getElementById('addRouteBtn').addEventListener('click', openAddModal);
    document.getElementById('addRouteBtnBottom').addEventListener('click', openAddModal);
    document.getElementById('saveRouteBtn').addEventListener('click', saveRoute);
    document.getElementById('cancelRouteModalBtn').addEventListener('click', closeModal);
    document.getElementById('routeModalOverlay').addEventListener('click', closeModal);

    document.getElementById('confirmDeleteBtn').addEventListener('click', executeDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteModalOverlay').addEventListener('click', closeDeleteModal);

    document.getElementById('routeSearchInput').addEventListener('input', function () {
      searchQuery = this.value;
      renderTable(allRoutes);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
      }
      if (e.key === 'Enter' && document.getElementById('routeModal').classList.contains('open')) {
        saveRoute();
      }
    });
  });
})();
