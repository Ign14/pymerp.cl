import { useState } from 'react';
import LanguageToggle from '../../components/LanguageToggle';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import SEO from '../../components/SEO';

export default function Costos() {
  const [showOverlay, setShowOverlay] = useState(true);
  const { t } = useLanguage();
  const plans = Object.values(
    (t('transparencyPages.costs.plans', { returnObjects: true }) as unknown as Record<
      string,
      { title: string; price: string; desc: string }
    >) || {}
  );

  return (
    <>
      <SEO
        title={`PYMERP | ${t('transparencyPages.costs.seoTitle')}`}
        description={t('transparencyPages.costs.seoDescription')}
        keywords="pymerp, precios, planes, gratis, beta, suscripción, pyme"
        robots="index, follow"
      />
      <div className="relative min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        {showOverlay && (
          <div className="fixed inset-0 z-20 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="relative max-w-3xl w-full rounded-2xl p-6 sm:p-8 overflow-hidden text-white">
              <div
                className="absolute inset-[-20%] rounded-[36px] bg-[conic-gradient(var(--tw-gradient-stops))] from-pink-500 via-purple-500 via-blue-500 to-cyan-400 opacity-60 blur-2xl animate-[spin_14s_linear_infinite]"
                aria-hidden="true"
              ></div>
              <div
                className="absolute inset-[-15%] rounded-[36px] bg-[conic-gradient(var(--tw-gradient-stops))] from-cyan-400 via-blue-500 via-purple-500 to-pink-500 opacity-50 blur-2xl animate-[spin_18s_linear_infinite_reverse]"
                aria-hidden="true"
              ></div>
              <div className="relative bg-black/60 border border-white/30 rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.6)] p-6 sm:p-8 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowOverlay(false)}
                  className="absolute top-3 right-3 text-white bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 text-sm font-semibold shadow"
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <div className="space-y-3">
                  <div className="text-sm sm:text-base font-semibold text-blue-100 tracking-wide">
                    {t('transparencyPages.costs.betaBadge')}
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white drop-shadow">
                    {t('transparencyPages.costs.betaHeadline')}
                  </p>
                  <p className="text-base text-blue-100">
                    {t('transparencyPages.costs.betaLine1')}
                  </p>
                  <p className="text-base text-blue-100">
                    {t('transparencyPages.costs.betaLine2')}
                  </p>
                  <p className="text-base text-blue-100">
                    {t('transparencyPages.costs.betaLine3')}
                  </p>
                  <p className="text-sm text-blue-200">
                    {t('transparencyPages.costs.betaNote')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="fixed top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow hover:text-blue-700"
            >
              ← {t('transparencyPages.navigation.backHome')}
            </a>
            <a
              href="/transparencia"
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow hover:text-blue-700"
            >
              {t('transparencyPages.navigation.back')}
            </a>
          </div>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-5xl mx-auto space-y-6 mt-12">
          <div className="bg-white shadow rounded-lg p-8 space-y-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900">{t('transparencyPages.costs.title')}</h1>
            <p className="text-gray-700">
              {t('transparencyPages.costs.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((card) => (
              <div key={card.title} className="bg-white shadow rounded-lg p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-900">{card.title}</h2>
                <p className="text-2xl font-bold text-blue-600">{card.price}</p>
                <p className="text-sm text-gray-600 flex-1">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row items-center gap-4">
            <img src="/logoapp.png" alt="PYMERP APP" className="h-20 w-20 object-contain" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{t('transparencyPages.costs.appTitle')}</h2>
              <p className="text-gray-700 text-sm sm:text-base">
                {t('transparencyPages.costs.appBody')}
              </p>
            </div>
            <span className="inline-flex px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold shadow">
              {t('transparencyPages.costs.appTag')}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
