import LanguageToggle from '../../components/LanguageToggle';
import ThemeToggle from '../../components/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import SEO from '../../components/SEO';

export default function Terminos() {
  const { t } = useLanguage();

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return typeof value === 'string' && value !== key ? value : fallback;
  };

  const fallbackContent = {
    title: '3. Contenido y propiedad',
    items: [
      'Sigues siendo dueño del contenido que subas (textos, imágenes, precios), pero nos concedes una licencia limitada para mostrarlo dentro del servicio.',
      'Está prohibido copiar, clonar o reutilizar la plataforma, su código, diseño, layouts o catálogos sin autorización expresa de PYMERP.',
      'Queda prohibida la extracción masiva de datos, scraping o ingeniería inversa de la plataforma.',
    ],
  };

  const fallbackResponsibility = {
    title: '5. Responsabilidades',
    items: [
      'El usuario es responsable de la veracidad de la información publicada (precios, descripciones, horarios).',
      'PYMERP no se hace responsable por pérdidas indirectas o lucro cesante derivado del uso o imposibilidad de uso del servicio.',
    ],
  };

  const fallbackIP = {
    title: '7. Propiedad intelectual y anti copia',
    items: [
      'PYMERP y sus logos, layouts, plantillas y software están protegidos por derechos de autor y propiedad intelectual.',
      'Está prohibida la reproducción, redistribución o adaptación del software sin autorización escrita.',
      'Detectar o intentar vulnerar medidas de seguridad, duplicar el servicio o reutilizar componentes de forma no autorizada constituye una violación contractual y podrá derivar en acciones legales.',
    ],
  };

  const rawContent = t('transparencyPages.terms.sections.content', { returnObjects: true }) as unknown;
  const contentSection =
    rawContent && typeof rawContent === 'object' && Array.isArray((rawContent as any).items)
      ? (rawContent as { title: string; items: string[] })
      : fallbackContent;

  const rawResponsibility = t('transparencyPages.terms.sections.responsibility', { returnObjects: true }) as unknown;
  const responsibilitySection =
    rawResponsibility && typeof rawResponsibility === 'object' && Array.isArray((rawResponsibility as any).items)
      ? (rawResponsibility as { title: string; items: string[] })
      : fallbackResponsibility;

  const rawIP = t('transparencyPages.terms.sections.ip', { returnObjects: true }) as unknown;
  const ipSection =
    rawIP && typeof rawIP === 'object' && Array.isArray((rawIP as any).items)
      ? (rawIP as { title: string; items: string[] })
      : fallbackIP;

  return (
    <>
      <SEO
        title={`PYMERP | ${translate('transparencyPages.terms.seoTitle', 'Términos y Condiciones - PYMERP')}`}
        description={translate(
          'transparencyPages.terms.seoDescription',
          'Reglas de uso de PYMERP: cuentas, contenido, propiedad intelectual, responsabilidades y pagos.'
        )}
        keywords="términos, condiciones, uso, legal, pymerp, contrato"
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
            {translate('transparencyPages.terms.title', 'Términos y Condiciones')}
          </h1>
          <p className="text-gray-700">
            {translate(
              'transparencyPages.terms.intro',
              'Estos Términos regulan el uso de la plataforma PYMERP (agenda/catálogo web) por parte de emprendedores y usuarios finales.'
            )}
          </p>

          <div className="space-y-3 text-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {translate('transparencyPages.terms.sections.acceptance.title', '1. Aceptación y uso')}
              </h2>
              <p>
                {translate(
                  'transparencyPages.terms.sections.acceptance.body',
                  'Al registrarte aceptas estos Términos y te comprometes a usar la plataforma conforme a la ley y a las buenas prácticas comerciales.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {translate('transparencyPages.terms.sections.accounts.title', '2. Cuentas y credenciales')}
              </h2>
              <p>
                {translate(
                  'transparencyPages.terms.sections.accounts.body',
                  'Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada con tu cuenta. Debes notificarnos cualquier uso no autorizado.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{contentSection.title}</h2>
              <ul className="list-disc list-inside space-y-1">
                {contentSection.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {translate('transparencyPages.terms.sections.availability.title', '4. Disponibilidad y servicio')}
              </h2>
              <p>
                {translate(
                  'transparencyPages.terms.sections.availability.body',
                  'Trabajamos para mantener la plataforma disponible, pero pueden existir interrupciones programadas o incidentes. No garantizamos disponibilidad ininterrumpida.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{responsibilitySection.title}</h2>
              <ul className="list-disc list-inside space-y-1">
                {responsibilitySection.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {translate('transparencyPages.terms.sections.payments.title', '6. Pagos y planes')}
              </h2>
              <p>
                {translate(
                  'transparencyPages.terms.sections.payments.body',
                  'Los planes y límites de uso (productos, servicios, horarios) se detallan en la sección de costos. Los cambios de plan pueden modificar dichos límites.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{ipSection.title}</h2>
              <ul className="list-disc list-inside space-y-1">
                {ipSection.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {translate('transparencyPages.terms.sections.termination.title', '8. Terminación')}
              </h2>
              <p>
                {translate(
                  'transparencyPages.terms.sections.termination.body',
                  'Podemos suspender o terminar el acceso ante incumplimiento de estos Términos. Puedes cancelar en cualquier momento; es posible que conservemos datos conforme a obligaciones legales.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {translate('transparencyPages.terms.sections.changes.title', '9. Cambios a los Términos')}
              </h2>
              <p>
                {translate(
                  'transparencyPages.terms.sections.changes.body',
                  'Podemos actualizar estos Términos; notificaremos cambios relevantes. El uso continuado implica aceptación de las modificaciones.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
