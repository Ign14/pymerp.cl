import LanguageToggle from '../../components/LanguageToggle';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import SEO from '../../components/SEO';

export default function Privacidad() {
  const { t } = useLanguage();
  const passwordItems = (t('transparencyPages.privacy.passwordItems', { returnObjects: true }) as unknown as string[]) || [];
  const securityItems = (t('transparencyPages.privacy.securityItems', { returnObjects: true }) as unknown as string[]) || [];

  return (
    <>
      <SEO
        title={`PYMERP | ${t('transparencyPages.privacy.seoTitle')}`}
        description={t('transparencyPages.privacy.seoDescription')}
        keywords="privacidad, seguridad, datos personales, cifrado, HTTPS, pymerp"
        robots="index, follow"
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
          <h1 className="text-3xl font-bold text-gray-900">{t('transparencyPages.privacy.title')}</h1>
          <p className="text-gray-700">
            {t('transparencyPages.privacy.intro')}
          </p>

          <div className="space-y-3 text-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('transparencyPages.privacy.dataTitle')}</h2>
              <p>{t('transparencyPages.privacy.dataBody')}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('transparencyPages.privacy.useTitle')}</h2>
              <p>{t('transparencyPages.privacy.useBody')}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('transparencyPages.privacy.passwordTitle')}</h2>
              <ul className="list-disc list-inside space-y-1">
                {passwordItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('transparencyPages.privacy.securityTitle')}</h2>
              <ul className="list-disc list-inside space-y-1">
                {securityItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('transparencyPages.privacy.rightsTitle')}</h2>
              <p>{t('transparencyPages.privacy.rightsBody')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
