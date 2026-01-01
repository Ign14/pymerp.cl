import { motion } from 'framer-motion';
import SEO from '../../components/SEO';

const infoCards = [
  {
    title: 'Responsable y contacto',
    items: [
      'PyM-ERP, plataforma operada desde Chile para pymes y profesionales.',
      'Correo de contacto legal y privacidad: legal@pym-erp.com.',
      'Domicilio referencial para efectos legales: Santiago, Chile.'
    ]
  },
  {
    title: 'Marco normativo',
    items: [
      'Ley N°19.628 sobre Protección de la Vida Privada.',
      'Ley N°19.496 de Protección de los Derechos de los Consumidores.',
      'Normativa tributaria chilena y exigencias del SII para facturación.'
    ]
  },
  {
    title: 'Datos que tratamos',
    items: [
      'Identificación y contacto (nombre, RUT/ID, correo, teléfono, empresa).',
      'Datos de uso del servicio (logs técnicos, configuraciones, interacciones).',
      'Datos de facturación y medios de pago procesados por proveedores externos seguros.',
      'Información opcional de marketing (preferencias, respuesta a campañas).'
    ]
  },
  {
    title: 'Finalidades y bases legítimas',
    items: [
      'Prestación del servicio y soporte (ejecución de contrato).',
      'Seguridad, prevención de fraude y continuidad operacional (interés legítimo).',
      'Facturación y obligaciones legales en Chile (obligación legal).',
      'Analítica y mejora del producto (interés legítimo, datos agregados/anónimos cuando sea posible).',
      'Envío de comunicaciones comerciales con consentimiento revocable.'
    ]
  }
];

const rights = [
  'Acceso, rectificación y eliminación conforme a la Ley 19.628.',
  'Bloqueo o suspensión de tratamiento cuando proceda.',
  'Oposición al uso con fines de marketing directo.',
  'Portabilidad de datos cuando sea técnicamente viable.',
  'Derecho a revocar el consentimiento sin efectos retroactivos.'
];

export default function Privacidad() {
  return (
    <>
      <SEO
        title="Política de Privacidad | PyM-ERP"
        description="Cómo protegemos y usamos los datos de tu negocio cumpliendo la normativa chilena."
        canonical="/privacy"
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
              <p className="text-sm text-cyan-400 font-semibold uppercase tracking-wide mb-2">
                Actualizado: julio 2024 · Cobertura Chile
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Política de Privacidad
              </h1>
              <p className="mt-4 text-lg text-cyan-100 leading-relaxed">
                Diseñamos PyM-ERP con seguridad y transparencia desde el día uno. Este documento explica
                cómo tratamos tus datos personales en Chile, por qué lo hacemos y cómo puedes ejercer tus derechos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {infoCards.map((card) => (
                <div key={card.title} className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">{card.title}</h3>
                  <ul className="space-y-3 text-base md:text-lg text-cyan-100 leading-relaxed">
                    {card.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Tus derechos de privacidad</h2>
              <p className="text-base md:text-lg text-cyan-100 mb-5 leading-relaxed">
                Puedes ejercerlos escribiendo a legal@pym-erp.com. Respondemos dentro de los plazos legales y siempre
                validamos identidad para proteger tu información.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rights.map((right) => (
                  <div key={right} className="flex items-start space-x-3">
                    <span className="mt-1.5 h-3 w-3 rounded-full bg-cyan-400 flex-shrink-0" aria-hidden="true" />
                    <p className="text-base md:text-lg text-cyan-100 leading-relaxed">{right}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Transferencias y almacenamiento</h3>
                <p className="text-base md:text-lg text-cyan-100 leading-relaxed">
                  Alojamientos en Google Cloud/Firebase con servidores en regiones de alta disponibilidad. Aplicamos
                  cláusulas contractuales estándar y medidas adicionales para transferencias internacionales, siempre
                  buscando que tus datos permanezcan en jurisdicciones con niveles adecuados de protección.
                </p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Retención y eliminación</h3>
                <p className="text-base md:text-lg text-cyan-100 leading-relaxed">
                  Conservamos datos mientras tengas cuenta activa. Información de facturación se mantiene por 5 años
                  según exigencias tributarias chilenas. Al cerrar tu cuenta, anonimizamos o eliminamos datos que no
                  debamos conservar por obligación legal.
                </p>
              </div>
            </div>

            <div className="bg-gray-700 border border-gray-600 rounded-xl p-6">
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Cookies y analítica responsable</h3>
              <p className="text-base md:text-lg text-cyan-100 mb-3 leading-relaxed">
                Usamos cookies necesarias para el inicio de sesión y el funcionamiento de la plataforma, y cookies de
                analítica (por ejemplo Google Analytics 4) para mejorar el producto. Puedes gestionar tu consentimiento
                desde el banner de cookies o en la configuración de tu navegador. Más detalles en nuestra página de Cookies.
              </p>
              <a
                href="/cookies"
                className="inline-flex items-center text-base md:text-lg text-cyan-300 font-semibold hover:text-cyan-200"
              >
                Ver política de Cookies →
              </a>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">¿Necesitas un acuerdo o anexo de datos?</h3>
              <p className="text-gray-100 mb-4">
                Podemos firmar anexos de tratamiento de datos, acuerdos de confidencialidad y revisar requisitos
                específicos de tu industria en Chile. Escríbenos y lo resolvemos rápido.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  className="px-5 py-3 bg-white text-gray-900 rounded-lg font-semibold text-center"
                  href="mailto:legal@pym-erp.com"
                >
                  legal@pym-erp.com
                </a>
                <a
                  className="px-5 py-3 border border-white/40 text-white rounded-lg font-semibold text-center hover:bg-white hover:text-gray-900 transition"
                  href="/contacto"
                >
                  Contactar al equipo
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
