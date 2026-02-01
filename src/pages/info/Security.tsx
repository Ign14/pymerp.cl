import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function Security() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Seguridad | PyM-ERP"
        description="Conoce cómo PyM-ERP protege tus datos y los de tus clientes con tecnología de nivel empresarial."
        canonical="/security"
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate('/')}
            className="mb-6 md:mb-8 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Volver al inicio
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
              🔐 Seguridad y Privacidad
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 text-center">
                La seguridad de tus datos y los de tus clientes es nuestra máxima prioridad. 
                Utilizamos tecnología de nivel empresarial para proteger tu información. ✅
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-8 md:my-10">
                <div className="bg-gray-50 rounded-xl p-5 md:p-6 shadow-lg border-2 border-gray-300 flex flex-col items-center text-center">
                  <div className="text-4xl md:text-5xl mb-3 md:mb-4">🔒</div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Cifrado End-to-End</h3>
                  <p className="text-sm md:text-base text-gray-800 font-medium">Todos los datos se transmiten cifrados usando protocolos SSL/TLS</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 md:p-6 shadow-lg border-2 border-gray-300 flex flex-col items-center text-center">
                  <div className="text-4xl md:text-5xl mb-3 md:mb-4">🔐</div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Autenticación Segura</h3>
                  <p className="text-sm md:text-base text-gray-800 font-medium">Sistema de autenticación Firebase con verificación de email</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 md:p-6 shadow-lg border-2 border-gray-300 flex flex-col items-center text-center">
                  <div className="text-4xl md:text-5xl mb-3 md:mb-4">💾</div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Backups Automáticos</h3>
                  <p className="text-sm md:text-base text-gray-800 font-medium">Respaldos diarios automáticos de toda tu información</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 md:p-6 shadow-lg border-2 border-gray-300 flex flex-col items-center text-center">
                  <div className="text-4xl md:text-5xl mb-3 md:mb-4">🛡️</div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Protección DDoS</h3>
                  <p className="text-sm md:text-base text-gray-800 font-medium">Infraestructura Google Cloud con protección avanzada</p>
                </div>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 md:mt-10 mb-3 md:mb-4">⚙️ Tecnología Firebase</h2>
              <p className="text-base md:text-lg text-gray-700 mb-4 md:mb-6">
                PyM-ERP está construido sobre Firebase, la plataforma de Google Cloud utilizada 
                por millones de aplicaciones en todo el mundo. Esto nos permite ofrecerte:
              </p>
              <ul className="space-y-2 text-gray-700 mb-6 md:mb-8 list-none p-0 text-center">
                <li>🌎 Infraestructura de clase mundial con 99.9% de disponibilidad</li>
                <li>⚡ Servidores distribuidos globalmente para máxima velocidad</li>
                <li>🧾 Cumplimiento con estándares internacionales de seguridad</li>
                <li>📈 Escalabilidad automática según tu crecimiento</li>
              </ul>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 md:mt-10 mb-3 md:mb-4">🔏 Privacidad de Datos</h2>
              <p className="text-base md:text-lg text-gray-700 mb-4 md:mb-6">
                Cumplimos con las regulaciones de privacidad más estrictas:
              </p>
              <ul className="space-y-2 text-gray-700 mb-6 md:mb-8 list-none p-0 text-center">
                <li>🧩 Tus datos son tuyos y solo tuyos</li>
                <li>🚫 Nunca compartimos información con terceros</li>
                <li>📤 Puedes exportar tu información en cualquier momento</li>
                <li>🗑️ Derecho al olvido: elimina tu cuenta cuando quieras</li>
                <li>🔎 Transparencia total sobre uso de datos</li>
              </ul>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 md:mt-10 mb-3 md:mb-4">🧰 Control de Acceso</h2>
              <p className="text-base md:text-lg text-gray-700 mb-4 md:mb-6">
                En planes avanzados, tendrás control total sobre quién puede acceder a qué:
              </p>
              <ul className="space-y-2 text-gray-700 mb-6 md:mb-8 list-none p-0 text-center">
                <li>🧑‍💼 Sistema de roles y permisos granular</li>
                <li>🔑 Autenticación de dos factores (2FA)</li>
                <li>🧾 Registro de actividad y auditoría</li>
                <li>⏱️ Sesiones seguras con expiración automática</li>
              </ul>

              <div className="bg-green-50 rounded-2xl p-6 md:p-8 mt-8 md:mt-10 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">🤝 ¿Preguntas sobre Seguridad?</h2>
                <p className="text-base md:text-lg text-gray-700 mb-5 md:mb-6">
                  Si tienes dudas específicas sobre nuestra seguridad o necesitas información 
                  para tu departamento de TI, contáctanos.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/contacto')}
                  className="px-6 md:px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  Contactar Soporte
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
