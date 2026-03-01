import { createContext, useState, useEffect, useCallback } from 'react';
import { API_BASE, TOKEN_KEY } from '../lib/api.js';

const GUEST_DATA_KEY = 'sync_guest_data';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    const isAuthenticated = (!!user && !!token) || isGuest;

    // Verify the stored token once on mount (and whenever the token value changes).
    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) throw new Error('Invalid token');
                return res.json();
            })
            .then(data => {
                if (!cancelled) setUser(data.user);
            })
            .catch(() => {
                if (!cancelled) {
                    localStorage.removeItem(TOKEN_KEY);
                    setToken(null);
                    setUser(null);
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [token]);

    const loginWithGoogle = useCallback(async (credential) => {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Login failed');
        }

        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        setIsGuest(false);
        return data;
    }, []);

    const loginAsGuest = useCallback(() => {
        setIsGuest(true);
        setUser({ displayName: 'Guest', email: '', avatarUrl: '' });
        setIsLoading(false);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        if (isGuest) {
            localStorage.removeItem(GUEST_DATA_KEY);
        }
        setToken(null);
        setUser(null);
        setIsGuest(false);
    }, [isGuest]);

    return (
        <AuthContext.Provider
            value={{ user, token, isLoading, isAuthenticated, isGuest, loginWithGoogle, loginAsGuest, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}
