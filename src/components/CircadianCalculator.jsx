import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSleepData } from '../hooks/useSleepData';
import UserMenu from './UserMenu';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import GuestBanner from './GuestBanner';
import OnboardingModal from './OnboardingModal';
import SettingsPanel from './SettingsPanel';
import TodayTab from './tabs/TodayTab';
import CalendarTab from './tabs/CalendarTab';
import EnergyTab from './tabs/EnergyTab';
import AboutTab from './tabs/AboutTab';
import {
    I18N_TO_DATE_LOCALE,
    timeToMinutes,
    minutesToTime,
    subtractTime,
    toLocalDateString,
    parseLocalDate,
    isDateOnOrBeforeToday,
    addDays,
    isValidTimeHHMM,
    isValidDateYYYYMMDD,
    sanitizeShiftAmount,
    sanitizeDesiredSleepHoursValue,
    sanitizeConsolidationDaysValue,
    normalizeOverrideMap,
    normalizeAdvanceChecksMap,
    sleepDurationHoursBetweenTimes,
    sameTime,
    simulateToDate,
} from '../lib/circadian.js';
import { ONBOARDING_KEY } from '../lib/constants.js';

const CircadianCalculator = () => {
    const { t, i18n } = useTranslation();
    const { isGuest, logout } = useAuth();
    const dateLocale = I18N_TO_DATE_LOCALE[i18n.language] || 'en-US';

    const [activeTab, setActiveTab] = useState('calculator');
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState('');
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [showOnboarding, setShowOnboarding] = useState(false);

    const {
        data,
        setInitialSleep, setInitialWake,
        setTargetSleep, setTargetWake,
        setDesiredSleepHours, setShiftAmount, setConsolidationDays,
        setStartDate, setOverridesByDate, setAdvanceChecksByDate,
        isLoading, loadError,
        isSaving, saveStatus, saveStatusMessage, lastSavedAt,
        resetAll,
    } = useSleepData({ isGuest, dateLocale });

    const {
        initialSleep, initialWake,
        targetSleep, targetWake,
        desiredSleepHours, shiftAmount, consolidationDays,
        startDate, overridesByDate, advanceChecksByDate,
    } = data;

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
                setShowOnboarding(true); // eslint-disable-line react-hooks/set-state-in-effect
            }
        }
    }, [isLoading]);

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setShowOnboarding(false);
    };

    // Derived effective values
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

    // Validation warnings
    const inputWarnings = [];
    if (!isValidTimeHHMM(initialSleep)) inputWarnings.push(t('validation.invalidInitialSleep'));
    if (!isValidTimeHHMM(initialWake)) inputWarnings.push(t('validation.invalidInitialWake'));
    if (!isValidTimeHHMM(targetSleep)) inputWarnings.push(t('validation.invalidTargetSleep'));
    if (!isValidTimeHHMM(targetWake)) inputWarnings.push(t('validation.invalidTargetWake'));
    if (!isValidDateYYYYMMDD(startDate)) inputWarnings.push(t('validation.invalidStartDate'));
    if (!Number.isFinite(Number(desiredSleepHours))) inputWarnings.push(t('validation.invalidSleepHours'));
    if (!Number.isFinite(Number(consolidationDays))) inputWarnings.push(t('validation.invalidConsolidationDays'));

    const rawOverridesCount = overridesByDate && typeof overridesByDate === 'object'
        ? Object.keys(overridesByDate).length : 0;
    if (Object.keys(effectiveOverridesByDate).length < rawOverridesCount) {
        inputWarnings.push(t('validation.ignoredOverrides'));
    }

    const rawAdvanceChecksCount = advanceChecksByDate && typeof advanceChecksByDate === 'object'
        ? Object.keys(advanceChecksByDate).length : 0;
    if (Object.keys(effectiveAdvanceChecksByDate).length < rawAdvanceChecksCount) {
        inputWarnings.push(t('validation.ignoredAdvanceChecks'));
    }

    const sleepAdvanceDistance = ((timeToMinutes(effectiveInitialSleep) - timeToMinutes(effectiveTargetSleep)) + 1440) % 1440;
    const wakeAdvanceDistance = ((timeToMinutes(effectiveInitialWake) - timeToMinutes(effectiveTargetWake)) + 1440) % 1440;
    if (sleepAdvanceDistance > 720 || wakeAdvanceDistance > 720) {
        inputWarnings.push(t('validation.notPhaseAdvance'));
    }

    const simulationArgs = [
        effectiveOverridesByDate,
        effectiveAdvanceChecksByDate,
        effectiveInitialSleep,
        effectiveInitialWake,
        effectiveTargetSleep,
        effectiveTargetWake,
        effectiveShiftAmount,
        effectiveConsolidationDays,
        effectiveStartDate,
    ];

    const isObjectiveReached = (wakeTime) => sameTime(wakeTime, effectiveTargetWake);

    const isAdvanceCheckedForDate = (dateStr, action) => {
        if (action !== 'advance') return false;
        if (!isDateOnOrBeforeToday(dateStr)) return false;
        return effectiveAdvanceChecksByDate[dateStr] !== false;
    };

    const todayStr = toLocalDateString();
    const todaySimulation = simulateToDate(todayStr, ...simulationArgs);
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
            ? (isTodayAdvanceApplied ? t('status.advanceAppliedTooltip') : t('status.advanceNotAppliedTooltip'))
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
        return minutesToTime(timeToMinutes(sleepTimeSafe) + Math.round(desiredHours * 60));
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

    // Calculate today's schedule
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
                sleep, wake,
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
                sleep, wake,
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
            sleep, wake,
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

    const findGoalOffsetFromToday = (todayDate) => {
        const maxSearchDays = 365;
        for (let offset = 0; offset <= maxSearchDays; offset++) {
            const date = addDays(todayDate, offset);
            const dateStr = toLocalDateString(date);
            const simulation = simulateToDate(dateStr, ...simulationArgs);
            if (isObjectiveReached(simulation.wake)) return offset;
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
        const formatDate = (d) => d.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' });
        const firstOffset = -pastDaysVisible;
        const visibleDays = pastDaysVisible + futureDaysVisible + 1;

        for (let i = 0; i < visibleDays; i++) {
            const date = addDays(todayDate, firstOffset + i);
            const rowDateStr = toLocalDateString(date);
            const simulation = simulateToDate(rowDateStr, ...simulationArgs);
            const action = simulation.isBeforeStart ? 'prestart' : simulation.action;
            const actionLabel = simulation.isBeforeStart
                ? t('status.prestart')
                : (simulation.action === 'advance' ? t('status.advance') : t('status.consolidation'));

            res.push({
                dateKey: rowDateStr,
                date: formatDate(date),
                fullDate: date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' }),
                isToday: rowDateStr === todayStr,
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                isBeforeStart: simulation.isBeforeStart,
                isPastOrToday: rowDateStr <= todayStr,
                action,
                actionLabel,
                advanceChecked: isAdvanceCheckedForDate(rowDateStr, simulation.action),
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
                bed: subtractTime(simulation.sleep, 90),
            });
        }

        return { rows: res, pastDaysVisible, futureDaysVisible, goalOffsetFromToday };
    };

    const current = calculate();
    const scheduleData = schedule();

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

            {/* Header */}
            <header className="w-full max-w-6xl mb-6 flex flex-col lg:flex-row justify-between items-center border-b border-white/10 pb-4 gap-4">
                <div className="text-center lg:text-left">
                    <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-1 text-gradient">Sync.</h1>
                    <p className="text-[#a09bb5] text-sm tracking-wide">{t('auth.subtitle')}</p>
                </div>

                <div className="flex items-center gap-4 lg:gap-6">
                    <nav className="flex flex-nowrap items-center justify-center gap-4 lg:gap-6" role="tablist" aria-label="App sections">
                        {[
                            { key: 'calculator', label: t('tabs.today') },
                            { key: 'table', label: t('tabs.calendar') },
                            { key: 'energy', label: t('tabs.energy') },
                            { key: 'about', label: t('tabs.about') },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                role="tab"
                                aria-selected={activeTab === key}
                                onClick={() => setActiveTab(key)}
                                className={`text-sm tracking-widest uppercase pb-2 transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] ${activeTab === key ? 'text-[#f0e6d3] tab-active' : 'text-[#6b6680] hover:text-[#a09bb5]'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                    <LanguageSwitcher />
                    <div className="border-l border-white/10 h-6" aria-hidden="true"></div>
                    <UserMenu />
                </div>
            </header>

            <main className="w-full max-w-6xl">

                {loadError && (
                    <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
                        {loadError}
                    </div>
                )}

                {inputWarnings.length > 0 && (
                    <div aria-live="polite" className="mb-4 rounded-xl border border-[#f4a261]/30 bg-[#f4a261]/10 px-4 py-3 text-sm text-[#f0e6d3] backdrop-blur-sm">
                        <div className="mb-1 font-medium text-[#f4a261]">{t('common.warnings')}</div>
                        <ul className="list-disc ml-5 space-y-1">
                            {inputWarnings.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {isGuest && <GuestBanner onSignIn={() => { logout(); }} />}

                {activeTab === 'calculator' && (
                    <SettingsPanel
                        startDate={startDate} setStartDate={setStartDate}
                        initialSleep={initialSleep} handleInitialSleepChange={handleInitialSleepChange}
                        initialWake={initialWake} handleInitialWakeChange={handleInitialWakeChange}
                        desiredSleepHours={desiredSleepHours}
                        handleDesiredSleepHoursChange={handleDesiredSleepHoursChange}
                        applyDesiredSleepHoursToInitial={applyDesiredSleepHoursToInitial}
                        effectiveDesiredSleepHours={effectiveDesiredSleepHours}
                        targetSleep={targetSleep} setTargetSleep={setTargetSleep}
                        targetWake={targetWake} setTargetWake={setTargetWake}
                        effectiveShiftAmount={effectiveShiftAmount}
                        shiftAmount={shiftAmount} setShiftAmount={setShiftAmount}
                        consolidationDays={consolidationDays} setConsolidationDays={setConsolidationDays}
                        effectiveConsolidationDays={effectiveConsolidationDays}
                        todaySimulation={todaySimulation}
                        dayNumber={dayNumber} dayOverride={dayOverride}
                        isBeforeStart={isBeforeStart} isAdvanceDay={isAdvanceDay}
                        isTodayAdvanceApplied={isTodayAdvanceApplied}
                        todayModeLabel={todayModeLabel} todayModeTooltip={todayModeTooltip}
                        handleOverrideChange={handleOverrideChange}
                        resetAll={resetAll}
                    />
                )}

                {activeTab === 'calculator' && (
                    <TodayTab
                        current={current}
                        copied={copied}
                        copyError={copyError}
                        onCopy={copyToClipboard}
                    />
                )}

                {activeTab === 'table' && (
                    <CalendarTab
                        rows={scheduleData.rows}
                        scheduleData={scheduleData}
                        effectiveConsolidationDays={effectiveConsolidationDays}
                        effectiveShiftAmount={effectiveShiftAmount}
                        dateLocale={dateLocale}
                        handleAdvanceCheckChange={handleAdvanceCheckChange}
                    />
                )}

                {activeTab === 'energy' && (
                    <EnergyTab
                        wakeTime={current.wake}
                        currentTime={currentTime}
                    />
                )}

                {activeTab === 'about' && (
                    <AboutTab
                        onGoToCalculator={() => setActiveTab('calculator')}
                    />
                )}

            </main>

            {saveStatus !== 'idle' && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-6 right-4 sm:bottom-8 sm:right-8 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest border backdrop-blur-sm max-w-[calc(100vw-5rem)] sm:max-w-none truncate ${
                        saveStatus === 'saving' ? 'text-[#f4a261] border-[#f4a261]/30 bg-[#f4a261]/10 animate-pulse-slow'
                        : saveStatus === 'saved' ? 'text-[#00f5d4] border-[#00f5d4]/30 bg-[#00f5d4]/10'
                        : saveStatus === 'warning' ? 'text-[#f9c74f] border-[#f9c74f]/30 bg-[#f9c74f]/10'
                        : 'text-red-300 border-red-500/30 bg-red-500/10'
                    }`}
                    title={lastSavedAt ? t('save.lastSaved', { date: lastSavedAt.toLocaleString(dateLocale) }) : undefined}
                >
                    {saveStatusMessage || (isSaving ? t('save.saving') : t('save.saveStatus'))}
                </div>
            )}

            <button
                onClick={() => setShowOnboarding(true)}
                className="fixed bottom-6 left-4 sm:bottom-8 sm:left-8 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20 transition-all flex items-center justify-center glow-pulse"
                title={t('tutorial.viewTutorial')}
            >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </button>

            <OnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                onComplete={completeOnboarding}
            />
        </div>
    );
};

export default CircadianCalculator;
