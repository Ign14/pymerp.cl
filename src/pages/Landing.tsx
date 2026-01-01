import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useAnalytics } from '../hooks/useAnalytics';
import pymLogo from '../assets/logopymerp.png';
import SEO, { createOrganizationSchema } from '../components/SEO';

export default function Landing() {
  const { t } = useTranslation('landing');
  const { trackClick } = useAnalytics();
  const [showOverlay, setShowOverlay] = useState(true);
  
  // Track CTA clicks
  const handleLoginClick = () => trackClick('landing_cta_secondary')();
  const handleRequestClick = () => trackClick('landing_cta_primary')();
  const handleNearbyClick = () => trackClick('landing_cta_nearby')();
  const handleOverlayClose = () => {
    setShowOverlay(false);
    trackClick('landing_overlay_close')();
  };

  const organizationSchema = createOrganizationSchema({
    name: t('brandName'),
    url: typeof window !== 'undefined' ? window.location.origin : 'https://pymerp.cl',
    logo: typeof window !== 'undefined' ? `${window.location.origin}/logopymerp.png` : 'https://pymerp.cl/logopymerp.png',
    description: t('tagline'),
  });

  return (
    <>
      <SEO
        title={t('seoTitle')}
        description={t('tagline')}
        keywords={t('seoKeywords')}
        ogImage="/logopymerp.png"
        ogImageAlt={t('ogImageAlt')}
        schema={organizationSchema}
        robots="index, follow"
      />
    <div className="min-h-screen bg-gray-50 flex items-center relative">
      {showOverlay && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="beta-announcement-title"
        >
          <div className="relative max-w-2xl w-full bg-white/10 border border-white/30 rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-white">
            <button
              type="button"
              onClick={handleOverlayClose}
              className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/60 rounded-full px-3 py-1 text-sm font-semibold shadow transition-colors"
              aria-label={t('betaOverlay.closeButton')}
            >
              ×
            </button>
            <div className="space-y-3 animate-pulse">
              <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-blue-200">
                {t('betaOverlay.title')}
              </div>
              <h2 
                id="beta-announcement-title"
                className="text-2xl sm:text-3xl font-extrabold leading-tight drop-shadow"
              >
                {t('betaOverlay.message')}
              </h2>
              <p className="text-lg sm:text-xl font-semibold text-blue-100">
                {t('betaOverlay.offer')}
              </p>
              <p className="text-sm sm:text-base text-blue-100">
                {t('betaOverlay.launch')}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <nav className="flex flex-col items-center gap-3 mb-6" aria-label={t('navigation.topBar')}>
          <div className="flex justify-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <Link 
            to="/login" 
            className="text-sm text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label={t('navigation.alreadyAccountLink')}
          >
            {t('navigation.alreadyAccount')}
          </Link>
        </nav>
        <main className="bg-white shadow rounded-lg p-8 sm:p-10 text-center space-y-6">
          <header className="flex flex-col items-center gap-4">
            <img
              src={pymLogo}
              alt={t('hero.logoAlt')}
              loading="lazy"
              decoding="async"
              width={224}
              height={140}
              className="w-40 sm:w-48 md:w-56 drop-shadow"
            />
            <h1 className="sr-only">{t('hero.title')}</h1>
          </header>
          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          
          <section className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center sm:items-center" aria-label={t('ctas.ariaLabel')}>
            <Link
              to="/login"
              onClick={handleLoginClick}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t('ctas.loginAriaLabel')}
            >
              {t('ctas.loginButton')}
            </Link>
            <Link
              to="/request-access"
              onClick={handleRequestClick}
              className="w-full sm:w-auto px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t('ctas.requestAriaLabel')}
            >
              {t('ctas.requestButton')}
            </Link>
            <Link
              to="/pymes-cercanas"
              onClick={handleNearbyClick}
              className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-blue-700 border-2 border-blue-200 rounded-lg font-semibold hover:bg-gray-200 transition text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t('ctas.nearbyAriaLabel')}
            >
              {t('ctas.nearbyButton')}
            </Link>
          </section>
        </main>
        <footer className="mt-6 text-center text-sm text-gray-600 space-y-2" aria-label={t('footer.ariaLabel')}>
          <Link 
            to="/transparencia" 
            className="text-blue-600 hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            {t('footer.transparency')}
          </Link>
          <div className="flex justify-center items-center gap-2">
            <img
              src="/instagram.svg"
              alt=""
              loading="lazy"
              decoding="async"
              width={20}
              height={20}
              className="h-5 w-5"
              aria-hidden="true"
            />
            <a
              href="https://instagram.com/pymerp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              aria-label={t('footer.instagramAriaLabel')}
            >
              {t('footer.instagramHandle')}
            </a>
          </div>
          <div className="text-xs text-gray-500" aria-label={t('footer.versionAriaLabel')}>
            {t('footer.version')}
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}
