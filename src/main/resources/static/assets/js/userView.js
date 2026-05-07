const UserView = {
    renderUsersTable(users, type) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (!users || users.length === 0) {
            this.renderEmptyState(tbody);
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id || user.userId || '-'}</td>
                <td>
                    <div class="avatar-cell">
                        <div class="avatar-circle">${this._getInitials(user.name)}</div>
                        <span>${this._escapeHtml(user.name || '-')}</span>
                    </div>
                </td>
                <td>${this._escapeHtml(user.email || '-')}</td>
                ${type === 'STUDENT' ? `<td>${this._escapeHtml(user.routeName || '-')}</td>` : ''}
                <td>
                    <div class="action-btns">
                        <button class="action-btn btn-edit" data-id="${user.id || user.userId}" title="Edit">
                            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="action-btn delete btn-delete" data-id="${user.id || user.userId}" title="Delete">
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderEmptyState(tbody) {
        if (!tbody) tbody = document.getElementById('users-table-body');
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No users found.</td></tr>`;
    },

    renderLoading() {
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading...</td></tr>`;
        }
    },

    updateAddButtonText(type) {
        const btn = document.getElementById('btn-add-user');
        if (btn) {
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add ${type === 'STUDENT' ? 'Student' : 'Driver'}
            `;
        }
    },

    toggleTabHighlight(type) {
        const tabStudents = document.getElementById('tab-students');
        const tabDrivers = document.getElementById('tab-drivers');
        if (type === 'STUDENT') {
            tabStudents?.classList.add('active');
            tabDrivers?.classList.remove('active');
        } else {
            tabDrivers?.classList.add('active');
            tabStudents?.classList.remove('active');
        }
        
        const thead = document.querySelector('.data-table thead tr');
        if (thead) {
            thead.innerHTML = `
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                ${type === 'STUDENT' ? '<th>Route</th>' : ''}
                <th>Actions</th>
            `;
        }
    },

    showModal(type, user = null) {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('modalTitle');
        const passwordGroup = document.getElementById('passwordGroup');
        const passwordInput = document.getElementById('userPassword');
        const modalError = document.getElementById('modalError');
        const routeGroup = document.getElementById('routeGroup');
        const userRoute = document.getElementById('userRoute');

        if (!modal || !form) return;

        form.reset();
        if (modalError) {
            modalError.style.display = 'none';
            modalError.textContent = '';
        }
        title.textContent = user ? `Edit ${type === 'STUDENT' ? 'Student' : 'Driver'}` : `Add ${type === 'STUDENT' ? 'Student' : 'Driver'}`;

        if (routeGroup) {
            routeGroup.style.display = type === 'STUDENT' ? 'block' : 'none';
        }

        if (user) {
            document.getElementById('userId').value = user.id || user.userId || '';
            document.getElementById('userName').value = user.name || '';
            document.getElementById('userEmail').value = user.email || '';
            if (userRoute && type === 'STUDENT') {
                userRoute.value = user.routeId || '';
            }
            if (passwordGroup) passwordGroup.style.display = 'none';
            if (passwordInput) passwordInput.required = false;
        } else {
            document.getElementById('userId').value = '';
            if (userRoute) userRoute.value = '';
            if (passwordGroup) passwordGroup.style.display = 'block';
            if (passwordInput) passwordInput.required = true;
        }

        modal.style.display = 'flex';
    },

    populateRoutes(routes) {
        const routeSelect = document.getElementById('userRoute');
        if (!routeSelect) return;
        routeSelect.innerHTML = '<option value="">-- No Route --</option>';
        routes.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = `${r.code} - ${r.name}`;
            routeSelect.appendChild(opt);
        });
    },

    hideModal() {
        const modal = document.getElementById('userModal');
        if (modal) modal.style.display = 'none';
    },

    showInlineError(msg) {
        const modalError = document.getElementById('modalError');
        if (modalError) {
            modalError.textContent = msg;
            modalError.style.display = 'block';
        }
    },

    _getInitials(name) {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    },

    _escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
