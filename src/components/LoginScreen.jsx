import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

const I18N_TO_GOOGLE_LOCALE = { en: 'en', es: 'es', pt: 'pt-BR', zh: 'zh-CN' };

export default function LoginScreen() {
    const { loginWithGoogle, loginAsGuest } = useAuth();
    const { t, i18n } = useTranslation();
    const [error, setError] = useState(null);

    const handleSuccess = async (credentialResponse) => {
        try {
            setError(null);
            await loginWithGoogle(credentialResponse.credential);
        } catch (err) {
            console.error('Login failed:', err);
            setError(t('auth.loginError'));
        }
    };

    const handleError = () => {
        console.error('Google Login Failed');
        setError(t('auth.googleError'));
    };

    const googleLocale = I18N_TO_GOOGLE_LOCALE[i18n.language] || 'en';

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 py-8">
            {/* Centred card */}
            <div className="w-full max-w-md glass-card p-8 md:p-12 flex flex-col items-center text-center">

                {/* Branding */}
                <div className="mb-10">
                    {/* Decorative moon icon */}
                    <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#9b5de5]/10 border border-[#9b5de5]/30 flex items-center justify-center animate-float">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-8 h-8 text-[#9b5de5]"
                            aria-hidden="true"
                        >
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                    </div>

                    <h1 className="font-display text-5xl md:text-6xl font-medium tracking-tight mb-2 text-gradient">
                        Sync.
                    </h1>
                    <p className="text-[#a09bb5] text-sm tracking-wide">
                        {t('auth.subtitle')}
                    </p>
                </div>

                {/* Tagline */}
                <p className="text-[#a09bb5] text-base mb-8 max-w-xs leading-relaxed">
                    {t('auth.tagline')}
                </p>

                {/* Divider */}
                <div className="w-full flex items-center gap-4 mb-8">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[#6b6680] text-xs uppercase tracking-widest">{t('auth.divider')}</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Google Sign-In */}
                <div className="mb-6">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        text="continue_with"
                        locale={googleLocale}
                    />
                </div>

                {/* Guest mode button */}
                <button
                    type="button"
                    onClick={loginAsGuest}
                    className="mb-6 px-5 py-2.5 rounded-full text-sm font-medium text-[#a09bb5] border border-white/10 hover:border-[#f4a261]/30 hover:text-[#f0e6d3] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300"
                >
                    {t('auth.tryWithoutAccount')}
                </button>

                {/* Error message */}
                {error && (
                    <div
                        role="alert"
                        className="mb-6 w-full p-3 rounded-lg bg-[#f15bb5]/10 border border-[#f15bb5]/30 text-[#f15bb5] text-sm"
                    >
                        {error}
                    </div>
                )}

                {/* Privacy notice */}
                <p className="text-[#6b6680] text-xs leading-relaxed max-w-xs">
                    {t('auth.privacyNotice')}
                </p>
            </div>
        </div>
    );
}
