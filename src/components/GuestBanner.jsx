import { useTranslation } from 'react-i18next';

export default function GuestBanner({ onSignIn }) {
    const { t } = useTranslation();

    return (
        <div className="mb-4 rounded-xl border border-[#f4a261]/30 bg-[#f4a261]/5 px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-sm">
            <div>
                <span className="text-sm font-medium text-[#f4a261]">{t('auth.guestBannerTitle')}</span>
                <p className="text-xs text-[#a09bb5] mt-0.5">{t('auth.guestBannerText')}</p>
            </div>
            {onSignIn && (
                <button
                    type="button"
                    onClick={onSignIn}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20 transition-all"
                >
                    {t('auth.guestBannerSignIn')}
                </button>
            )}
        </div>
    );
}
