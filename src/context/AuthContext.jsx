import { createContext, useState, useEffect, useCallback } from 'react';
import { api, TOKEN_KEY } from '../lib/api.js';
import { GUEST_DATA_KEY } from '../lib/constants.js';

/**
 * @typedef {Object} AuthUser
 * @property {string} displayName - User's display name
 * @property {string} email       - User's email address
 * @property {string} avatarUrl   - URL to user's avatar image
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser|null} user            - Current user or null if unauthenticated
 * @property {string|null}   token           - JWT token or null
 * @property {boolean}       isLoading       - Whether auth state is being verified
 * @property {boolean}       isAuthenticated - Whether the user is logged in (or guest)
 * @property {boolean}       isGuest         - Whether the user is in guest mode
 * @property {(credential: string) => Promise<{token: string, user: AuthUser}>} loginWithGoogle - Google OAuth login
 * @property {() => void}    loginAsGuest    - Enter guest mode
 * @property {() => void}    logout          - Clear session and redirect to login
 */

/** @type {import('react').Context<AuthContextValue|null>} */
export const AuthContext = createContext(null); // eslint-disable-line react-refresh/only-export-components

/**
 * Provides authentication state and actions to the component tree.
 * Verifies stored JWT on mount, supports Google OAuth and guest mode.
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    const isAuthenticated = (!!user && !!token) || isGuest;

    // Verify the stored token once on mount (and whenever the token value changes).
    useEffect(() => {
        if (!token) {
            setIsLoading(false); // eslint-disable-line react-hooks/set-state-in-effect
            return;
        }

        let cancelled = false;

        api.get('/api/auth/me')
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
        const data = await api.post('/api/auth/google', { credential });
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
