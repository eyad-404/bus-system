const BASE_URL = 'http://localhost:8080';

async function apiPost(url, body) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('firstLogin');
        window.location.replace('/pages/common/login.html');
        return;
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function apiGet(url) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${url}`, { headers });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('firstLogin');
        window.location.replace('/pages/common/login.html');
        return;
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function apiPut(url, body) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${url}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('firstLogin');
        window.location.replace('/pages/common/login.html');
        return;
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function apiDelete(url) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${url}`, {
        method: 'DELETE',
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('firstLogin');
        window.location.replace('/pages/common/login.html');
        return;
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}
