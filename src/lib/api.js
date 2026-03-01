/**
 * @typedef {Object} ApiClient
 * @property {(endpoint: string) => Promise<*>} get  - GET request with auth headers
 * @property {(endpoint: string, data: *) => Promise<*>} post - POST request with JSON body
 */

/**
 * Base URL for API requests. Resolved at module load:
 * 1. VITE_API_URL env var (explicit override)
 * 2. Current origin with port 3001 (browser)
 * 3. http://127.0.0.1:3001 (Electron / fallback)
 * @type {string}
 */
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

/** @type {string} localStorage key for the JWT auth token. */
export const TOKEN_KEY = 'sync_token';

/**
 * Reads the stored JWT token from localStorage.
 * @returns {string|null}
 */
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Internal fetch wrapper that attaches auth headers and handles 401 redirects.
 * @param {string} endpoint  - API path (e.g. '/api/data')
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<*>} Parsed JSON response
 * @throws {Error} On 401 (session expired) or non-OK status
 */
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

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
}

/** @type {ApiClient} Authenticated API client with GET and POST methods. */
export const api = {
    get: (endpoint) => request(endpoint, { method: 'GET', cache: 'no-store' }),
    post: (endpoint, data) =>
        request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
