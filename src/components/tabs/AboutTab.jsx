import { useTranslation, Trans } from 'react-i18next';

/**
 * Informational "About" page explaining the science behind circadian phase advance.
 * @param {Object} props
 * @param {() => void} props.onGoToCalculator - Navigate to the calculator tab
 */
export default function AboutTab({ onGoToCalculator }) {
    const { t } = useTranslation();

    return (
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
                    {t('about.problemP1')}
                </p>
                <p className="text-[#a09bb5] leading-relaxed">
                    {t('about.problemP2')}
                </p>
                <p className="text-[#f0e6d3] mt-4 font-medium">
                    <Trans i18nKey="about.problemConclusion" components={{ 1: <em className="text-[#f4a261] not-italic font-semibold" /> }} />
                </p>
            </section>

            {/* La Ciencia */}
            <section className="glass-card p-8 mb-10">
                <h3 className="font-display text-2xl font-medium mb-4 text-[#f0e6d3]">
                    {t('about.scienceTitle')}
                </h3>
                <p className="text-[#a09bb5] mb-4 leading-relaxed">
                    <Trans i18nKey="about.scienceP1" components={{ 1: <em className="text-[#f0e6d3] not-italic font-semibold" /> }} />
                </p>
                <div className="bg-[#f4a261]/10 border border-[#f4a261]/20 rounded-xl p-6 mb-4">
                    <h4 className="text-[#f4a261] font-semibold mb-2 uppercase tracking-wide text-sm">{t('about.scienceBoxTitle')}</h4>
                    <p className="text-[#a09bb5]">
                        {t('about.scienceBoxText')}
                    </p>
                </div>
                <p className="text-[#6b6680] text-sm">
                    {t('about.scienceFootnote')}
                </p>
            </section>

            {/* Para Quién Es */}
            <section className="mb-10">
                <h3 className="font-display text-2xl font-medium mb-6 text-[#f0e6d3] text-center">
                    {t('about.audienceTitle')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-card p-6">
                        <div className="text-3xl mb-3">{"\uD83C\uDFAE"}</div>
                        <h4 className="text-[#f0e6d3] font-semibold mb-2">{t('about.gamersTitle')}</h4>
                        <p className="text-[#a09bb5] text-sm">{t('about.gamersDesc')}</p>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-3xl mb-3">{"\uD83D\uDCBB"}</div>
                        <h4 className="text-[#f0e6d3] font-semibold mb-2">{t('about.devsTitle')}</h4>
                        <p className="text-[#a09bb5] text-sm">{t('about.devsDesc')}</p>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-3xl mb-3">{"\uD83D\uDE34"}</div>
                        <h4 className="text-[#f0e6d3] font-semibold mb-2">{t('about.dspsTitle')}</h4>
                        <p className="text-[#a09bb5] text-sm">{t('about.dspsDesc')}</p>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-3xl mb-3">{"\uD83C\uDFED"}</div>
                        <h4 className="text-[#f0e6d3] font-semibold mb-2">{t('about.shiftTitle')}</h4>
                        <p className="text-[#a09bb5] text-sm">{t('about.shiftDesc')}</p>
                    </div>
                </div>
            </section>

            {/* Cómo Funciona */}
            <section className="glass-card p-8 mb-10">
                <h3 className="font-display text-2xl font-medium mb-6 text-[#f0e6d3]">
                    {t('about.howTitle')}
                </h3>
                <p className="text-[#a09bb5] mb-6">{t('about.howIntro')}</p>

                <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#00f5d4]/10 border border-[#00f5d4]/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#00f5d4] font-bold">A</span>
                        </div>
                        <div>
                            <h4 className="text-[#f0e6d3] font-semibold mb-1">{t('about.howAdvanceTitle')}</h4>
                            <p className="text-[#a09bb5] text-sm">{t('about.howAdvanceDesc')}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#9b5de5]/10 border border-[#9b5de5]/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#c77dff] font-bold">C</span>
                        </div>
                        <div>
                            <h4 className="text-[#f0e6d3] font-semibold mb-1">{t('about.howConsolidationTitle')}</h4>
                            <p className="text-[#a09bb5] text-sm">{t('about.howConsolidationDesc')}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                    <h4 className="text-xs font-semibold text-[#a09bb5] uppercase tracking-widest mb-3">{t('about.scheduleIncludes')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-[#f4a261] font-mono text-lg mb-1">-5h</div>
                            <div className="text-[#6b6680] text-xs">{t('about.melatoninTime')}</div>
                        </div>
                        <div>
                            <div className="text-[#9b5de5] font-mono text-lg mb-1">-90min</div>
                            <div className="text-[#6b6680] text-xs">{t('about.preparationTime')}</div>
                        </div>
                        <div>
                            <div className="text-[#00f5d4] font-mono text-lg mb-1">{t('about.objectiveTime')}</div>
                            <div className="text-[#6b6680] text-xs">{t('about.sleepTime')}</div>
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
                    {t('about.madeByP1')}
                </p>
                <p className="text-[#f0e6d3] font-medium">
                    {t('about.madeByP2')}
                </p>
                <p className="text-[#f4a261] mt-4 text-sm font-medium">
                    {t('about.madeByConclusion')}
                </p>
            </section>

            {/* Disclaimer */}
            <section className="border border-white/5 rounded-xl p-6 mb-6 bg-white/[0.01]">
                <h4 className="text-[11px] font-semibold text-[#6b6680] uppercase tracking-widest mb-2">{t('about.disclaimerTitle')}</h4>
                <p className="text-[#4a5568] text-sm leading-relaxed">
                    {t('about.disclaimerText')}
                </p>
            </section>

            {/* CTA Final */}
            <div className="text-center pb-8">
                <p className="font-display text-xl text-[#f0e6d3] mb-6">
                    {t('about.ctaText')}
                </p>
                <button
                    onClick={onGoToCalculator}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#f4a261]/10 text-[#f4a261] border border-[#f4a261]/30 hover:bg-[#f4a261]/20 transition-all font-medium"
                >
                    {t('about.ctaButton')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
