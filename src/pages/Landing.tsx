import { Link } from 'react-router-dom';
import { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import pymLogo from '../assets/logopymerp.png';
import SEO, { createOrganizationSchema } from '../components/SEO';

export default function Landing() {
  const { t } = useLanguage();
  const tagline = t('common.tagline');
  const [showOverlay, setShowOverlay] = useState(true);

  const organizationSchema = createOrganizationSchema({
    name: 'PYM-ERP',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://pymerp.cl',
    logo: typeof window !== 'undefined' ? `${window.location.origin}/logopymerp.png` : 'https://pymerp.cl/logopymerp.png',
    description: tagline,
  });

  return (
    <>
      <SEO
        title={t('landing.title')}
        description={tagline}
        keywords="pyme, erp, gestión empresarial, agenda online, servicios, productos, reservas, chile"
        ogImage="/logopymerp.png"
        ogImageAlt="PYM-ERP Logo"
        schema={organizationSchema}
        robots="index, follow"
      />
    <div className="min-h-screen bg-gray-50 flex items-center relative">
      {showOverlay && (
        <div className="fixed inset-0 z-20 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative max-w-2xl w-full bg-white/10 border border-white/30 rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-white">
            <button
              type="button"
              onClick={() => setShowOverlay(false)}
              className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/60 rounded-full px-3 py-1 text-sm font-semibold shadow"
              aria-label={t('landing.closeButton')}
            >
              ×
            </button>
            <div className="space-y-3 animate-pulse">
              <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-blue-200">
                {t('landing.betaTitle')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight drop-shadow">
                {t('landing.betaMessage')}
              </h2>
              <p className="text-lg sm:text-xl font-semibold text-blue-100">
                {t('landing.betaOffer')}
              </p>
              <p className="text-sm sm:text-base text-blue-100">
                {t('landing.betaLaunch')}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex justify-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <div className="flex justify-center">
            <Link to="/login" className="text-sm text-blue-700 hover:underline">
              {t('landing.alreadyAccount')}
            </Link>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-8 sm:p-10 text-center space-y-6">
          <div className="flex justify-center">
            <img
              src={pymLogo}
              alt="PYM-ERP"
              className="w-40 sm:w-48 md:w-56 drop-shadow"
            />
          </div>
          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
            {t('landing.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center sm:items-center">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center"
            >
              {t('landing.loginButton')}
            </Link>
            <Link
              to="/request-access"
              className="w-full sm:w-auto px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
            >
              {t('landing.requestButton')}
            </Link>
            <a
              href="/pymes-cercanas"
              className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-blue-700 border-2 border-blue-200 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
              title={t('landing.nearbyButton')}
            >
              {t('landing.nearbyButton')}
            </a>
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
          <a href="/transparencia" className="text-blue-600 hover:underline font-semibold">
            {t('footer.transparency')}
          </a>
          <div className="flex justify-center items-center gap-2">
            <img src="/instagram.svg" alt="Instagram" className="h-5 w-5" />
            <a
              href="https://instagram.com/pymerp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              @pymerp
            </a>
          </div>
          <div className="text-xs text-white">Beta v 0.0.1</div>
        </div>
      </div>
    </div>
    </>
  );
}
