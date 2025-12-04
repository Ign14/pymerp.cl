import LanguageToggle from '../../components/LanguageToggle';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import SEO from '../../components/SEO';

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <SEO
        title={`PYMERP | ${t('transparencyPages.about.seoTitle')}`}
        description={t('transparencyPages.about.seoDescription')}
        keywords="pymerp, pyme, gestión, emprendimiento, chile, negocio"
        ogType="website"
      />
      <div className="relative min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8 space-y-4 mt-12">
          <h1 className="text-3xl font-bold text-gray-900">{t('transparencyPages.about.title')}</h1>
          <p className="text-gray-700 leading-relaxed">
            {t('transparencyPages.about.body')}
          </p>
        </div>
      </div>
    </>
  );
}
