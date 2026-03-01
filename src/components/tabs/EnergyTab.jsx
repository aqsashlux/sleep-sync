import { useTranslation } from 'react-i18next';
import { calculateCircadianPhases, getCurrentPhase, getEnergyColor } from '../../lib/circadian.js';

/**
 * Displays the current circadian energy phase and a timeline of all daily phases.
 * @param {Object} props
 * @param {string} props.wakeTime    - Wake time (HH:MM) for phase calculation
 * @param {Date}   props.currentTime - Current Date for determining active phase
 */
export default function EnergyTab({ wakeTime, currentTime }) {
    const { t } = useTranslation();
    const phases = calculateCircadianPhases(wakeTime);
    const phaseInfo = getCurrentPhase(phases, currentTime, wakeTime);
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
                            <span>{phaseInfo.current.startTime || wakeTime}</span>
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
}
