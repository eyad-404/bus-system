const UserService = {
    async getUsers(type) {
        const endpoint = type === 'STUDENT' ? '/admin/students' : '/admin/drivers';
        return await apiGet(endpoint);
    },

    async searchUsers(type, query) {
        if (!query.trim()) {
            return this.getUsers(type);
        }
        const endpoint = type === 'STUDENT' ? '/admin/students/search' : '/admin/drivers/search';
        return await apiGet(`${endpoint}?query=${encodeURIComponent(query)}`);
    },

    async createUser(type, data) {
        return await apiPost('/admin/create-user', data);
    },

    async updateUser(type, id, data) {
        const endpoint = type === 'STUDENT' ? `/admin/students/${id}` : `/admin/drivers/${id}`;
        return await apiPut(endpoint, data);
    },

    async deleteUser(type, id) {
        const endpoint = type === 'STUDENT' ? `/admin/students/${id}` : `/admin/drivers/${id}`;
        return await apiDelete(endpoint);
    }
};
