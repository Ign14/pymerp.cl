import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

const cookieTypes = [
  {
    title: 'Esenciales',
    description:
      'Necesarias para iniciar sesión, mantener la sesión activa y recordar configuraciones básicas del panel.'
  },
  {
    title: 'Preferencias',
    description:
      'Guardan idioma, vistas favoritas o ajustes de accesibilidad. Puedes desactivarlas, pero tu experiencia puede ser menos personalizada.'
  },
  {
    title: 'Analítica',
    description:
      'Usamos Google Analytics 4 para entender uso agregado y mejorar el producto. Se recogen métricas anonimizadas cuando es posible.'
  },
  {
    title: 'Marketing',
    description:
      'Solo con tu consentimiento. Nos ayudan a medir campañas y evitar mensajes irrelevantes.'
  }
];

export default function Cookies() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Política de Cookies | PyM-ERP"
        description="Cómo usamos cookies y tecnologías similares en PyM-ERP conforme a la normativa chilena."
        canonical="/cookies"
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
                Transparencia de datos · Cumplimiento Chile
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white">Política de Cookies</h1>
              <p className="mt-4 text-lg text-cyan-100 leading-relaxed">
                Usamos cookies para que PyM-ERP funcione seguro y para mejorar la experiencia. Aquí te explicamos
                qué guardamos, por qué y cómo puedes controlar tus preferencias.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cookieTypes.map((cookie) => (
                <div key={cookie.title} className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">{cookie.title}</h3>
                  <p className="text-base md:text-lg text-cyan-100 leading-relaxed">{cookie.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Gestión de consentimiento</h2>
              <ul className="space-y-3 text-base md:text-lg text-cyan-100 leading-relaxed">
                <li>• Puedes aceptar, rechazar o ajustar categorías desde el banner de cookies de PyM-ERP.</li>
                <li>• También puedes borrar o bloquear cookies desde la configuración de tu navegador.</li>
                <li>
                  • Si bloqueas cookies esenciales, algunas funciones (ej. autenticación, carrito o agenda) pueden dejar
                  de funcionar.
                </li>
                <li>
                  • Google Analytics 4 almacena identificadores técnicos; usamos IP anonimizada y retención limitada para
                  cumplir con el estándar de minimización de datos.
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Base legal en Chile</h3>
                <p className="text-base md:text-lg text-cyan-100 leading-relaxed">
                  El uso de cookies se ampara en tu consentimiento informado y en nuestro interés legítimo para proveer
                  seguridad y continuidad operacional. Cumplimos con la Ley 19.628 y las directrices de SERNAC sobre
                  transparencia al consumidor.
                </p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Tiempos de retención</h3>
                <p className="text-base md:text-lg text-cyan-100 leading-relaxed">
                  Cookies de sesión expiran al cerrar el navegador. Cookies de preferencia y analítica se conservan entre
                  6 y 13 meses salvo que las elimines antes. Revisamos periódicamente que no existan cookies heredadas o
                  no declaradas.
                </p>
              </div>
            </div>

            <div className="bg-gray-700 border border-gray-600 rounded-xl p-6">
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">Ejercer tus derechos</h3>
              <p className="text-base md:text-lg text-cyan-100 mb-4 leading-relaxed">
                Puedes solicitar acceso o eliminación de datos asociados a cookies contactando a ignacio@datakomerz.com. Si
                usas identificadores publicitarios, gestionaremos la petición con los terceros correspondientes.
              </p>
              <a
                href="mailto:ignacio@datakomerz.com"
                className="inline-flex items-center text-base md:text-lg text-cyan-300 font-semibold hover:text-cyan-200"
              >
                Escribir a ignacio@datakomerz.com →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
