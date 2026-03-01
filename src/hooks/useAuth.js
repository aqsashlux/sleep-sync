import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * Convenience hook to access the AuthContext value.
 * Must be used within an AuthProvider.
 * @returns {import('../context/AuthContext.jsx').AuthContextValue}
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
