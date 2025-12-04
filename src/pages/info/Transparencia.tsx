import LanguageToggle from '../../components/LanguageToggle';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import SEO from '../../components/SEO';

export default function Transparencia() {
  const { t } = useLanguage();
  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  return (
    <>
      <SEO
        title={`PYMERP | ${translate('transparencyPage.seoTitle', 'Transparencia')}`}
        description={translate('transparencyPage.seoDescription', 'Consulta la documentación clave de PYMERP.')}
        keywords="pymerp, transparencia, documentación, términos, privacidad, planes"
        robots="index, follow"
      />
      <div className="relative min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow hover:text-blue-700"
          >
            ← {translate('transparencyPage.backHome', 'Ir al inicio')}
          </a>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8 space-y-4 mt-12">
          <h1 className="text-3xl font-bold text-gray-900">
            {translate('transparencyPage.title', 'Términos de Transparencia')}
          </h1>
          <p className="text-gray-700">
            {translate('transparencyPage.subtitle', 'Consulta la documentación clave de PYMERP:')}
          </p>
          <div className="space-y-2 text-blue-600">
            <a href="/que-es-pymerp" className="block hover:underline">
              {translate('transparencyPage.items.whatIs', '1. ¿Qué es PYMERP?')}
            </a>
            <a href="/costos" className="block hover:underline">
              {translate('transparencyPage.items.plans', '2. Planes y precios')}
            </a>
            <a href="/privacidad" className="block hover:underline">
              {translate('transparencyPage.items.privacy', '3. Política de privacidad')}
            </a>
            <a href="/terminos" className="block hover:underline">
              {translate('transparencyPage.items.terms', '4. Términos y condiciones')}
            </a>
            <a href="/contacto" className="block hover:underline">
              {translate('transparencyPage.items.contact', '5. Contacto')}
            </a>
            <a href="/condiciones-beta" className="block hover:underline">
              {translate('transparencyPage.items.beta', '6. Condiciones de uso beta')}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
