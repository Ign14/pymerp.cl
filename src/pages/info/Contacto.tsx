import LanguageToggle from '../../components/LanguageToggle';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import SEO from '../../components/SEO';

export default function Contacto() {
  const { t } = useLanguage();
  const email = 'ignacio@datakomerz.com';

  return (
    <>
      <SEO
        title={`PYMERP | ${t('transparencyPages.contact.seoTitle')}`}
        description={t('transparencyPages.contact.seoDescription')}
        keywords="contacto, soporte, pymerp"
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
          <h1 className="text-3xl font-bold text-gray-900">{t('transparencyPages.contact.title')}</h1>
          <p className="text-gray-700">
            {t('transparencyPages.contact.intro')}{' '}
            <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
              {email}
            </a>
            .
          </p>

          <div className="border-t pt-4 space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">{t('transparencyPages.contact.feedbackTitle')}</h2>
            <p className="text-gray-700 text-sm">
              {t('transparencyPages.contact.feedbackSubtitle')}
            </p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const comment = formData.get('comment');

                const mailto = `mailto:${email}?subject=Feedback%20PYMERP&body=${encodeURIComponent(
                  String(comment || '')
                )}`;
                window.location.href = mailto;
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('transparencyPages.contact.commentLabel')}
                </label>
                <textarea
                  name="comment"
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('transparencyPages.contact.commentPlaceholder')}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t('transparencyPages.contact.submit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
