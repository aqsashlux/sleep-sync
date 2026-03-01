import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Moon, Sun, ArrowRight, Calendar, Activity, Copy, Check, X, HelpCircle, Coffee } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import UserMenu from './UserMenu';
import { api } from '../lib/api.js';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import GuestBanner from './GuestBanner';

// Decorative icons wrapper
const Icon = ({ icon, className, ...props }) => {
    const Component = icon;
    return <Component className={className} aria-hidden="true" {...props} />;
};

// Tooltip Component
const Tooltip = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute ${positionClasses[position]} z-50 w-64 p-3 glass-card text-sm text-[#a09bb5] animate-in fade-in duration-200`}>
                    {content}
                    <div className={`absolute w-2 h-2 bg-[#1a1a2e] border-r border-b border-white/10 transform rotate-45 ${
                        position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
                        position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-[225deg]' :
                        position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 rotate-[135deg]' :
                        'right-full top-1/2 -translate-y-1/2 -mr-1 rotate-[315deg]'
                    }`} />
                </div>
            )}
        </div>
    );
};

// Onboarding Modal Component
const OnboardingModal = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const { t } = useTranslation();
    const totalSteps = 4;

    if (!isOpen) return null;

    const steps = [
        {
            title: t('onboarding.welcomeTitle'),
            subtitle: t('onboarding.welcomeSubtitle'),
            content: (
                <div className="text-center">
                    <div className="text-6xl mb-6 animate-float">??</div>
                    <p className="text-[#a09bb5] mb-4">
                        {t('onboarding.welcomeDesc')}
                    </p>
                    <p className="text-[#6b6680] text-sm">
                        {t('onboarding.welcomeNote')}
                    </p>
                </div>
            )
        },
        {
            title: t('onboarding.howItWorksTitle'),
            subtitle: t('onboarding.howItWorksSubtitle'),
            content: (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 glass-card">
                        <div className="w-12 h-12 rounded-full bg-[#00f5d4]/10 border border-[#00f5d4]/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#00f5d4] font-bold">A</span>
                        </div>
                        <div>
                            <div className="text-[#f0e6d3] font-semibold mb-1">{t('onboarding.advanceDays')}</div>
                            <div className="text-[#a09bb5] text-sm">{t('onboarding.advanceDaysDesc')}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 glass-card">
                        <div className="w-12 h-12 rounded-full bg-[#9b5de5]/10 border border-[#9b5de5]/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#c77dff] font-bold">C</span>
                        </div>
                        <div>
                            <div className="text-[#f0e6d3] font-semibold mb-1">{t('onboarding.consolidationDays')}</div>
                            <div className="text-[#a09bb5] text-sm">{t('onboarding.consolidationDaysDesc')}</div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                        <span className="w-3 h-3 rounded-full bg-[#00f5d4]"></span>
                        <span className="w-3 h-3 rounded-full bg-[#9b5de5]"></span>
                        <span className="w-3 h-3 rounded-full bg-[#00f5d4]"></span>
                        <span className="w-3 h-3 rounded-full bg-[#9b5de5]"></span>
                    </div>
                </div>
            )
        },
        {
            title: t('onboarding.configureTitle'),
            subtitle: t('onboarding.configureSubtitle'),
            content: (
                <div className="space-y-4">
                    <div className="p-4 glass-card">
                        <div className="flex items-center gap-3 mb-3">
                            <Moon className="w-5 h-5 text-[#9b5de5]" />
                            <span className="text-[#f0e6d3] font-medium">{t('onboarding.targetBedtime')}</span>
                        </div>
                        <p className="text-[#a09bb5] text-sm mb-2">{t('onboarding.targetBedtimeDesc')}</p>
                        <div className="text-3xl font-mono text-[#f0e6d3] bg-[#1a1a2e] px-4 py-2 rounded-lg inline-block">23:00</div>
                    </div>
                    <div className="p-4 glass-card">
                        <div className="flex items-center gap-3 mb-3">
                            <Activity className="w-5 h-5 text-[#f4a261]" />
                            <span className="text-[#f0e6d3] font-medium">{t('onboarding.paceOfChange')}</span>
                        </div>
                        <p className="text-[#a09bb5] text-sm mb-2">{t('onboarding.paceOfChangeDesc')}</p>
                        <div className="flex items-center gap-4">
                            <span className="text-[#6b6680] text-sm">{t('onboarding.conservative')}</span>
                            <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full">
                                <div className="w-1/2 h-full bg-gradient-to-r from-[#9b5de5] to-[#f4a261] rounded-full"></div>
                            </div>
                            <span className="text-[#6b6680] text-sm">{t('onboarding.fast')}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: t('onboarding.readyTitle'),
            subtitle: t('onboarding.readySubtitle'),
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-7 gap-2 text-center text-xs">
                        {[t('onboarding.daysMon'), t('onboarding.daysTue'), t('onboarding.daysWed'), t('onboarding.daysThu'), t('onboarding.daysFri'), t('onboarding.daysSat'), t('onboarding.daysSun')].map((day) => (
                            <div key={day} className="text-[#6b6680]">{day}</div>
                        ))}
                        {['02:00', '02:00', '01:30', '01:30', '01:00', '01:00', '00:30'].map((time, i) => (
                            <div key={i} className={`p-2 rounded-lg ${i % 2 === 0 ? 'bg-[#9b5de5]/20 text-[#c77dff]' : 'bg-[#00f5d4]/20 text-[#00f5d4]'} font-mono`}>
                                {time}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-[#00f5d4]/20"></span>
                            <span className="text-[#a09bb5]">{t('status.advance')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-[#9b5de5]/20"></span>
                            <span className="text-[#a09bb5]">{t('status.consolidation')}</span>
                        </div>
                    </div>
                    <p className="text-[#a09bb5] text-center text-sm">
                        {t('onboarding.readyDesc')}
                    </p>
                </div>
            )
        }
    ];

    const currentStep = steps[step - 1];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0f1a]/90 backdrop-blur-sm">
            <div className="w-full max-w-lg glass-card p-8 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#6b6680] hover:text-[#f0e6d3] transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i + 1)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                i + 1 === step ? 'w-8 bg-[#f4a261]' :
                                i + 1 < step ? 'bg-[#f4a261]/50' : 'bg-[#6b6680]/30'
                            }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h2 className="font-display text-3xl font-medium mb-2 text-gradient">
                        {currentStep.title}
                    </h2>
                    <p className="text-[#a09bb5]">{currentStep.subtitle}</p>
                </div>

                <div className="mb-8">
                    {currentStep.content}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setStep(Math.max(1, step - 1))}
                        disabled={step === 1}
                        className={`px-4 py-2 text-sm ${step === 1 ? 'text-[#4a5568] cursor-not-allowed' : 'text-[#a09bb5] hover:text-[#f0e6d3]'}`}
                    >
                        {t('onboarding.previous')}
                    </button>

                    {step < totalSteps ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-6 py-3 rounded-full bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20 transition-all font-medium flex items-center gap-2"
                        >
                            {t('onboarding.next')}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={onComplete}
                            className="px-6 py-3 rounded-full bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/30 hover:bg-[#00f5d4]/20 transition-all font-medium flex items-center gap-2"
                        >
                            {t('onboarding.start')}
                            <Check className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Skip option */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 text-xs text-[#6b6680] hover:text-[#a09bb5] transition-colors"
                >
                    {t('onboarding.skipTutorial')}
                </button>
            </div>
        </div>
    );
};

const LEGACY_STORAGE_KEY = 'circadian-calculator-data';
const ONBOARDING_KEY = 'sync-onboarding-complete';

// Fases del ciclo circadiano (relativas a hora de despertar)
const CIRCADIAN_PHASES = [
    { id: 'inertia', nameKey: 'phases.inertia', tipKey: 'phaseTips.inertia', offsetMin: 0, durationMin: 30, emoji: '\ud83d\ude34', energy: 20 },
    { id: 'waking', nameKey: 'phases.waking', tipKey: 'phaseTips.waking', offsetMin: 30, durationMin: 90, emoji: '\ud83c\udf05', energy: 45 },
    { id: 'morning-peak', nameKey: 'phases.morningPeak', tipKey: 'phaseTips.morningPeak', offsetMin: 120, durationMin: 120, emoji: '\u2600\ufe0f', energy: 95 },
    { id: 'plateau', nameKey: 'phases.plateau', tipKey: 'phaseTips.plateau', offsetMin: 240, durationMin: 120, emoji: '\ud83d\udcaa', energy: 85 },
    { id: 'post-lunch', nameKey: 'phases.postLunch', tipKey: 'phaseTips.postLunch', offsetMin: 360, durationMin: 120, emoji: '\ud83d\ude2a', energy: 35 },
    { id: 'recovery', nameKey: 'phases.recovery', tipKey: 'phaseTips.recovery', offsetMin: 480, durationMin: 120, emoji: '\u26a1', energy: 55 },
    { id: 'evening-peak', nameKey: 'phases.eveningPeak', tipKey: 'phaseTips.eveningPeak', offsetMin: 600, durationMin: 120, emoji: '\ud83c\udf1f', energy: 80 },
    { id: 'decline', nameKey: 'phases.decline', tipKey: 'phaseTips.decline', offsetMin: 720, durationMin: 120, emoji: '\ud83c\udf19', energy: 50 },
    { id: 'wind-down', nameKey: 'phases.windDown', tipKey: 'phaseTips.windDown', offsetMin: 840, durationMin: 120, emoji: '\ud83d\udca4', energy: 25 },
];

const I18N_TO_DATE_LOCALE = { en: 'en-US', es: 'es-ES', pt: 'pt-BR', zh: 'zh-CN' };
const GUEST_DATA_KEY = 'sync_guest_data';

// Función para obtener colores según nivel de energía - Nocturnal Theme
const getEnergyColor = (energy) => {
    if (energy >= 80) return {
        bg: 'bg-gradient-to-r from-[#f4a261] to-[#f9c74f]',
        text: 'text-[#f4a261]',
        light: 'bg-[#f4a261]/10 border-[#f4a261]/20',
        bar: 'energy-bar-high',
        glow: 'shadow-[0_0_20px_rgba(244,162,97,0.4)]'
    };
    if (energy >= 60) return {
        bg: 'bg-gradient-to-r from-[#c77dff] to-[#9b5de5]',
        text: 'text-[#c77dff]',
        light: 'bg-[#9b5de5]/10 border-[#9b5de5]/20',
        bar: 'energy-bar-medium',
        glow: 'shadow-[0_0_20px_rgba(155,93,229,0.4)]'
    };
    if (energy >= 40) return {
        bg: 'bg-gradient-to-r from-[#667eea] to-[#764ba2]',
        text: 'text-[#667eea]',
        light: 'bg-[#667eea]/10 border-[#667eea]/20',
        bar: 'energy-bar-low',
        glow: 'shadow-[0_0_20px_rgba(102,126,234,0.4)]'
    };
    if (energy >= 25) return {
        bg: 'bg-gradient-to-r from-[#4a5568] to-[#2d3748]',
        text: 'text-[#a09bb5]',
        light: 'bg-[#4a5568]/10 border-[#4a5568]/20',
        bar: 'energy-bar-very-low',
        glow: ''
    };
    return {
        bg: 'bg-[#2d3748]',
        text: 'text-[#6b6680]',
        light: 'bg-[#2d3748]/10 border-[#2d3748]/20',
        bar: 'bg-[#1a202c]',
        glow: ''
    };
};

const toLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseLocalDate = (ymd) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const isDateOnOrBeforeToday = (ymd) => ymd <= toLocalDateString();

const sanitizeDesiredSleepHoursValue = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 8;
    const bounded = Math.min(12, Math.max(4, n));
    return Math.round(bounded * 2) / 2; // pasos de 0.5h
};

const sanitizeConsolidationDaysValue = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 2;
    return Math.min(7, Math.max(1, Math.round(n)));
};

const sleepDurationHoursBetweenTimes = (sleepTime, wakeTime) => {
    const [sh, sm] = String(sleepTime).split(':').map(Number);
    const [wh, wm] = String(wakeTime).split(':').map(Number);
    const sleepMins = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
    const wakeMins = (Number.isFinite(wh) ? wh : 0) * 60 + (Number.isFinite(wm) ? wm : 0);
    const durationMins = (wakeMins - sleepMins + 1440) % 1440;
    if (durationMins === 0) return 8;
    return Math.round((durationMins / 60) * 2) / 2;
};

const CircadianCalculator = () => {
    const { t, i18n } = useTranslation();
    const { isGuest, logout } = useAuth();
    const dateLocale = I18N_TO_DATE_LOCALE[i18n.language] || 'en-US';

    // Horario objetivo actual (se actualiza cuando avanzas)
    const [initialSleep, setInitialSleep] = useState('02:00');
    const [initialWake, setInitialWake] = useState('10:00');
    const [targetSleep, setTargetSleep] = useState('23:00');
    const [targetWake, setTargetWake] = useState('07:00');
    const [shiftAmount, setShiftAmount] = useState(30);
    const [desiredSleepHours, setDesiredSleepHours] = useState(8);
    const [consolidationDays, setConsolidationDays] = useState(2);

    // Historial para calcular qué toca hoy
    const [overridesByDate, setOverridesByDate] = useState({});
    const [advanceChecksByDate, setAdvanceChecksByDate] = useState({});

    const [activeTab, setActiveTab] = useState('calculator');
    const [startDate, setStartDate] = useState(toLocalDateString()); // Solo para mostrar "Día X"
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState('');
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | warning | error
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [saveStatusMessage, setSaveStatusMessage] = useState('');

    // Onboarding state
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Save refs
    const revisionRef = useRef(0);
    const suppressAutosaveOnceRef = useRef(false);

    // Time Helpers
    const timeToMinutes = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
    const minutesToTime = (m) => { let nm = m % 1440; if (nm < 0) nm += 1440; return `${Math.floor(nm / 60).toString().padStart(2, '0')}:${(nm % 60).toString().padStart(2, '0')}`; };
    const subtractTime = (t, m) => minutesToTime(timeToMinutes(t) - m);
    const addDays = (d, days) => { const date = typeof d === 'string' ? parseLocalDate(d) : new Date(d); date.setDate(date.getDate() + days); return date; };
    const formatDate = (d) => d.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' });
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    // Calcula las fases circadianas con horarios absolutos basados en hora de despertar
    const calculateCircadianPhases = (wakeTime) => {
        const wakeMinutes = timeToMinutes(wakeTime);
        return CIRCADIAN_PHASES.map((phase, index) => {
            const startMinutes = wakeMinutes + phase.offsetMin;
            const endMinutes = startMinutes + phase.durationMin;
            return {
                ...phase,
                startTime: minutesToTime(startMinutes),
                endTime: minutesToTime(endMinutes),
                startMinutes: startMinutes % 1440,
                endMinutes: endMinutes % 1440,
                index,
            };
        });
    };

    // Obtiene la fase actual y su progreso
    const getCurrentPhase = (phases, now, wakeTime) => {
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const wakeMinutes = timeToMinutes(wakeTime);

        // Minutos transcurridos desde despertar (manejando cruce de medianoche)
        let minutesSinceWake = nowMinutes - wakeMinutes;
        if (minutesSinceWake < -720) minutesSinceWake += 1440; // Cruce de medianoche
        if (minutesSinceWake < 0) minutesSinceWake = 0; // Antes de despertar

        // Buscar fase actual
        for (let i = 0; i < phases.length; i++) {
            const phase = phases[i];
            const phaseStart = phase.offsetMin;
            const phaseEnd = phaseStart + phase.durationMin;

            if (minutesSinceWake >= phaseStart && minutesSinceWake < phaseEnd) {
                const elapsed = minutesSinceWake - phaseStart;
                const remaining = phaseEnd - minutesSinceWake;
                const progress = (elapsed / phase.durationMin) * 100;
                const nextPhase = phases[i + 1] || null;

                return {
                    current: phase,
                    progress: Math.min(100, Math.max(0, progress)),
                    remainingMinutes: remaining,
                    nextPhase,
                    minutesSinceWake,
                    isWithinCycle: true,
                };
            }
        }

        // Fuera del ciclo (más de 16h desde despertar o antes de despertar)
        const lastPhase = phases[phases.length - 1];
        const totalCycleMinutes = lastPhase.offsetMin + lastPhase.durationMin;

        if (minutesSinceWake >= totalCycleMinutes) {
            return {
                current: { ...lastPhase, nameKey: 'energy.outOfCycle', emoji: '\ud83c\udf1a', tipKey: 'energy.shouldBeSleeping', energy: 10 },
                progress: 100,
                remainingMinutes: 0,
                nextPhase: null,
                minutesSinceWake,
                isWithinCycle: false,
            };
        }

        // Antes de despertar
        return {
            current: { nameKey: 'energy.beforeWake', emoji: '\ud83d\udca4', tipKey: 'energy.notWokenYet', energy: 5 },
            progress: 0,
            remainingMinutes: 0,
            nextPhase: phases[0],
            minutesSinceWake: 0,
            isWithinCycle: false,
        };
    };

    const isValidTimeHHMM = (value) =>
        typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

    const isValidDateYYYYMMDD = (value) => {
        if (typeof value !== 'string') return false;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const [y, m, d] = value.split('-').map(Number);
        if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
        const dt = new Date(y, m - 1, d);
        return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
    };

    const normalizeOverrideMap = (raw) => {
        if (!raw || typeof raw !== 'object') return {};
        const normalized = {};
        for (const [dateKey, action] of Object.entries(raw)) {
            if (!isValidDateYYYYMMDD(dateKey)) continue;
            if (!isDateOnOrBeforeToday(dateKey)) continue;
            if (action === 'hold' || action === 'advance') normalized[dateKey] = action;
        }
        return normalized;
    };

    const normalizeAdvanceChecksMap = (raw) => {
        if (!raw || typeof raw !== 'object') return {};
        const normalized = {};
        for (const [dateKey, checked] of Object.entries(raw)) {
            if (!isValidDateYYYYMMDD(dateKey)) continue;
            if (!isDateOnOrBeforeToday(dateKey)) continue;
            if (typeof checked === 'boolean') normalized[dateKey] = checked;
        }
        return normalized;
    };

    const sanitizeShiftAmount = (raw) => {
        const n = Number(raw);
        if (!Number.isFinite(n)) return 30;
        const bounded = clamp(n, 30, 50);
        return Math.round((bounded - 30) / 5) * 5 + 30;
    };

    const inputWarnings = [];
    if (!isValidTimeHHMM(initialSleep)) inputWarnings.push(t('validation.invalidInitialSleep'));
    if (!isValidTimeHHMM(initialWake)) inputWarnings.push(t('validation.invalidInitialWake'));
    if (!isValidTimeHHMM(targetSleep)) inputWarnings.push(t('validation.invalidTargetSleep'));
    if (!isValidTimeHHMM(targetWake)) inputWarnings.push(t('validation.invalidTargetWake'));
    if (!isValidDateYYYYMMDD(startDate)) inputWarnings.push(t('validation.invalidStartDate'));
    if (!Number.isFinite(Number(desiredSleepHours))) inputWarnings.push(t('validation.invalidSleepHours'));
    if (!Number.isFinite(Number(consolidationDays))) inputWarnings.push(t('validation.invalidConsolidationDays'));

    const effectiveInitialSleep = isValidTimeHHMM(initialSleep) ? initialSleep : '02:00';
    const effectiveInitialWake = isValidTimeHHMM(initialWake) ? initialWake : '10:00';
    const effectiveTargetSleep = isValidTimeHHMM(targetSleep) ? targetSleep : '23:00';
    const effectiveTargetWake = isValidTimeHHMM(targetWake) ? targetWake : '07:00';
    const effectiveStartDate = isValidDateYYYYMMDD(startDate) ? startDate : toLocalDateString();
    const effectiveShiftAmount = sanitizeShiftAmount(shiftAmount);
    const effectiveDesiredSleepHours = sanitizeDesiredSleepHoursValue(desiredSleepHours);
    const effectiveConsolidationDays = sanitizeConsolidationDaysValue(consolidationDays);
    const effectiveOverridesByDate = normalizeOverrideMap(overridesByDate);
    const effectiveAdvanceChecksByDate = normalizeAdvanceChecksMap(advanceChecksByDate);

    const rawOverridesCount = overridesByDate && typeof overridesByDate === 'object'
        ? Object.keys(overridesByDate).length
        : 0;
    const cleanedOverridesCount = Object.keys(effectiveOverridesByDate).length;
    if (cleanedOverridesCount < rawOverridesCount) {
        inputWarnings.push(t('validation.ignoredOverrides'));
    }

    const rawAdvanceChecksCount = advanceChecksByDate && typeof advanceChecksByDate === 'object'
        ? Object.keys(advanceChecksByDate).length
        : 0;
    const cleanedAdvanceChecksCount = Object.keys(effectiveAdvanceChecksByDate).length;
    if (cleanedAdvanceChecksCount < rawAdvanceChecksCount) {
        inputWarnings.push(t('validation.ignoredAdvanceChecks'));
    }

    const minutesUntilGoalByAdvancing = (currentMinutes, goalMinutes) => (currentMinutes - goalMinutes + 1440) % 1440;
    const sameTime = (a, b) => timeToMinutes(a) === timeToMinutes(b);

    const advanceTowardGoal = (currentTime, goalTime, maxStepMinutes) => {
        const currentMinutes = timeToMinutes(currentTime);
        const goalMinutes = timeToMinutes(goalTime);
        const remaining = minutesUntilGoalByAdvancing(currentMinutes, goalMinutes);
        if (remaining === 0) return currentTime;
        const step = Math.min(maxStepMinutes, remaining);
        return minutesToTime(currentMinutes - step);
    };

    const computeAdvanceMinutesTowardGoals = (sleepTime, wakeTime) => {
        const sleepRemaining = minutesUntilGoalByAdvancing(
            timeToMinutes(sleepTime),
            timeToMinutes(effectiveTargetSleep),
        );
        const wakeRemaining = minutesUntilGoalByAdvancing(
            timeToMinutes(wakeTime),
            timeToMinutes(effectiveTargetWake),
        );
        return {
            sleepStep: Math.min(effectiveShiftAmount, sleepRemaining),
            wakeStep: Math.min(effectiveShiftAmount, wakeRemaining),
            sleepRemaining,
            wakeRemaining,
        };
    };

    const sleepAdvanceDistance = minutesUntilGoalByAdvancing(
        timeToMinutes(effectiveInitialSleep),
        timeToMinutes(effectiveTargetSleep),
    );
    const wakeAdvanceDistance = minutesUntilGoalByAdvancing(
        timeToMinutes(effectiveInitialWake),
        timeToMinutes(effectiveTargetWake),
    );

    if (sleepAdvanceDistance > 720 || wakeAdvanceDistance > 720) {
        inputWarnings.push(t('validation.notPhaseAdvance'));
    }

    const warningMessages = [...inputWarnings];
    const todayStr = toLocalDateString();

    const dayDiffFromStart = (dateStr) => {
        const start = parseLocalDate(effectiveStartDate);
        const date = parseLocalDate(dateStr);
        start.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const shouldApplyAdvanceForDate = (dateStr, action, checksMap = effectiveAdvanceChecksByDate) => {
        if (action !== 'advance') return false;
        if (dateStr > todayStr) return true;
        return checksMap[dateStr] !== false;
    };

    const isObjectiveReached = (wakeTime) => sameTime(wakeTime, effectiveTargetWake);

    const isAdvanceCheckedForDate = (dateStr, action, checksMap = effectiveAdvanceChecksByDate) => {
        if (action !== 'advance') return false;
        if (!isDateOnOrBeforeToday(dateStr)) return false;
        return checksMap[dateStr] !== false;
    };

    const simulateToDate = (
        dateStr,
        overrideMap = effectiveOverridesByDate,
        checksMap = effectiveAdvanceChecksByDate,
    ) => {
        let sleep = effectiveInitialSleep;
        let wake = effectiveInitialWake;
        const diffDays = dayDiffFromStart(dateStr);

        if (diffDays < 0) {
            return {
                sleep,
                wake,
                action: 'hold',
                dayIndex: -1,
                isBeforeStart: true,
                advanceApplied: false,
                appliedAdvanceSleepMinutes: 0,
                appliedAdvanceWakeMinutes: 0,
            };
        }

        let actionForDate = 'hold';
        let advanceAppliedForDate = false;
        let appliedAdvanceSleepMinutes = 0;
        let appliedAdvanceWakeMinutes = 0;
        let holdDaysRemaining = 0;
        let goalReachedBeforeDay = isObjectiveReached(wake);
        for (let i = 0; i <= diffDays; i++) {
            const iterDate = addDays(effectiveStartDate, i);
            const iterDateStr = toLocalDateString(iterDate);
            const autoAction = goalReachedBeforeDay
                ? 'hold'
                : (effectiveConsolidationDays <= 1
                    ? 'advance'
                    : (holdDaysRemaining === 0 ? 'advance' : 'hold'));
            const action = goalReachedBeforeDay ? 'hold' : (overrideMap[iterDateStr] || autoAction);
            const shouldApplyAdvance = shouldApplyAdvanceForDate(iterDateStr, action, checksMap);

            const { sleepRemaining, wakeRemaining } = computeAdvanceMinutesTowardGoals(sleep, wake);
            const objectiveStep = Math.min(effectiveShiftAmount, wakeRemaining);
            const sleepStep = Math.min(objectiveStep, sleepRemaining);
            const wakeStep = objectiveStep;

            if (shouldApplyAdvance) {
                sleep = advanceTowardGoal(sleep, effectiveTargetSleep, objectiveStep);
                wake = advanceTowardGoal(wake, effectiveTargetWake, objectiveStep);
            }

            if (effectiveConsolidationDays > 1) {
                if (action === 'advance') {
                    holdDaysRemaining = effectiveConsolidationDays - 1;
                } else if (holdDaysRemaining > 0) {
                    holdDaysRemaining -= 1;
                }
            }
            goalReachedBeforeDay = isObjectiveReached(wake);

            if (i === diffDays) {
                actionForDate = action;
                advanceAppliedForDate = shouldApplyAdvance;
                appliedAdvanceSleepMinutes = shouldApplyAdvance ? sleepStep : 0;
                appliedAdvanceWakeMinutes = shouldApplyAdvance ? wakeStep : 0;
            }
        }

        return {
            sleep,
            wake,
            action: actionForDate,
            dayIndex: diffDays,
            isBeforeStart: false,
            advanceApplied: actionForDate === 'advance' ? advanceAppliedForDate : false,
            appliedAdvanceSleepMinutes,
            appliedAdvanceWakeMinutes,
        };
    };

    const todaySimulation = simulateToDate(todayStr);
    const isBeforeStart = todaySimulation.isBeforeStart;
    const dayNumber = isBeforeStart ? 1 : todaySimulation.dayIndex + 1;
    const dayOverride = isBeforeStart ? null : (effectiveOverridesByDate[todayStr] || null);
    const effectiveAction = isBeforeStart ? 'hold' : todaySimulation.action;
    const isAdvanceDay = effectiveAction === 'advance';
    const isTodayAdvanceApplied = isAdvanceDay && todaySimulation.advanceApplied;
    const todayModeLabel = isBeforeStart
        ? t('status.prestart')
        : (dayOverride
            ? (isAdvanceDay ? (isTodayAdvanceApplied ? t('status.advanceManual') : t('status.advanceNotAchievedManual')) : t('status.consolidationManual'))
            : (isAdvanceDay ? (isTodayAdvanceApplied ? t('status.advance') : t('status.advanceNotAchieved')) : t('status.consolidation')));
    const todayModeTooltip = isBeforeStart
        ? t('status.prestartTooltip')
        : (isAdvanceDay
            ? (isTodayAdvanceApplied
                ? t('status.advanceAppliedTooltip')
                : t('status.advanceNotAppliedTooltip'))
            : t('status.consolidationTooltip'));

    const handleOverrideChange = (newOverride) => {
        if (isBeforeStart) return;
        setOverridesByDate((prev) => {
            const next = { ...prev };
            if (newOverride === null) delete next[todayStr];
            else next[todayStr] = newOverride;
            return next;
        });
    };

    const handleAdvanceCheckChange = (dateStr, checked) => {
        if (!isDateOnOrBeforeToday(dateStr)) return;
        setAdvanceChecksByDate((prev) => {
            const next = { ...prev };
            if (checked) delete next[dateStr];
            else next[dateStr] = false;
            return next;
        });
    };

    const computeWakeFromSleepAndDesiredHours = (sleepTime, desiredHoursRaw = desiredSleepHours) => {
        const sleepTimeSafe = isValidTimeHHMM(sleepTime) ? sleepTime : effectiveInitialSleep;
        const desiredHours = sanitizeDesiredSleepHoursValue(desiredHoursRaw);
        const sleepMinutes = timeToMinutes(sleepTimeSafe);
        const desiredMinutes = Math.round(desiredHours * 60);
        return minutesToTime(sleepMinutes + desiredMinutes);
    };

    const handleInitialSleepChange = (newSleep) => {
        setInitialSleep(newSleep);
        if (!isValidTimeHHMM(newSleep)) return;
        setInitialWake(computeWakeFromSleepAndDesiredHours(newSleep));
    };

    const handleInitialWakeChange = (newWake) => {
        setInitialWake(newWake);
        if (!isValidTimeHHMM(initialSleep) || !isValidTimeHHMM(newWake)) return;
        setDesiredSleepHours(sleepDurationHoursBetweenTimes(initialSleep, newWake));
    };

    const handleDesiredSleepHoursChange = (rawHours) => {
        setDesiredSleepHours(rawHours);
        if (!isValidTimeHHMM(initialSleep)) return;
        setInitialWake(computeWakeFromSleepAndDesiredHours(initialSleep, rawHours));
    };

    const applyDesiredSleepHoursToInitial = () => {
        setInitialWake(computeWakeFromSleepAndDesiredHours(initialSleep));
    };
    // Data Fetching from API (db.json)
    useEffect(() => {
        let isCancelled = false;

        const applyLoadedData = (data) => {
            const legacySleep = data.targetSleep || data.lastSleep || '02:00';
            const legacyWake = data.targetWake || data.lastWake || '10:00';
            const hasExplicitGoal = Boolean(data.goalSleep || data.goalWake);
            const hasV2Model =
                Number(data.schemaVersion) >= 2 ||
                data.initialSleep ||
                data.initialWake ||
                hasExplicitGoal;

            if (hasV2Model) {
                const loadedInitialSleep = data.initialSleep || data.currentSleep || legacySleep;
                const loadedInitialWake = data.initialWake || data.currentWake || legacyWake;
                let loadedGoalSleep = data.goalSleep || data.targetSleep || '23:00';
                let loadedGoalWake = data.goalWake || data.targetWake || '07:00';
                const hasDesiredSleepHours = Number.isFinite(Number(data.desiredSleepHours));
                const loadedDesiredSleepHours = hasDesiredSleepHours
                    ? sanitizeDesiredSleepHoursValue(data.desiredSleepHours)
                    : sleepDurationHoursBetweenTimes(loadedInitialSleep, loadedInitialWake);

                setInitialSleep(loadedInitialSleep);
                setInitialWake(loadedInitialWake);
                setTargetSleep(loadedGoalSleep);
                setTargetWake(loadedGoalWake);
                setDesiredSleepHours(loadedDesiredSleepHours);
            } else {
                // Migracion legacy: conservar horas históricas sin forzar una meta por defecto.
                setInitialSleep(legacySleep);
                setInitialWake(legacyWake);
                setTargetSleep(legacySleep);
                setTargetWake(legacyWake);
                setDesiredSleepHours(sleepDurationHoursBetweenTimes(legacySleep, legacyWake));
            }
            setShiftAmount(data.shiftAmount || 30);
            setConsolidationDays(sanitizeConsolidationDaysValue(data.consolidationDays));
            setStartDate(data.startDate || toLocalDateString());

            const rawOverrides = data.overridesByDate || data.overrides || {};
            const loadedOverrides = {};
            if (rawOverrides && typeof rawOverrides === 'object') {
                for (const [dateKey, action] of Object.entries(rawOverrides)) {
                    if (!isValidDateYYYYMMDD(dateKey)) continue;
                    if (!isDateOnOrBeforeToday(dateKey)) continue;
                    if (action === 'hold' || action === 'advance') loadedOverrides[dateKey] = action;
                }
            }
            setOverridesByDate(loadedOverrides);

            const rawAdvanceChecks = data.advanceChecksByDate || data.advanceCompletionByDate || {};
            const loadedAdvanceChecks = {};
            if (rawAdvanceChecks && typeof rawAdvanceChecks === 'object') {
                for (const [dateKey, checked] of Object.entries(rawAdvanceChecks)) {
                    if (!isValidDateYYYYMMDD(dateKey)) continue;
                    if (!isDateOnOrBeforeToday(dateKey)) continue;
                    if (typeof checked === 'boolean') loadedAdvanceChecks[dateKey] = checked;
                }
            }
            setAdvanceChecksByDate(loadedAdvanceChecks);
            revisionRef.current = Number.isFinite(Number(data.revision)) ? Number(data.revision) : 0;
        };

        if (isGuest) {
            try {
                const stored = localStorage.getItem(GUEST_DATA_KEY);
                if (stored) applyLoadedData(JSON.parse(stored));
            } catch { /* noop */ }
            suppressAutosaveOnceRef.current = true;
            setIsLoading(false);
            return;
        }

        const load = async () => {
            try {
                const response = await api.get('/api/data');
                if (!response.ok) throw new Error('api-load-failed');
                const data = await response.json();
                if (isCancelled) return;
                applyLoadedData(data || {});
                setLoadError('');
            } catch {
                try {
                    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
                    if (!stored) throw new Error('no-local-fallback');
                    const fallbackData = JSON.parse(stored);
                    if (isCancelled) return;
                    applyLoadedData(fallbackData);
                    setLoadError(t('save.loadLocalFallback'));
                } catch {
                    if (!isCancelled) setLoadError(t('save.loadFailed'));
                }
            } finally {
                if (!isCancelled) {
                    suppressAutosaveOnceRef.current = true;
                    setIsLoading(false);
                }
            }
        };

        void load();
        return () => {
            isCancelled = true;
        };
    }, [isGuest]);

    // Actualizar hora actual cada minuto para la tab de energia
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Check if first visit for onboarding
    useEffect(() => {
        if (!isLoading) {
            const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
            if (!hasCompletedOnboarding) {
                setShowOnboarding(true);
            }
        }
    }, [isLoading]);

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setShowOnboarding(false);
    };

    // Data Saving to API (db.json)
    const save = useCallback(async () => {
        if (isGuest) {
            setIsSaving(true);
            setSaveStatus('saving');
            try {
                const payload = {
                    schemaVersion: 3, initialSleep, initialWake, targetSleep, targetWake,
                    goalSleep: targetSleep, goalWake: targetWake,
                    desiredSleepHours: sanitizeDesiredSleepHoursValue(desiredSleepHours),
                    shiftAmount, consolidationDays: sanitizeConsolidationDaysValue(consolidationDays),
                    startDate, overridesByDate, advanceChecksByDate, revision: 0,
                };
                localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(payload));
                const now = new Date();
                setLastSavedAt(now);
                setSaveStatus('saved');
                setSaveStatusMessage(t('save.savedVerified', { time: now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }));
            } catch {
                setSaveStatus('error');
                setSaveStatusMessage(t('save.localFallbackStatus'));
            } finally {
                setIsSaving(false);
            }
            return;
        }

        const wasPayloadPersisted = (payload, persisted) => {
            if (!persisted || typeof persisted !== 'object') return false;

            const persistedTargetSleep = persisted.goalSleep || persisted.targetSleep;
            const persistedTargetWake = persisted.goalWake || persisted.targetWake;
            const persistedRevision = Number.isFinite(Number(persisted.revision))
                ? Number(persisted.revision)
                : -1;

            return (
                persistedTargetSleep === payload.targetSleep &&
                persistedTargetWake === payload.targetWake &&
                Number(persisted.shiftAmount) === Number(payload.shiftAmount) &&
                String(persisted.startDate) === String(payload.startDate) &&
                persistedRevision >= Number(payload.revision)
            );
        };

        const nextRevision = revisionRef.current + 1;
        setIsSaving(true);
        setSaveError('');
        setSaveStatus('saving');
        setSaveStatusMessage(t('save.saving'));

        const safeOverrides = {};
        if (overridesByDate && typeof overridesByDate === 'object') {
            for (const [dateKey, action] of Object.entries(overridesByDate)) {
                if (!isValidDateYYYYMMDD(dateKey)) continue;
                if (!isDateOnOrBeforeToday(dateKey)) continue;
                if (action === 'hold' || action === 'advance') safeOverrides[dateKey] = action;
            }
        }

        const safeAdvanceChecks = {};
        if (advanceChecksByDate && typeof advanceChecksByDate === 'object') {
            for (const [dateKey, checked] of Object.entries(advanceChecksByDate)) {
                if (!isValidDateYYYYMMDD(dateKey)) continue;
                if (!isDateOnOrBeforeToday(dateKey)) continue;
                if (typeof checked === 'boolean') safeAdvanceChecks[dateKey] = checked;
            }
        }

        const payload = {
            schemaVersion: 3,
            initialSleep,
            initialWake,
            targetSleep,
            targetWake,
            goalSleep: targetSleep,
            goalWake: targetWake,
            desiredSleepHours: sanitizeDesiredSleepHoursValue(desiredSleepHours),
            shiftAmount,
            consolidationDays: sanitizeConsolidationDaysValue(consolidationDays),
            startDate,
            overridesByDate: safeOverrides,
            advanceChecksByDate: safeAdvanceChecks,
            revision: nextRevision,
        };

        try {
            const response = await api.post('/api/data', payload);
            if (!response.ok) throw new Error('api-save-failed');
            const result = await response.json();
            if (!result?.success) throw new Error('api-save-rejected');

            if (result.applied === false) {
                const currentRevision = Number.isFinite(Number(result.currentRevision))
                    ? Number(result.currentRevision)
                    : nextRevision;
                revisionRef.current = currentRevision;
                setSaveStatus('warning');
                setSaveStatusMessage(t('save.conflictWarning'));
                setSaveError(t('save.conflictError'));
            } else {
                const persistedRevision = Number.isFinite(Number(result?.data?.revision))
                    ? Number(result.data.revision)
                    : nextRevision;
                revisionRef.current = persistedRevision;

                let isVerified = wasPayloadPersisted(payload, result?.data);
                if (!isVerified) {
                    try {
                        const verifyResponse = await api.get('/api/data');
                        if (verifyResponse.ok) {
                            const verifyData = await verifyResponse.json();
                            isVerified = wasPayloadPersisted(payload, verifyData);
                        }
                    } catch {
                        // noop
                    }
                }

                if (isVerified) {
                    const now = new Date();
                    setLastSavedAt(now);
                    setSaveStatus('saved');
                    setSaveStatusMessage(t('save.savedVerified', { time: now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }));
                } else {
                    setSaveStatus('warning');
                    setSaveStatusMessage(t('save.savedPartial'));
                    setSaveError(t('save.savedPartialError'));
                }

                try {
                    localStorage.removeItem(LEGACY_STORAGE_KEY);
                } catch {
                    // noop
                }
            }
        } catch {
            // Backup local temporal por si el backend no está disponible.
            try {
                localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(payload));
            } catch {
                // noop
            }
            setSaveError(t('save.localFallbackError'));
            setSaveStatus('error');
            setSaveStatusMessage(t('save.localFallbackStatus'));
        } finally {
            setIsSaving(false);
        }
    }, [initialSleep, initialWake, targetSleep, targetWake, desiredSleepHours, shiftAmount, consolidationDays, startDate, overridesByDate, advanceChecksByDate, isGuest, t, dateLocale]);

    useEffect(() => {
        if (isLoading) return;
        if (suppressAutosaveOnceRef.current) {
            suppressAutosaveOnceRef.current = false;
            return;
        }
        const timer = setTimeout(() => {
            void save();
        }, 1000);
        return () => clearTimeout(timer);
    }, [initialSleep, initialWake, targetSleep, targetWake, desiredSleepHours, shiftAmount, consolidationDays, startDate, overridesByDate, advanceChecksByDate, isLoading, save, isGuest]);

    // Logic
    const calculate = () => {
        const sleep = todaySimulation.sleep;
        const wake = todaySimulation.wake;
        const goalReached = isObjectiveReached(wake);
        const todayAdvanceMinutes = Math.max(
            todaySimulation.appliedAdvanceSleepMinutes || 0,
            todaySimulation.appliedAdvanceWakeMinutes || 0,
        );

        if (isBeforeStart) {
            const startLabel = parseLocalDate(effectiveStartDate).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' });
            return {
                sleep,
                wake,
                caffeineCutoff: minutesToTime(timeToMinutes(wake) + 360),
                melatonin: subtractTime(sleep, 300),
                bed: subtractTime(sleep, 90),
                status: t('status.consolidation'),
                message: t('status.planStartsOn', { date: startLabel }),
                description: t('status.planNotStartedDesc'),
            };
        }

        if (goalReached) {
            return {
                sleep,
                wake,
                caffeineCutoff: minutesToTime(timeToMinutes(wake) + 360),
                melatonin: subtractTime(sleep, 300),
                bed: subtractTime(sleep, 90),
                status: t('status.consolidation'),
                message: t('status.goalReached'),
                description: t('status.goalReachedDesc'),
            };
        }

        const advanceSkippedToday = isAdvanceDay && !todaySimulation.advanceApplied;
        const isConsolidation = !isAdvanceDay || advanceSkippedToday;
        const isLastAdjustment = isAdvanceDay
            && todaySimulation.advanceApplied
            && todayAdvanceMinutes > 0
            && todayAdvanceMinutes < effectiveShiftAmount;
        return {
            sleep,
            wake,
            caffeineCutoff: minutesToTime(timeToMinutes(wake) + 360),
            melatonin: subtractTime(sleep, 300),
            bed: subtractTime(sleep, 90),
            status: isConsolidation ? t('status.consolidation') : t('status.advance'),
            message: advanceSkippedToday
                ? t('status.advanceNotDone')
                : (isConsolidation
                    ? t('status.maintainSchedule')
                    : (isLastAdjustment
                        ? t('status.advanceMinsFinal', { mins: todayAdvanceMinutes })
                        : t('status.advanceMins', { mins: effectiveShiftAmount }))),
            description: advanceSkippedToday
                ? t('status.advanceNotDoneDesc')
                : (isConsolidation
                    ? t('status.consolidationDesc')
                    : (isLastAdjustment
                        ? t('status.lastAdjustDesc')
                        : t('status.readyToAdvanceDesc'))),
        };
    };
    // Función para copiar al portapapeles
    const copyToClipboard = () => {
        const c = calculate();
        const text = `\ud83d\udca4 ${t('calculator.clipboardTitle')}

\u2022 ${t('calculator.clipboardMelatonin')}: ${c.melatonin}
\u2022 ${t('calculator.clipboardBedtime')}: ${c.bed}
\u2022 ${t('calculator.clipboardSleep')}: ${c.sleep}
\u2022 ${t('calculator.clipboardWake')}: ${c.wake}
\u2022 ${t('calculator.clipboardCaffeine')}: ${c.caffeineCutoff}

${t('calculator.clipboardMode')}: ${c.status}`;

        setCopyError('');

        if (!navigator?.clipboard?.writeText) {
            setCopyError(t('calculator.copyFailed'));
            return;
        }

        navigator.clipboard.writeText(text)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {
                setCopyError(t('calculator.copyFailedPermissions'));
            });
    };

    // Reiniciar todo a valores por defecto
    const resetAll = () => {
        suppressAutosaveOnceRef.current = false;
        setInitialSleep('02:00');
        setInitialWake('10:00');
        setTargetSleep('23:00');
        setTargetWake('07:00');
        setDesiredSleepHours(8);
        setShiftAmount(30);
        setConsolidationDays(2);
        setStartDate(toLocalDateString());
        setOverridesByDate({});
        setAdvanceChecksByDate({});
    };

    const findGoalOffsetFromToday = (todayDate) => {
        const maxSearchDays = 365;
        for (let offset = 0; offset <= maxSearchDays; offset++) {
            const date = addDays(todayDate, offset);
            const dateStr = toLocalDateString(date);
            const simulation = simulateToDate(dateStr);
            if (isObjectiveReached(simulation.wake)) {
                return offset;
            }
        }
        return null;
    };

    const schedule = () => {
        const res = [];
        const todayDate = new Date();
        const pastDaysVisible = 7;
        const minFutureDaysVisible = 14;
        const goalOffsetFromToday = findGoalOffsetFromToday(todayDate);
        const futureDaysVisible = Math.max(
            minFutureDaysVisible,
            goalOffsetFromToday === null ? minFutureDaysVisible : goalOffsetFromToday + 2,
        );
        const firstOffset = -pastDaysVisible;
        const visibleDays = pastDaysVisible + futureDaysVisible + 1;

        for (let i = 0; i < visibleDays; i++) {
            const date = addDays(todayDate, firstOffset + i);
            const rowDateStr = toLocalDateString(date);
            const isTodayRow = rowDateStr === todayStr;
            const simulation = simulateToDate(rowDateStr);
            const action = simulation.isBeforeStart ? 'prestart' : simulation.action;
            const actionLabel = simulation.isBeforeStart
                ? t('status.prestart')
                : (simulation.action === 'advance' ? t('status.advance') : t('status.consolidation'));
            const isPastOrToday = rowDateStr <= todayStr;
            const advanceChecked = isAdvanceCheckedForDate(rowDateStr, simulation.action);

            res.push({
                dateKey: rowDateStr,
                date: formatDate(date),
                fullDate: date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' }),
                isToday: isTodayRow,
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                isBeforeStart: simulation.isBeforeStart,
                isPastOrToday,
                action,
                actionLabel,
                advanceChecked,
                advanceApplied: simulation.advanceApplied,
                advanceMinutesSleep: simulation.appliedAdvanceSleepMinutes || 0,
                advanceMinutesWake: simulation.appliedAdvanceWakeMinutes || 0,
                advanceMinutesApplied: Math.max(
                    simulation.appliedAdvanceSleepMinutes || 0,
                    simulation.appliedAdvanceWakeMinutes || 0,
                ),
                dayNumber: simulation.dayIndex >= 0 ? simulation.dayIndex + 1 : null,
                sleep: simulation.sleep,
                wake: simulation.wake,
                melatonin: subtractTime(simulation.sleep, 300),
                bed: subtractTime(simulation.sleep, 90)
            });
        }

        return {
            rows: res,
            pastDaysVisible,
            futureDaysVisible,
            goalOffsetFromToday,
        };
    };
    const current = calculate();
    const scheduleData = schedule();
    const rows = scheduleData.rows;

    if (isLoading) return (
        <div className="h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="font-display text-4xl text-gradient mb-4">Sync.</div>
                <div className="text-sm font-medium tracking-widest text-[#a09bb5] uppercase animate-pulse-slow">{t('common.loading')}</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex flex-col items-center py-6 px-4 md:px-6">

            {/* Header - Nocturnal Style */}
            <header className="w-full max-w-6xl mb-6 flex flex-col lg:flex-row justify-between items-center border-b border-white/10 pb-4 gap-4">
                <div className="text-center lg:text-left">
                    <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-1 text-gradient">Sync.</h1>
                    <p className="text-[#a09bb5] text-sm tracking-wide">{t('auth.subtitle')}</p>
                </div>

                {/* Nocturnal Tabs + User Menu */}
                <div className="flex items-center gap-4 lg:gap-6">
                    <nav className="flex flex-nowrap items-center justify-center gap-4 lg:gap-6" role="tablist" aria-label="App sections">
                        <button
                            role="tab"
                            aria-selected={activeTab === 'calculator'}
                            onClick={() => setActiveTab('calculator')}
                            className={`text-sm tracking-widest uppercase pb-2 transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] ${activeTab === 'calculator' ? 'text-[#f0e6d3] tab-active' : 'text-[#6b6680] hover:text-[#a09bb5]'}`}
                        >
                            {t('tabs.today')}
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'table'}
                            onClick={() => setActiveTab('table')}
                            className={`text-sm tracking-widest uppercase pb-2 transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] ${activeTab === 'table' ? 'text-[#f0e6d3] tab-active' : 'text-[#6b6680] hover:text-[#a09bb5]'}`}
                        >
                            {t('tabs.calendar')}
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'energy'}
                            onClick={() => setActiveTab('energy')}
                            className={`text-sm tracking-widest uppercase pb-2 transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] ${activeTab === 'energy' ? 'text-[#f0e6d3] tab-active' : 'text-[#6b6680] hover:text-[#a09bb5]'}`}
                        >
                            {t('tabs.energy')}
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'about'}
                            onClick={() => setActiveTab('about')}
                            className={`text-sm tracking-widest uppercase pb-2 transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] ${activeTab === 'about' ? 'text-[#f0e6d3] tab-active' : 'text-[#6b6680] hover:text-[#a09bb5]'}`}
                        >
                            {t('tabs.about')}
                        </button>
                    </nav>
                    <LanguageSwitcher />
                    <div className="border-l border-white/10 h-6" aria-hidden="true"></div>
                    <UserMenu />
                </div>
            </header>

            <main className="w-full max-w-6xl">

                {(loadError || saveError) && (
                    <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
                        {loadError || saveError}
                    </div>
                )}

                {warningMessages.length > 0 && (
                    <div aria-live="polite" className="mb-4 rounded-xl border border-[#f4a261]/30 bg-[#f4a261]/10 px-4 py-3 text-sm text-[#f0e6d3] backdrop-blur-sm">
                        <div className="mb-1 font-medium text-[#f4a261]">{t('common.warnings')}</div>
                        <ul className="list-disc ml-5 space-y-1">
                            {warningMessages.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {isGuest && <GuestBanner onSignIn={() => { logout(); }} />}

                {/* Settings Panel */}
                {activeTab === 'calculator' && (
                    <div id="settings-panel" className="mb-5 space-y-4">

                    {/* Row 1 — Estado Actual */}
                    <div>
                        <div className="text-[11px] font-semibold text-[#6b6680] uppercase tracking-widest mb-2">{t('settings.currentStatus')}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

                            {/* Card 1: Inicio + Dormir Inicial */}
                            <div className="glass-card p-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="start-date" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.startDate')}</label>
                                        <Tooltip content={t('settings.startDateTooltip')}>
                                            <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <input id="start-date" type="date" autoComplete="off" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div className="pt-3 border-t border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="initial-sleep" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.initialSleep')}</label>
                                        <Tooltip content={t('settings.initialSleepTooltip')}>
                                            <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <input id="initial-sleep" type="time" autoComplete="off" value={initialSleep} onChange={e => handleInitialSleepChange(e.target.value)} />
                                </div>
                            </div>

                            {/* Card 2: Despertar Inicial + Horas de sueno */}
                            <div className="glass-card p-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="initial-wake" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.initialWake')}</label>
                                        <Tooltip content={t('settings.initialWakeTooltip')}>
                                            <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <input id="initial-wake" type="time" autoComplete="off" value={initialWake} onChange={e => handleInitialWakeChange(e.target.value)} />
                                </div>
                                <div className="pt-3 border-t border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="desired-sleep-hours" className="text-[11px] font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.sleepHours')}</label>
                                        <span className="text-xs text-[#f4a261] font-mono">{effectiveDesiredSleepHours}h</span>
                                    </div>
                                    <input
                                        id="desired-sleep-hours"
                                        type="number"
                                        min="4"
                                        max="12"
                                        step="0.5"
                                        value={desiredSleepHours}
                                        onChange={e => handleDesiredSleepHoursChange(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={applyDesiredSleepHoursToInitial}
                                        className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20 transition-all"
                                    >
                                        {t('settings.calculateInitialWake')}
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Horario actual (Auto) */}
                            <div className="glass-card p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="current-sleep" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.currentScheduleAuto')}</label>
                                    <Tooltip content={t('settings.currentScheduleTooltip')}>
                                        <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                    </Tooltip>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[11px] text-[#6b6680] mb-1 uppercase tracking-wider">{t('settings.sleepToday')}</div>
                                        <input id="current-sleep" type="time" value={todaySimulation.sleep} readOnly aria-readonly="true" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-[#6b6680] mb-1 uppercase tracking-wider">{t('settings.wakeToday')}</div>
                                        <input id="current-wake" type="time" value={todaySimulation.wake} readOnly aria-readonly="true" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Row 2 — Objetivos */}
                    <div>
                        <div className="text-[11px] font-semibold text-[#6b6680] uppercase tracking-widest mb-2">{t('settings.objectives')}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

                            {/* Card 4: Meta Dormir + Meta Despertar */}
                            <div className="glass-card p-4 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="target-sleep" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.targetSleep')}</label>
                                        <Tooltip content={t('settings.targetSleepTooltip')}>
                                            <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <input id="target-sleep" type="time" autoComplete="off" value={targetSleep} onChange={e => setTargetSleep(e.target.value)} />
                                </div>
                                <div className="pt-3 border-t border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="target-wake-objective" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.targetWake')}</label>
                                        <Tooltip content={t('settings.targetWakeTooltip')}>
                                            <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <input id="target-wake-objective" type="time" autoComplete="off" value={targetWake} onChange={e => setTargetWake(e.target.value)} />
                                    <p className="text-[11px] text-[#6b6680]">
                                        {t('settings.finalAdjustNote', { amount: effectiveShiftAmount })}
                                    </p>
                                </div>
                            </div>

                            {/* Card 5: Ritmo + Consolidacion */}
                            <div className="glass-card p-4 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <label htmlFor="shift-amount" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.pace')}</label>
                                            <Tooltip content={t('settings.paceTooltip')}>
                                                <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                            </Tooltip>
                                        </div>
                                        <span id="shift-value" className="text-xs font-mono text-[#f4a261]" aria-live="polite">{shiftAmount}m</span>
                                    </div>
                                    <input id="shift-amount" type="range" min="30" max="50" step="5" aria-valuemin="30" aria-valuemax="50" aria-valuenow={shiftAmount} aria-labelledby="shift-value" value={shiftAmount} onChange={e => setShiftAmount(Number(e.target.value))} />
                                </div>
                                <div className="pt-3 border-t border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <label htmlFor="consolidation-days" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.consolidation')}</label>
                                            <Tooltip content={t('settings.consolidationTooltip')}>
                                                <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                            </Tooltip>
                                        </div>
                                        <span className="text-xs font-mono text-[#f4a261]">{effectiveConsolidationDays <= 1 ? t('settings.daily') : t('settings.daysPerCycle', { days: effectiveConsolidationDays })}</span>
                                    </div>
                                    <input
                                        id="consolidation-days"
                                        type="number"
                                        min="1"
                                        max="7"
                                        step="1"
                                        value={consolidationDays}
                                        onChange={e => setConsolidationDays(Number(e.target.value))}
                                    />
                                    <p className="text-[11px] text-[#6b6680]">
                                        {effectiveConsolidationDays <= 1
                                            ? t('settings.dailyAdvanceNote')
                                            : t('settings.consolidationPatternNote', { days: effectiveConsolidationDays - 1 })}
                                    </p>
                                </div>
                            </div>

                            {/* Card 6: Dia actual + Selector de modo */}
                            <div className="glass-card p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.day', { number: dayNumber })}</label>
                                        <Tooltip content={t('settings.dayTooltip')}>
                                            <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <Tooltip content={todayModeTooltip}>
                                        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full cursor-help ${isBeforeStart ? 'bg-[#6b6680]/20 text-[#a09bb5] border border-[#6b6680]/30' : (isAdvanceDay ? (isTodayAdvanceApplied ? 'bg-[#f4a261]/20 text-[#f4a261] border border-[#f4a261]/30' : 'bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/40') : 'bg-[#9b5de5]/20 text-[#c77dff] border border-[#9b5de5]/30')}`}>
                                            {todayModeLabel}
                                        </span>
                                    </Tooltip>
                                </div>
                                {/* Selector de modo: Auto / Consolidar / Avanzar */}
                                <div className="flex gap-1 p-1 bg-[#1a1a2e] rounded-lg border border-white/5" role="group" aria-label={t('settings.dayModeLabel')}>
                                    <button
                                        aria-pressed={dayOverride === null}
                                        disabled={isBeforeStart}
                                        onClick={() => handleOverrideChange(null)}
                                        className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-40 disabled:cursor-not-allowed ${dayOverride === null ? 'bg-[#f4a261]/20 text-[#f4a261] shadow-[0_0_10px_rgba(244,162,97,0.2)]' : 'text-[#6b6680] hover:text-[#a09bb5]'}`}
                                    >
                                        Auto
                                    </button>
                                    <button
                                        aria-pressed={dayOverride === 'hold'}
                                        disabled={isBeforeStart}
                                        onClick={() => handleOverrideChange('hold')}
                                        className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-40 disabled:cursor-not-allowed ${dayOverride === 'hold' ? 'bg-[#9b5de5]/20 text-[#c77dff] shadow-[0_0_10px_rgba(155,93,229,0.2)]' : 'text-[#6b6680] hover:text-[#a09bb5]'}`}
                                    >
                                        {t('settings.consolidate')}
                                    </button>
                                    <button
                                        aria-pressed={dayOverride === 'advance'}
                                        disabled={isBeforeStart}
                                        onClick={() => handleOverrideChange('advance')}
                                        className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-40 disabled:cursor-not-allowed ${dayOverride === 'advance' ? 'bg-[#00f5d4]/20 text-[#00f5d4] shadow-[0_0_10px_rgba(0,245,212,0.2)]' : 'text-[#6b6680] hover:text-[#a09bb5]'}`}
                                    >
                                        {t('settings.advance')}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Reiniciar — secondary action, outside grid */}
                    <div className="flex justify-end">
                        <button
                            onClick={resetAll}
                            className="py-1.5 px-4 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                            {t('settings.resetAll')}
                        </button>
                    </div>

                    </div>
                )}

                {/* Content Area */}
                {activeTab === 'calculator' && (
                    <div className="motion-safe:animate-in motion-safe:fade-in duration-700">
                        {/* Status Big Title - Nocturnal Style */}
                        <div className="mb-8 text-center">
                            <span className={`inline-block mb-3 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border ${current.status === t('status.consolidation') ? 'bg-[#9b5de5]/10 text-[#c77dff] border-[#9b5de5]/30' : 'bg-[#f4a261]/10 text-[#f4a261] border-[#f4a261]/30'}`}>
                                {current.status}
                            </span>
                            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-2 text-[#f0e6d3] text-balance drop-shadow-[0_0_30px_rgba(244,162,97,0.3)]">
                                {current.sleep}
                            </h2>
                            <p className="text-sm md:text-base text-[#a09bb5] font-light max-w-2xl mx-auto">
                                <span className="text-[#f0e6d3] font-medium">{current.message}.</span> {current.description}
                            </p>
                        </div>

                        {/* Grid Details - Glass Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="glass-card p-4 group">
                                <div className="mb-4 text-[#9b5de5]"><Icon icon={Moon} className="w-6 h-6" strokeWidth={1.5} /></div>
                                <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('calculator.bedtime')}</div>
                                <div className="font-display text-3xl font-light tracking-tight text-[#f0e6d3]">{current.bed}</div>
                                <div className="mt-2 text-xs text-[#6b6680]">{t('calculator.bedtimeNote')}</div>
                            </div>

                            <div className="glass-card p-4 group">
                                <div className="mb-4 text-[#f4a261]"><Icon icon={Activity} className="w-6 h-6" strokeWidth={1.5} /></div>
                                <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('calculator.melatonin')}</div>
                                <div className="font-display text-3xl font-light tracking-tight text-[#f0e6d3]">{current.melatonin}</div>
                                <div className="mt-2 text-xs text-[#6b6680]">{t('calculator.melatoninNote')}</div>
                            </div>

                            <div className="glass-card p-4 group">
                                <div className="mb-4 text-[#00f5d4]"><Icon icon={Sun} className="w-6 h-6" strokeWidth={1.5} /></div>
                                <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('calculator.wake')}</div>
                                <div className="font-display text-3xl font-light tracking-tight text-[#f0e6d3]">{current.wake}</div>
                                <div className="mt-2 text-xs text-[#6b6680]">{t('calculator.wakeNote')}</div>
                            </div>

                            <div className="glass-card p-4 group">
                                <div className="mb-4 text-[#f9c74f]"><Icon icon={Coffee} className="w-6 h-6" strokeWidth={1.5} /></div>
                                <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('calculator.caffeineCutoff')}</div>
                                <div className="font-display text-3xl font-light tracking-tight text-[#f0e6d3]">{current.caffeineCutoff}</div>
                                <div className="mt-2 text-xs text-[#6b6680]">{t('calculator.caffeineCutoffNote')}</div>
                            </div>
                        </div>

                        {/* Botón Copiar */}
                        <div className="mt-8 flex justify-center">
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={copyToClipboard}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${copied
                                        ? 'bg-[#00f5d4]/20 text-[#00f5d4] border border-[#00f5d4]/30'
                                        : 'bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20'
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Icon icon={Check} className="w-4 h-4" />
                                            {t('calculator.copied')}
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon={Copy} className="w-4 h-4" />
                                            {t('calculator.copySchedule')}
                                        </>
                                    )}
                                </button>
                                {copyError && (
                                    <div className="mt-3 text-xs text-red-400">
                                        {copyError}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'table' && (
                    <div className="animate-in fade-in duration-700">
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Icon icon={Calendar} className="w-5 h-5 text-[#f4a261]" strokeWidth={1.75} />
                                <div>
                                    <h3 className="text-sm font-semibold text-[#f0e6d3] uppercase tracking-widest">{t('calendar.almanac')}</h3>
                                    <p className="text-[10px] text-[#6b6680] mt-0.5">
                                        {effectiveConsolidationDays <= 1
                                            ? t('calendar.dailyAdvance')
                                            : t('calendar.cycleDays', { days: effectiveConsolidationDays })}
                                        {scheduleData.goalOffsetFromToday !== null ? ` \u00b7 ${t('calendar.goalIn', { days: scheduleData.goalOffsetFromToday })}` : ''}
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] text-[#6b6680]">
                                {t('calendar.daysBack', { days: scheduleData.pastDaysVisible, future: scheduleData.futureDaysVisible })}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {rows.map((r, idx) => {
                                const currentDate = new Date(r.dateKey + 'T00:00:00');
                                const prevDate = idx > 0 ? new Date(rows[idx - 1].dateKey + 'T00:00:00') : null;
                                const showWeekSeparator = idx > 0 && currentDate.getDay() === 1 && (prevDate === null || prevDate.getDay() !== 1);

                                return (
                                    <React.Fragment key={r.dateKey}>
                                        {showWeekSeparator && (
                                            <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center gap-3 pt-4 pb-1">
                                                <div className="h-px flex-1 bg-white/5"></div>
                                                <span className="text-[10px] uppercase tracking-widest text-[#6b6680]">
                                                    {t('calendar.weekOf', { date: currentDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }) })}
                                                </span>
                                                <div className="h-px flex-1 bg-white/5"></div>
                                            </div>
                                        )}
                                        <article
                                            className={`glass-card rounded-xl border transition-all flex flex-col ${r.isToday
                                                ? 'p-5 lg:col-span-2 border-[#f4a261]/50 shadow-[0_0_18px_rgba(244,162,97,0.18)]'
                                                : 'p-4 border-white/5'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className={`text-sm font-semibold ${r.isToday ? 'text-[#f0e6d3]' : (r.isWeekend ? 'text-[#c77dff]' : 'text-[#a09bb5]')}`}>
                                                        {r.date}
                                                    </div>
                                                    <div className="text-[11px] text-[#6b6680]">{r.fullDate}</div>
                                                </div>
                                                {r.isToday && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-[#f4a261]/20 text-[#f4a261] px-2 py-1 rounded-full border border-[#f4a261]/30">
                                                        {t('common.today')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest border ${r.action === 'advance'
                                                ? 'border-[#f4a261]/30 text-[#f4a261] bg-[#f4a261]/10'
                                                : (r.action === 'hold'
                                                    ? 'border-[#9b5de5]/30 text-[#c77dff] bg-[#9b5de5]/10'
                                                    : 'border-[#6b6680]/30 text-[#a09bb5] bg-[#6b6680]/10')
                                                }`}>
                                                {r.actionLabel}
                                            </div>

                                            <div className={`mt-4 grid gap-3 font-mono ${r.isToday ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-2'}`}>
                                                <div className="rounded-lg border border-white/5 bg-black/20 p-2">
                                                    <div className="text-[10px] uppercase tracking-widest text-[#6b6680]">{t('calendar.sleep')}</div>
                                                    <div className="text-[#f0e6d3] text-sm">{r.sleep}</div>
                                                </div>
                                                <div className="rounded-lg border border-white/5 bg-black/20 p-2">
                                                    <div className="text-[10px] uppercase tracking-widest text-[#6b6680]">{t('calendar.wake')}</div>
                                                    <div className="text-[#a09bb5] text-sm">{r.wake}</div>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-4 min-h-[4.5rem] flex flex-col justify-end">
                                                {r.action === 'advance' ? (
                                                    <div className="space-y-2">
                                                        <label className={`flex items-center gap-2 text-xs ${r.isPastOrToday ? 'text-[#a09bb5]' : 'text-[#6b6680]'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 accent-[#00f5d4]"
                                                                checked={r.isPastOrToday ? r.advanceChecked : false}
                                                                disabled={!r.isPastOrToday}
                                                                onChange={(e) => handleAdvanceCheckChange(r.dateKey, e.target.checked)}
                                                            />
                                                            <span>{r.isPastOrToday ? t('calendar.couldAdvance') : t('calendar.markWhenReached')}</span>
                                                        </label>
                                                        <p className="text-[11px] text-[#6b6680]">
                                                            {r.advanceApplied
                                                                ? (r.advanceMinutesApplied <= 0
                                                                    ? t('calendar.goalAlreadyReached')
                                                                    : (r.advanceMinutesApplied < effectiveShiftAmount
                                                                        ? t('calendar.finalAutoAdjust', { mins: r.advanceMinutesApplied })
                                                                        : t('calendar.standardAdvance', { mins: effectiveShiftAmount })))
                                                                : t('calendar.pendingAdvance', { mins: r.advanceMinutesApplied || effectiveShiftAmount })}
                                                        </p>
                                                        {r.isPastOrToday && !r.advanceChecked && (
                                                            <p className="text-[11px] text-[#f4a261]">{t('calendar.advanceNotAppliedNote')}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-[#6b6680]">
                                                        {r.isBeforeStart ? t('calendar.beforePlanStart') : t('calendar.consolidationDay')}
                                                    </p>
                                                )}
                                            </div>
                                        </article>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'energy' && (() => {
                    const phases = calculateCircadianPhases(current.wake);
                    const phaseInfo = getCurrentPhase(phases, currentTime, current.wake);
                    const currentColors = getEnergyColor(phaseInfo.current.energy);

                    const formatRemaining = (minutes) => {
                        if (minutes <= 0) return t('energy.finished');
                        const h = Math.floor(minutes / 60);
                        const m = minutes % 60;
                        if (h === 0) return `${m}min`;
                        return `${h}h ${m}min`;
                    };

                    return (
                        <div className="motion-safe:animate-in motion-safe:fade-in duration-700">
                            {/* Tarjeta de estado actual - Glass Card */}
                            <div className={`mb-8 p-8 rounded-2xl glass-card ${currentColors.glow}`}>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <span className="text-6xl animate-float">{phaseInfo.current.emoji}</span>
                                        <div>
                                            <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-1">{t('energy.rightNow')}</div>
                                            <h2 className={`font-display text-3xl md:text-4xl font-light tracking-tight ${currentColors.text}`}>
                                                {t(phaseInfo.current.nameKey)}
                                            </h2>
                                            <p className="text-[#a09bb5] mt-2">{t(phaseInfo.current.tipKey)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-[#6b6680]">{t('energy.energyLabel')}</span>
                                            <span className={`text-4xl font-bold tabular-nums ${currentColors.text}`}>{phaseInfo.current.energy}%</span>
                                        </div>
                                        <div className="w-32 h-3 bg-[#1a1a2e] rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full ${currentColors.bar} transition-all duration-500`}
                                                style={{ width: `${phaseInfo.current.energy}%` }}
                                            />
                                        </div>
                                        {phaseInfo.isWithinCycle && (
                                            <div className="text-sm text-[#6b6680] mt-2">
                                                {t('energy.remaining', { time: formatRemaining(phaseInfo.remainingMinutes) })}
                                                {phaseInfo.nextPhase && (
                                                    <span> · {t('energy.next', { emoji: phaseInfo.nextPhase.emoji, name: t(phaseInfo.nextPhase.nameKey) })}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Barra de progreso de la fase actual */}
                                {phaseInfo.isWithinCycle && (
                                    <div className="mt-6">
                                        <div className="flex justify-between text-xs text-[#6b6680] mb-1">
                                            <span>{phaseInfo.current.startTime || current.wake}</span>
                                            <span>{phaseInfo.current.endTime || ''}</span>
                                        </div>
                                        <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full ${currentColors.bar} transition-all duration-500`}
                                                style={{ width: `${phaseInfo.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lista detallada de fases */}
                            <div>
                                <div className="text-[11px] font-semibold text-[#6b6680] uppercase tracking-widest mb-4">{t('energy.phasesOfDay')}</div>
                                <div className="space-y-3">
                                    {phases.map((phase) => {
                                        const colors = getEnergyColor(phase.energy);
                                        const isCurrentPhase = phaseInfo.current.id === phase.id;
                                        return (
                                            <div
                                                key={phase.id}
                                                className={`flex items-center gap-4 rounded-xl transition-all glass-card ${isCurrentPhase ? 'p-5 bg-gradient-to-r from-[#f4a261]/10 to-transparent border-l-2 border-l-[#f4a261] shadow-[0_0_18px_rgba(244,162,97,0.15)]' : 'p-4 hover:bg-white/[0.02]'}`}
                                            >
                                                <div className="text-2xl w-10 text-center">{phase.emoji}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-medium ${isCurrentPhase ? 'text-[#f0e6d3]' : 'text-[#a09bb5]'}`}>
                                                        {t(phase.nameKey)}
                                                        {isCurrentPhase && <span className="ml-2 text-xs bg-[#f4a261]/20 text-[#f4a261] px-2 py-0.5 rounded-full border border-[#f4a261]/30">{t('energy.now')}</span>}
                                                    </div>
                                                    <div className={`text-sm ${isCurrentPhase ? 'text-[#6b6680]' : 'text-[#4a5568]'}`}>
                                                        {t(phase.tipKey)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-[#1a1a2e] rounded-full overflow-hidden border border-white/5">
                                                        <div
                                                            className={`h-full ${isCurrentPhase ? 'bg-[#f4a261]' : colors.bar}`}
                                                            style={{ width: `${phase.energy}%` }}
                                                        />
                                                    </div>
                                                    <div className={`text-sm font-bold w-12 text-right ${isCurrentPhase ? 'text-[#f4a261]' : colors.text}`}>
                                                        {phase.energy}%
                                                    </div>
                                                </div>
                                                <div className={`text-sm font-mono w-20 text-right ${isCurrentPhase ? 'text-[#a09bb5]' : 'text-[#6b6680]'}`}>
                                                    {phase.startTime}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'about' && (
                    <div className="motion-safe:animate-in motion-safe:fade-in duration-700 max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-12 text-center">
                            <h2 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-4 text-gradient">
                                {t('about.title')}
                            </h2>
                            <p className="text-xl text-[#a09bb5]">
                                {t('about.subtitle')}
                            </p>
                        </div>

                        {/* El Problema */}
                        <section className="glass-card p-8 mb-10">
                            <h3 className="font-display text-2xl font-medium mb-4 text-[#f0e6d3]">
                                {t('about.problemTitle')}
                            </h3>
                            <p className="text-[#a09bb5] mb-4 leading-relaxed">
                                {t('about.problemDesc1')}
                            </p>
                            <p className="text-[#a09bb5] leading-relaxed">
                                {t('about.problemDesc2')}
                            </p>
                            <p className="text-[#f0e6d3] mt-4 font-medium">
                                {t('about.problemConclusion')}
                            </p>
                        </section>

                        {/* La Ciencia */}
                        <section className="glass-card p-8 mb-10">
                            <h3 className="font-display text-2xl font-medium mb-4 text-[#f0e6d3]">
                                {t('about.scienceTitle')}
                            </h3>
                            <p className="text-[#a09bb5] mb-4 leading-relaxed">
                                {t('about.scienceDesc1')}
                            </p>
                            <div className="bg-[#f4a261]/10 border border-[#f4a261]/20 rounded-xl p-6 mb-4">
                                <h4 className="text-[#f4a261] font-semibold mb-2 uppercase tracking-wide text-sm">{t('about.scienceHighlightTitle')}</h4>
                                <p className="text-[#a09bb5]">
                                    {t('about.scienceHighlightDesc')}
                                </p>
                            </div>
                            <p className="text-[#6b6680] text-sm">
                                {t('about.scienceStudies')}
                            </p>
                        </section>

                        {/* Para Quién Es */}
                        <section className="mb-10">
                            <h3 className="font-display text-2xl font-medium mb-6 text-[#f0e6d3] text-center">
                                {t('about.forWhoTitle')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="glass-card p-6">
                                    <div className="text-3xl mb-3">??</div>
                                    <h4 className="text-[#f0e6d3] font-semibold mb-2">{t('about.gamersTitle')}</h4>
                                    <p className="text-[#a09bb5] text-sm">{t('about.gamersDesc')}</p>
                                </div>
                                <div className="glass-card p-6">
                                    <div className="text-3xl mb-3">??</div>
                                    <h4 className="text-[#f0e6d3] font-semibold mb-2">{t('about.devsTitle')}</h4>
                                    <p className="text-[#a09bb5] text-sm">{t('about.devsDesc')}</p>
                                </div>
                                <div className="glass-card p-6">
                                    <div className="text-3xl mb-3">??</div>
                                    <h4 className="text-[#f0e6d3] font-semibold mb-2">{t('about.dspsTitle')}</h4>
                                    <p className="text-[#a09bb5] text-sm">{t('about.dspsDesc')}</p>
                                </div>
                                <div className="glass-card p-6">
                                    <div className="text-3xl mb-3">??</div>
                                    <h4 className="text-[#f0e6d3] font-semibold mb-2">{t('about.shiftWorkersTitle')}</h4>
                                    <p className="text-[#a09bb5] text-sm">{t('about.shiftWorkersDesc')}</p>
                                </div>
                            </div>
                        </section>

                        {/* Cómo Funciona */}
                        <section className="glass-card p-8 mb-10">
                            <h3 className="font-display text-2xl font-medium mb-6 text-[#f0e6d3]">
                                {t('about.howItWorksTitle')}
                            </h3>
                            <p className="text-[#a09bb5] mb-6">{t('about.howItWorksDesc')}</p>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#00f5d4]/10 border border-[#00f5d4]/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[#00f5d4] font-bold">A</span>
                                    </div>
                                    <div>
                                        <h4 className="text-[#f0e6d3] font-semibold mb-1">{t('about.advanceDaysTitle')}</h4>
                                        <p className="text-[#a09bb5] text-sm">{t('about.advanceDaysDesc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#9b5de5]/10 border border-[#9b5de5]/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[#c77dff] font-bold">C</span>
                                    </div>
                                    <div>
                                        <h4 className="text-[#f0e6d3] font-semibold mb-1">{t('about.consolidationDaysTitle')}</h4>
                                        <p className="text-[#a09bb5] text-sm">{t('about.consolidationDaysDesc')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <h4 className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('about.scheduleIncludes')}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-[#f4a261] font-mono text-lg mb-1">-5h</div>
                                        <div className="text-[#6b6680] text-xs">{t('about.melatonin')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[#9b5de5] font-mono text-lg mb-1">-90min</div>
                                        <div className="text-[#6b6680] text-xs">{t('about.preparation')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[#00f5d4] font-mono text-lg mb-1">{t('about.objective')}</div>
                                        <div className="text-[#6b6680] text-xs">{t('about.sleep')}</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Por Qué Gratuito */}
                        <section className="glass-card p-8 mb-10">
                            <h3 className="font-display text-2xl font-medium mb-4 text-[#f0e6d3]">
                                {t('about.madeByTitle')}
                            </h3>
                            <p className="text-[#a09bb5] mb-4 leading-relaxed">
                                {t('about.madeByDesc1')}
                            </p>
                            <p className="text-[#f0e6d3] font-medium">
                                {t('about.madeByDesc2')}
                            </p>
                            <p className="text-[#f4a261] mt-4 text-sm font-medium">
                                {t('about.madeByConclusion')}
                            </p>
                        </section>

                        {/* Disclaimer */}
                        <section className="border border-white/5 rounded-xl p-6 mb-6 bg-white/[0.01]">
                            <h4 className="text-[11px] font-semibold text-[#6b6680] uppercase tracking-widest mb-2">{t('about.disclaimerTitle')}</h4>
                            <p className="text-[#4a5568] text-sm leading-relaxed">
                                {t('about.disclaimerDesc')}
                            </p>
                        </section>

                        {/* CTA Final */}
                        <div className="text-center pb-8">
                            <p className="font-display text-xl text-[#f0e6d3] mb-6">
                                {t('about.ctaTitle')}
                            </p>
                            <button
                                onClick={() => setActiveTab('calculator')}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20 transition-all font-medium"
                            >
                                {t('about.ctaButton')}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </div>

                    </div>
                )}
            </main>

            {saveStatus !== 'idle' && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-6 right-4 sm:bottom-8 sm:right-8 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest border backdrop-blur-sm max-w-[calc(100vw-5rem)] sm:max-w-none truncate ${saveStatus === 'saving'
                        ? 'text-[#f4a261] border-[#f4a261]/30 bg-[#f4a261]/10 animate-pulse-slow'
                        : (saveStatus === 'saved'
                            ? 'text-[#00f5d4] border-[#00f5d4]/30 bg-[#00f5d4]/10'
                            : (saveStatus === 'warning'
                                ? 'text-[#f9c74f] border-[#f9c74f]/30 bg-[#f9c74f]/10'
                                : 'text-red-300 border-red-500/30 bg-red-500/10'))
                        }`}
                    title={lastSavedAt ? t('save.lastSaved', { date: lastSavedAt.toLocaleString(dateLocale) }) : undefined}
                >
                    {saveStatusMessage || (isSaving ? t('save.saving') : t('save.saveStatus'))}
                </div>
            )}

            {/* Help Button - Always visible */}
            <button
                onClick={() => setShowOnboarding(true)}
                className="fixed bottom-6 left-4 sm:bottom-8 sm:left-8 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20 transition-all flex items-center justify-center glow-pulse"
                title={t('tutorial.viewTutorial')}
            >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Onboarding Modal */}
            <OnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                onComplete={completeOnboarding}
            />
        </div>
    );
};

export default CircadianCalculator;






