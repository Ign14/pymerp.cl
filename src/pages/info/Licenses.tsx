import { motion } from 'framer-motion';
import SEO from '../../components/SEO';

const thirdParty = [
  { name: 'React', license: 'MIT', link: 'https://github.com/facebook/react/blob/main/LICENSE' },
  { name: 'Vite', license: 'MIT', link: 'https://github.com/vitejs/vite/blob/main/LICENSE' },
  { name: 'Tailwind CSS', license: 'MIT', link: 'https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE' },
  { name: 'Firebase', license: 'Términos de Google/Firebase', link: 'https://firebase.google.com/terms' },
  { name: 'Framer Motion', license: 'MIT', link: 'https://github.com/framer/motion/blob/main/LICENSE' }
];

export default function Licenses() {
  return (
    <>
      <SEO
        title="Licencias y terceros | PyM-ERP"
        description="Detalle de licencias de software y activos utilizados en PyM-ERP."
        canonical="/licenses"
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
                Transparencia · Software y activos
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white">Licencias y componentes</h1>
              <p className="mt-4 text-lg text-cyan-100 leading-relaxed">
                PyM-ERP es propiedad de sus autores. Esta página resume las licencias relevantes y los principales
                componentes de terceros que usamos para entregar el servicio.
              </p>
            </div>

            <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Derechos de PyM-ERP</h2>
              <ul className="space-y-3 text-base md:text-lg text-cyan-100 leading-relaxed">
                <li>• Marca, logotipos, copy y material comercial: todos los derechos reservados.</li>
                <li>• Código fuente propio: licencia propietaria, uso limitado al contrato con clientes.</li>
                <li>• Queda prohibida la reproducción, copia o redistribución salvo autorización escrita.</li>
              </ul>
            </div>

            <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Componentes de terceros</h2>
              <p className="text-base md:text-lg text-cyan-100 mb-5 leading-relaxed">
                Utilizamos software open source y servicios cloud. Cada uno mantiene su propia licencia; al usar PyM-ERP
                aceptas también los términos aplicables de estos terceros.
              </p>
              <div className="divide-y divide-gray-600">
                {thirdParty.map((item) => (
                  <div key={item.name} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-base md:text-lg text-white font-semibold">{item.name}</p>
                      <p className="text-base md:text-lg text-cyan-100 mt-1">Licencia: {item.license}</p>
                    </div>
                    <a
                      className="text-base md:text-lg text-cyan-300 font-semibold hover:text-cyan-200"
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver licencia
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Activos creativos</h3>
                <p className="text-base md:text-lg text-cyan-100 leading-relaxed">
                  Ilustraciones, videos y fotografías utilizadas en campañas o en la app tienen licencias específicas
                  (propias o de bancos de imágenes). Si necesitas confirmación de derechos para una campaña conjunta,
                  escríbenos y entregaremos respaldos.
                </p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Solicitudes legales</h3>
                <p className="text-base md:text-lg text-cyan-100 leading-relaxed">
                  Para reportar uso indebido de material protegido o solicitar una licencia adicional, contáctanos en
                  legal@pym-erp.com. Respondemos siguiendo la ley chilena y las directrices de propiedad intelectual
                  aplicables.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
