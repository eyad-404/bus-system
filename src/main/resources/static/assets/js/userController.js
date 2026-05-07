const UserController = {
    state: {
        currentType: 'STUDENT',
        users: [],
        searchQuery: ''
    },
    debounceTimer: null,

    async init() {
        this.bindEvents();
        await this.loadRoutes();
        await this.handleTabSwitch('STUDENT');
    },

    async loadRoutes() {
        try {
            const routes = await apiGet('/admin/routes');
            UserView.populateRoutes(routes || []);
        } catch (e) {
            console.error(e);
        }
    },

    bindEvents() {
        document.getElementById('tab-students')?.addEventListener('click', () => this.handleTabSwitch('STUDENT'));
        document.getElementById('tab-drivers')?.addEventListener('click', () => this.handleTabSwitch('DRIVER'));

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        document.getElementById('btn-add-user')?.addEventListener('click', () => {
            UserView.showModal(this.state.currentType);
        });

        document.getElementById('btnCancelModal')?.addEventListener('click', () => {
            UserView.hideModal();
        });

        document.getElementById('userForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        document.getElementById('users-table-body')?.addEventListener('click', (e) => {
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');
            
            if (btnEdit) {
                const id = btnEdit.dataset.id;
                this.handleEditClick(id);
            } else if (btnDelete) {
                const id = btnDelete.dataset.id;
                this.handleDelete(id);
            }
        });
    },

    async handleTabSwitch(type) {
        this.state.currentType = type;
        this.state.searchQuery = '';
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        UserView.toggleTabHighlight(type);
        UserView.updateAddButtonText(type);
        await this.loadUsers();
    },

    async loadUsers() {
        UserView.renderLoading();
        try {
            const users = await UserService.searchUsers(this.state.currentType, this.state.searchQuery);
            this.state.users = users || [];
            UserView.renderUsersTable(this.state.users, this.state.currentType);
        } catch (error) {
            console.error(error);
            UserView.renderEmptyState();
        }
    },

    handleSearch(query) {
        this.state.searchQuery = query;
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.loadUsers();
        }, 300);
    },

    handleEditClick(id) {
        const user = this.state.users.find(u => String(u.id || u.userId) === String(id));
        if (user) {
            UserView.showModal(this.state.currentType, user);
        }
    },

    async handleSave() {
        const id = document.getElementById('userId').value;
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const passwordInput = document.getElementById('userPassword');
        const password = passwordInput ? passwordInput.value : '';
        const routeSelect = document.getElementById('userRoute');
        const routeId = routeSelect && routeSelect.value ? parseInt(routeSelect.value, 10) : null;

        const submitBtn = document.querySelector('#userForm button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            if (id) {
                // Update existing user
                await UserService.updateUser(this.state.currentType, id, { name, email, routeId });
            } else {
                // Create new user
                await UserService.createUser(this.state.currentType, { 
                    name, 
                    email, 
                    password, 
                    role: this.state.currentType,
                    routeId
                });
            }

            UserView.hideModal();
            await this.loadUsers();
        } catch (error) {
            console.error(error);
            UserView.showInlineError(error.message || 'An error occurred while saving the user.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    },

    async handleDelete(id) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await UserService.deleteUser(this.state.currentType, id);
            await this.loadUsers();
        } catch (error) {
            console.error(error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UserController.init();
});
