import { useState } from 'react';
import { ArrowRight, Check, X, Moon, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Multi-step onboarding modal that introduces the circadian phase advance concept.
 * @param {Object} props
 * @param {boolean}    props.isOpen     - Whether the modal is visible
 * @param {() => void} props.onClose    - Called when the user dismisses the modal
 * @param {() => void} props.onComplete - Called when the user finishes all steps
 */
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
                    <div className="text-6xl mb-6 animate-float">{"\uD83C\uDF19"}</div>
                    <p className="text-[#a09bb5] mb-4">
                        {t('onboarding.welcomeText')}
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
                            <Moon className="w-5 h-5 text-[#9b5de5]" aria-hidden="true" />
                            <span className="text-[#f0e6d3] font-medium">{t('onboarding.targetBedtime')}</span>
                        </div>
                        <p className="text-[#a09bb5] text-sm mb-2">{t('onboarding.targetBedtimeQuestion')}</p>
                        <div className="text-3xl font-mono text-[#f0e6d3] bg-[#1a1a2e] px-4 py-2 rounded-lg inline-block">23:00</div>
                    </div>
                    <div className="p-4 glass-card">
                        <div className="flex items-center gap-3 mb-3">
                            <Activity className="w-5 h-5 text-[#f4a261]" aria-hidden="true" />
                            <span className="text-[#f0e6d3] font-medium">{t('onboarding.paceOfChange')}</span>
                        </div>
                        <p className="text-[#a09bb5] text-sm mb-2">{t('onboarding.paceOfChangeQuestion')}</p>
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
                        {t('onboarding.weeksEstimate')}
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
                    <X className="w-5 h-5" aria-hidden="true" />
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
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                    ) : (
                        <button
                            onClick={onComplete}
                            className="px-6 py-3 rounded-full bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/30 hover:bg-[#00f5d4]/20 transition-all font-medium flex items-center gap-2"
                        >
                            {t('onboarding.start')}
                            <Check className="w-4 h-4" aria-hidden="true" />
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

export default OnboardingModal;
