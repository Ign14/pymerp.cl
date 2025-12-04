import LanguageToggle from '../../components/LanguageToggle';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import SEO from '../../components/SEO';

export default function CondicionesBeta() {
  const { t } = useLanguage();
  const email = 'ignacio@datakomerz.com';
  const translate = (key: string, fallback: string) => {
    const value = t(key, { email });
    return typeof value === 'string' && value !== key ? value : fallback;
  };

  const fallbackItems = [
    'La plataforma puede cambiar, actualizarse o presentar incidencias propias de una etapa beta.',
    'No se realizan cobros ni emisión de boletas durante la beta.',
    'Hasta el 28 de febrero de 2026 todas las cuentas tienen Plan Estándar gratis, incluyendo mejoras que se liberen.',
    'Desde marzo 2026 se habilitará el sistema de pago por suscripción; se avisará previamente y podrás decidir si continúas o no.',
    'La información publicada (textos, imágenes, precios, horarios) es responsabilidad de cada usuario.',
    'PYMERP puede suspender o terminar acceso en caso de abuso, uso indebido o intento de copia/ingeniería inversa.',
  ];

  const rawItems = t('transparencyPages.beta.items', { returnObjects: true }) as unknown;
  const items = Array.isArray(rawItems) ? (rawItems as string[]) : fallbackItems;

  return (
    <>
      <SEO
        title={`PYMERP | ${translate('transparencyPages.beta.seoTitle', 'Condiciones de uso beta - PYMERP')}`}
        description={translate('transparencyPages.beta.seoDescription', 'Lee las condiciones de uso de la versión beta de PYMERP.')}
        keywords="beta, condiciones, pymerp"
        robots="index, follow"
      />
      <div className="relative min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="fixed top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow hover:text-blue-700"
            >
              ← {translate('transparencyPages.navigation.backHome', 'Ir al inicio')}
            </a>
            <a
              href="/transparencia"
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow hover:text-blue-700"
            >
              {translate('transparencyPages.navigation.back', 'Volver')}
            </a>
          </div>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8 space-y-4 mt-12">
          <h1 className="text-3xl font-bold text-gray-900">
            {translate('transparencyPages.beta.title', 'Condiciones de uso beta')}
          </h1>
          <p className="text-gray-700">
            {translate(
              'transparencyPages.beta.intro',
              'Esta versión beta de pymerp.cl está en etapa de prueba con clientes reales. Al usarla aceptas los siguientes puntos:'
            )}
          </p>
          <div className="space-y-3 text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              {translate(
                'transparencyPages.beta.support',
                'Si tienes dudas o necesitas soporte, contáctanos en {{email}}.'
              ).replace('{{email}}', email)}{' '}
              <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                {email}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
