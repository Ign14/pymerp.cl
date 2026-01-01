import { motion } from 'framer-motion';
import SEO from '../../components/SEO';

const commitments = [
  'Cumplir la Ley 19.628 (Protección de la Vida Privada) y la Ley 19.496 (Derechos del Consumidor).',
  'Alinear contratos y anexos a las exigencias sectoriales de cada cliente (salud, educación, retail, etc.).',
  'Notificar incidentes relevantes y colaborar con la autoridad competente cuando corresponda.',
  'Firmar acuerdos de confidencialidad y anexos de tratamiento de datos cuando lo requieras.'
];

export default function Legal() {
  return (
    <>
      <SEO
        title="Aviso Legal | PyM-ERP"
        description="Información legal, obligaciones y compromisos de cumplimiento de PyM-ERP en Chile."
        canonical="/legal"
      />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wide mb-2">
                Transparencia legal · Chile
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Aviso Legal</h1>
              <p className="mt-4 text-lg text-gray-700 leading-relaxed">
                PyM-ERP es una plataforma SaaS diseñada y operada desde Chile. Estas son las reglas básicas que
                rigen nuestra relación con clientes, proveedores y usuarios finales.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Identificación del proveedor</h2>
              <p className="text-gray-700">
                PyM-ERP opera como software para pymes y profesionales. Domicilio referencial: Santiago, Chile. Correo
                oficial para notificaciones y temas legales: legal@pym-erp.com.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Compromisos de cumplimiento</h3>
                <ul className="space-y-2 text-gray-700">
                  {commitments.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Responsabilidad y cobertura</h3>
                <p className="text-gray-700">
                  Limitamos responsabilidad al marco permitido por la ley chilena y los contratos vigentes. Contamos con
                  proveedores con certificaciones de seguridad (Google Cloud/Firebase) y aplicamos controles técnicos y
                  organizativos alineados a buenas prácticas (cifrado en tránsito y reposo, backups, segregación de
                  ambientes).
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cómo resolver incidentes o disputas</h3>
              <p className="text-gray-700">
                Para reclamos de consumo puedes recurrir a SERNAC o tribunales competentes. Preferimos siempre una
                solución directa: escríbenos a legal@pym-erp.com con los antecedentes y responderemos en el menor plazo
                posible.
              </p>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Documentación complementaria</h3>
              <p className="text-gray-100 mb-4">
                Revisa también nuestros Términos, Política de Privacidad, Cookies y Licencias para entender todo el marco
                legal del servicio.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a className="px-5 py-3 bg-white text-gray-900 rounded-lg font-semibold text-center" href="/terms">
                  Ver Términos
                </a>
                <a
                  className="px-5 py-3 border border-white/40 text-white rounded-lg font-semibold text-center hover:bg-white hover:text-gray-900 transition"
                  href="/privacy"
                >
                  Política de Privacidad
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
