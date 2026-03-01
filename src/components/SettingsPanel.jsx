import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Tooltip from './Tooltip';

/**
 * Settings panel containing all sleep schedule configuration controls.
 * Organized in two rows: current status and objectives.
 * @param {Object} props
 * @param {string}   props.startDate                      - Plan start date (YYYY-MM-DD)
 * @param {Function} props.setStartDate                   - Setter for startDate
 * @param {string}   props.initialSleep                   - Initial bedtime (HH:MM)
 * @param {Function} props.handleInitialSleepChange       - Handler for sleep time changes
 * @param {string}   props.initialWake                    - Initial wake time (HH:MM)
 * @param {Function} props.handleInitialWakeChange        - Handler for wake time changes
 * @param {number}   props.desiredSleepHours              - Desired sleep duration in hours
 * @param {Function} props.handleDesiredSleepHoursChange  - Handler for sleep hours changes
 * @param {Function} props.applyDesiredSleepHoursToInitial - Recalculate initial wake from sleep hours
 * @param {number}   props.effectiveDesiredSleepHours     - Sanitized sleep hours value
 * @param {string}   props.targetSleep                    - Target bedtime (HH:MM)
 * @param {Function} props.setTargetSleep                 - Setter for targetSleep
 * @param {string}   props.targetWake                     - Target wake time (HH:MM)
 * @param {Function} props.setTargetWake                  - Setter for targetWake
 * @param {number}   props.effectiveShiftAmount            - Sanitized shift amount
 * @param {number}   props.shiftAmount                    - Raw shift amount (30-50)
 * @param {Function} props.setShiftAmount                 - Setter for shiftAmount
 * @param {number}   props.consolidationDays              - Raw consolidation days
 * @param {Function} props.setConsolidationDays           - Setter for consolidationDays
 * @param {number}   props.effectiveConsolidationDays     - Sanitized consolidation days
 * @param {import('../lib/circadian.js').SimulationResult} props.todaySimulation - Today's simulation result
 * @param {number}   props.dayNumber                      - Current day number in the plan
 * @param {'hold'|'advance'|null} props.dayOverride       - Override for today (null=auto)
 * @param {boolean}  props.isBeforeStart                  - Whether today is before plan start
 * @param {boolean}  props.isAdvanceDay                   - Whether today is an advance day
 * @param {boolean}  props.isTodayAdvanceApplied          - Whether advance was applied today
 * @param {string}   props.todayModeLabel                 - Display label for today's mode
 * @param {string}   props.todayModeTooltip               - Tooltip for today's mode badge
 * @param {Function} props.handleOverrideChange           - Handler for day override changes
 * @param {Function} props.resetAll                       - Reset all settings to defaults
 */
export default function SettingsPanel({
    startDate, setStartDate,
    initialSleep, handleInitialSleepChange,
    initialWake, handleInitialWakeChange,
    desiredSleepHours, handleDesiredSleepHoursChange, applyDesiredSleepHoursToInitial,
    effectiveDesiredSleepHours,
    targetSleep, setTargetSleep,
    targetWake, setTargetWake,
    effectiveShiftAmount,
    shiftAmount, setShiftAmount,
    consolidationDays, setConsolidationDays,
    effectiveConsolidationDays,
    todaySimulation,
    dayNumber, dayOverride, isBeforeStart, isAdvanceDay, isTodayAdvanceApplied,
    todayModeLabel, todayModeTooltip,
    handleOverrideChange,
    resetAll,
}) {
    const { t } = useTranslation();

    return (
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
                                    <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
                                </Tooltip>
                            </div>
                            <input id="start-date" type="date" autoComplete="off" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="pt-3 border-t border-white/10 space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="initial-sleep" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.initialSleep')}</label>
                                <Tooltip content={t('settings.initialSleepTooltip')}>
                                    <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
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
                                    <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
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
                                <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
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
                                    <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
                                </Tooltip>
                            </div>
                            <input id="target-sleep" type="time" autoComplete="off" value={targetSleep} onChange={e => setTargetSleep(e.target.value)} />
                        </div>
                        <div className="pt-3 border-t border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <label htmlFor="target-wake-objective" className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest">{t('settings.targetWake')}</label>
                                <Tooltip content={t('settings.targetWakeTooltip')}>
                                    <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
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
                                        <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
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
                                        <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
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
                                    <HelpCircle className="w-4 h-4 text-[#6b6680] cursor-help" aria-hidden="true" />
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
    );
}
