// Matches the Electron-safe URL resolution pattern used in CircadianCalculator.jsx.
// When running as a packaged Electron app the protocol is "file:", so
// window.location.hostname is empty and port 3001 cannot be inferred from the
// origin — we fall back to the loopback address explicitly.
export const API_BASE = (() => {
    const explicit = import.meta.env.VITE_API_URL;
    if (typeof explicit === 'string' && explicit.trim().length > 0) {
        return explicit.trim().replace(/\/+$/, '');
    }
    if (
        typeof window !== 'undefined' &&
        (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ) {
        return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    return 'http://127.0.0.1:3001';
})();

export const TOKEN_KEY = 'sync_token';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.hash = '#/login';
        throw new Error('Session expired');
    }

    return res;
}

export const api = {
    get: (endpoint) => request(endpoint, { method: 'GET', cache: 'no-store' }),
    post: (endpoint, data) =>
        request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
