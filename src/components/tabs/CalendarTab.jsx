import React from 'react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * @typedef {Object} ScheduleRow
 * @property {string}  dateKey              - Date key (YYYY-MM-DD)
 * @property {string}  date                 - Short formatted date (e.g. "Mon 3")
 * @property {string}  fullDate             - Full formatted date (e.g. "March 3, 2026")
 * @property {boolean} isToday              - Whether this row represents today
 * @property {boolean} isWeekend            - Whether this date is a weekend
 * @property {'hold'|'advance'} action      - Scheduled action for this date
 * @property {string}  actionLabel          - Localized action label
 * @property {string}  sleep                - Computed bedtime (HH:MM)
 * @property {string}  wake                 - Computed wake time (HH:MM)
 * @property {boolean} isPastOrToday        - Whether the date is today or earlier
 * @property {boolean} advanceChecked       - Whether the advance was confirmed
 * @property {boolean} advanceApplied       - Whether the advance was actually applied
 * @property {number}  advanceMinutesApplied - Minutes the schedule was advanced
 * @property {boolean} isBeforeStart        - Whether the date is before plan start
 */

/**
 * Calendar/almanac view showing the sleep schedule across past and future days.
 * @param {Object} props
 * @param {ScheduleRow[]} props.rows                     - Array of schedule rows to display
 * @param {{ goalOffsetFromToday: number|null, pastDaysVisible: number, futureDaysVisible: number }} props.scheduleData - Schedule metadata
 * @param {number}   props.effectiveConsolidationDays    - Sanitized consolidation days
 * @param {number}   props.effectiveShiftAmount          - Sanitized shift amount in minutes
 * @param {string}   props.dateLocale                    - Locale string for date formatting
 * @param {(dateKey: string, checked: boolean) => void} props.handleAdvanceCheckChange - Checkbox handler
 */
export default function CalendarTab({
    rows,
    scheduleData,
    effectiveConsolidationDays,
    effectiveShiftAmount,
    dateLocale,
    handleAdvanceCheckChange,
}) {
    const { t } = useTranslation();

    return (
        <div className="animate-in fade-in duration-700">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#f4a261]" strokeWidth={1.75} aria-hidden="true" />
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
    );
}
