import { Moon, Sun, Activity, Copy, Check, Coffee } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * @typedef {Object} TodaySchedule
 * @property {string} status          - Localized status label (advance/consolidation)
 * @property {string} sleep           - Computed bedtime display string
 * @property {string} message         - Primary status message
 * @property {string} description     - Secondary description
 * @property {string} bed             - Bed preparation time (HH:MM)
 * @property {string} melatonin       - Melatonin intake time (HH:MM)
 * @property {string} wake            - Wake time (HH:MM)
 * @property {string} caffeineCutoff  - Caffeine cutoff time (HH:MM)
 */

/**
 * Displays today's sleep schedule with key timing cards and a copy button.
 * @param {Object} props
 * @param {TodaySchedule} props.current   - Today's computed schedule data
 * @param {boolean}       props.copied    - Whether the schedule was recently copied
 * @param {string|null}   props.copyError - Copy error message, if any
 * @param {() => void}    props.onCopy    - Handler for the copy-to-clipboard button
 */
export default function TodayTab({ current, copied, copyError, onCopy }) {
    const { t } = useTranslation();

    return (
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
                    <div className="mb-4 text-[#9b5de5]"><Moon className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" /></div>
                    <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('calculator.bedtime')}</div>
                    <div className="font-display text-3xl font-light tracking-tight text-[#f0e6d3]">{current.bed}</div>
                    <div className="mt-2 text-xs text-[#6b6680]">{t('calculator.bedtimeNote')}</div>
                </div>

                <div className="glass-card p-4 group">
                    <div className="mb-4 text-[#f4a261]"><Activity className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" /></div>
                    <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('calculator.melatonin')}</div>
                    <div className="font-display text-3xl font-light tracking-tight text-[#f0e6d3]">{current.melatonin}</div>
                    <div className="mt-2 text-xs text-[#6b6680]">{t('calculator.melatoninNote')}</div>
                </div>

                <div className="glass-card p-4 group">
                    <div className="mb-4 text-[#00f5d4]"><Sun className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" /></div>
                    <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('calculator.wake')}</div>
                    <div className="font-display text-3xl font-light tracking-tight text-[#f0e6d3]">{current.wake}</div>
                    <div className="mt-2 text-xs text-[#6b6680]">{t('calculator.wakeNote')}</div>
                </div>

                <div className="glass-card p-4 group">
                    <div className="mb-4 text-[#f9c74f]"><Coffee className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" /></div>
                    <div className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('calculator.caffeineCutoff')}</div>
                    <div className="font-display text-3xl font-light tracking-tight text-[#f0e6d3]">{current.caffeineCutoff}</div>
                    <div className="mt-2 text-xs text-[#6b6680]">{t('calculator.caffeineCutoffNote')}</div>
                </div>
            </div>

            {/* Botón Copiar */}
            <div className="mt-8 flex justify-center">
                <div className="flex flex-col items-center">
                    <button
                        onClick={onCopy}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${copied
                            ? 'bg-[#00f5d4]/20 text-[#00f5d4] border border-[#00f5d4]/30'
                            : 'bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20'
                            }`}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" aria-hidden="true" />
                                {t('calculator.copied')}
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" aria-hidden="true" />
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
    );
}
