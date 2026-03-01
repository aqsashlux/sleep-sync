import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './hooks/useAuth';
import CircadianCalculator from './components/CircadianCalculator';
import LoginScreen from './components/LoginScreen';

function LoadingScreen() {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-[#9b5de5]/30 border-t-[#9b5de5] animate-spin" />
                <span className="text-[#a09bb5] text-sm tracking-wide">{t('common.loading')}</span>
            </div>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginScreen />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <CircadianCalculator />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
}
