import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export default function UserMenu() {
    const { user, isGuest, logout } = useAuth();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close the dropdown when clicking outside or pressing Escape.
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    if (!user) return null;

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-[#f4a261]/30 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a]"
            >
                {/* Avatar */}
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                    />
                ) : (
                    <span className="w-7 h-7 rounded-full bg-[#9b5de5]/20 border border-[#9b5de5]/30 flex items-center justify-center text-xs font-semibold text-[#c77dff]">
                        {getInitials(user.displayName)}
                    </span>
                )}

                {/* Name (hidden on very small screens) */}
                <span className="hidden sm:inline text-sm text-[#f0e6d3] truncate max-w-[120px]">
                    {user.displayName}
                </span>

                {/* Guest badge */}
                {isGuest && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-[#f4a261]/20 text-[#f4a261] px-1.5 py-0.5 rounded-full border border-[#f4a261]/30">
                        {t('auth.guestBadge')}
                    </span>
                )}

                {/* Chevron */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-3.5 h-3.5 text-[#6b6680] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 glass-card p-1 z-50 origin-top-right"
                    style={{ animation: 'fadeSlideIn 150ms ease-out' }}
                >
                    {/* User info section */}
                    <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                                />
                            ) : (
                                <span className="w-10 h-10 rounded-full bg-[#9b5de5]/20 border border-[#9b5de5]/30 flex items-center justify-center text-sm font-semibold text-[#c77dff]">
                                    {getInitials(user.displayName)}
                                </span>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#f0e6d3] truncate">
                                    {user.displayName}
                                </p>
                                {user.email && (
                                    <p className="text-xs text-[#6b6680] truncate">
                                        {user.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-1">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#a09bb5] hover:bg-white/[0.06] hover:text-[#f0e6d3] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261]"
                        >
                            {/* Logout icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                                aria-hidden="true"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" x2="9" y1="12" y2="12" />
                            </svg>
                            {t('auth.signOut')}
                        </button>
                    </div>
                </div>
            )}

            {/* Inline keyframes for dropdown entrance */}
            <style>{`
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-4px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
