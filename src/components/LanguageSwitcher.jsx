import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useClickOutside } from '../hooks/useClickOutside';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'es', label: 'Español', flag: 'ES' },
    { code: 'pt', label: 'Português', flag: 'PT' },
    { code: 'zh', label: '\u4e2d\u6587', flag: 'ZH' },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    const handleClose = useCallback(() => setIsOpen(false), []);
    useClickOutside(menuRef, isOpen ? handleClose : null);

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 hover:border-[#f4a261]/30 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 text-xs font-medium text-[#a09bb5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                </svg>
                {currentLang.flag}
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 mt-2 w-40 glass-card p-1 z-50 origin-top-right"
                    style={{ animation: 'fadeSlideIn 150ms ease-out' }}
                >
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            role="menuitem"
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] ${
                                lang.code === i18n.language
                                    ? 'text-[#f4a261] bg-[#f4a261]/10'
                                    : 'text-[#a09bb5] hover:bg-white/[0.06] hover:text-[#f0e6d3]'
                            }`}
                        >
                            <span className="text-xs font-mono w-5">{lang.flag}</span>
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
