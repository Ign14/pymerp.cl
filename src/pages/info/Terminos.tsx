import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

const sections = [
  {
    title: 'Aceptación y alcance',
    items: [
      'Al crear una cuenta o usar PyM-ERP aceptas estos Términos y nuestra Política de Privacidad.',
      'El servicio se presta en modalidad SaaS para Chile; algunos módulos pueden requerir acuerdos adicionales.',
      'Usuario debe ser mayor de 18 años y entregar información veraz para cumplir con normativas locales.'
    ]
  },
  {
    title: 'Planes, pagos y facturación',
    items: [
      'Precios expresados en CLP salvo indicación distinta. Emitimos documentos tributarios conforme al SII.',
      'Se puede ajustar el valor de planes; te avisaremos con 15 días corridos de anticipación.',
      'Derecho de retracto online conforme Ley 19.496: 10 días desde la contratación si no has usado el servicio.',
      'Renovaciones mensuales o anuales según plan; puedes cancelar en cualquier momento antes del siguiente ciclo.'
    ]
  },
  {
    title: 'Uso permitido',
    items: [
      'Prohibido cargar datos ilícitos, infringir derechos de terceros o vulnerar seguridad del servicio.',
      'No se permite revender, sublicenciar o realizar ingeniería inversa del software.',
      'Podemos suspender cuentas ante uso abusivo, impago, fraude o incumplimiento contractual.'
    ]
  },
  {
    title: 'Propiedad intelectual',
    items: [
      'PyM-ERP mantiene derechos sobre el software, marca y contenidos. Otorgamos una licencia limitada, no exclusiva y revocable para usar la plataforma.',
      'El usuario conserva titularidad de sus datos y contenidos. Solo los usamos para prestar el servicio y cumplir obligaciones legales.',
      'Las integraciones y bibliotecas de terceros mantienen sus respectivas licencias, detalladas en la sección de Licencias.'
    ]
  },
  {
    title: 'Limitación de responsabilidad',
    items: [
      'El servicio se entrega “tal cual” y con esfuerzos razonables de continuidad; puede sufrir interrupciones programadas o de fuerza mayor.',
      'Nuestra responsabilidad total frente al usuario se limita al monto efectivamente pagado en los últimos 3 meses previos al reclamo.',
      'Nada limita derechos irrenunciables del consumidor bajo la Ley 19.496 o normas imperativas chilenas.'
    ]
  },
  {
    title: 'Datos y confidencialidad',
    items: [
      'Custodiamos la información siguiendo políticas de seguridad y privacidad alineadas a la Ley 19.628.',
      'Si tratamos datos personales como encargado, podemos firmar un anexo de tratamiento y confidencialidad.',
      'Avisaremos incidentes de seguridad relevantes y colaboraremos con las autoridades cuando corresponda.'
    ]
  }
];

export default function Terminos() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Términos y Condiciones | PyM-ERP"
        description="Condiciones de uso del servicio SaaS PyM-ERP bajo la legislación chilena."
        canonical="/terms"
      />
      <div className="min-h-screen bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/10 transition"
                  aria-label="Volver"
                >
                  ← Volver
                </button>
              </div>
              <p className="text-sm text-cyan-400 font-semibold uppercase tracking-wide mb-2">
                Actualizado: julio 2024 · Vigente en Chile
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white">Términos y Condiciones</h1>
              <p className="mt-4 text-lg text-cyan-100 leading-relaxed">
                Este acuerdo regula tu relación con PyM-ERP. Queremos que tengas claridad total sobre qué puedes
                esperar del servicio, cuáles son tus obligaciones y cómo resolvemos disputas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections.map((section) => (
                <div key={section.title} className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">{section.title}</h3>
                  <ul className="space-y-3 text-base md:text-lg text-cyan-100 leading-relaxed">
                    {section.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Duración y término</h3>
                <p className="text-base md:text-lg text-cyan-100 leading-relaxed">
                  El contrato es de tracto sucesivo mientras mantengas una suscripción activa. Puedes terminarlo en
                  cualquier momento desde tu panel o escribiendo a soporte. Si hay obligaciones pendientes (pagos o
                  entrega de información tributaria), deberás cumplirlas incluso después del término.
                </p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Ley aplicable y solución de controversias</h3>
                <p className="text-base md:text-lg text-cyan-100 leading-relaxed">
                  Este contrato se rige por las leyes de la República de Chile. Cualquier disputa se somete a los
                  tribunales ordinarios de justicia de Santiago. Antes de llegar a ese punto, te invitamos a activar un
                  proceso de solución directa con nuestro equipo legal.
                </p>
              </div>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">¿Tienes dudas legales o necesitas un contrato a medida?</h3>
              <p className="text-gray-100 mb-4">
                Ajustamos anexos, cláusulas sectoriales y políticas de datos según tu industria en Chile. Nuestro objetivo
                es que cumplas tus obligaciones regulatorias sin fricción.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  className="px-5 py-3 bg-white text-gray-900 rounded-lg font-semibold text-center"
                  href="mailto:ignacio@datakomerz.com"
                >
                  ignacio@datakomerz.com
                </a>
                <a
                  className="px-5 py-3 border border-white/40 text-white rounded-lg font-semibold text-center hover:bg-white hover:text-gray-900 transition"
                  href="/contacto"
                >
                  Coordinar con el equipo
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
