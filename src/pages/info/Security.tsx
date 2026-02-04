import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function Security() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Seguridad | PyM-ERP"
        description="Seguridad y privacidad en PyM-ERP con infraestructura en Google Cloud."
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
              Seguridad
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8">
                La seguridad es parte central del servicio. Nuestra infraestructura opera sobre Google Cloud.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-8 md:my-10">
                <div className="bg-gray-50 rounded-xl p-5 md:p-6 shadow-lg border-2 border-gray-200">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Infraestructura</h2>
                  <p className="text-sm md:text-base text-gray-700">
                    Plataforma desplegada sobre Google Cloud para confiabilidad y escalabilidad.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 md:p-6 shadow-lg border-2 border-gray-200">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Acceso y control</h2>
                  <p className="text-sm md:text-base text-gray-700">
                    Gestionamos accesos y permisos para que solo usuarios autorizados interactúen con la plataforma.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 md:p-6 shadow-lg border-2 border-gray-200">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Privacidad</h2>
                  <p className="text-sm md:text-base text-gray-700">
                    Tratamos tus datos con responsabilidad y transparencia, conforme a nuestras políticas.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 md:p-6 shadow-lg border-2 border-gray-200">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">Continuidad</h2>
                  <p className="text-sm md:text-base text-gray-700">
                    Monitoreo y mejoras continuas para mantener estabilidad y disponibilidad del servicio.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mt-8 md:mt-10 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">¿Necesitas más información?</h2>
                <p className="text-base md:text-lg text-gray-700 mb-5 md:mb-6">
                  Si requieres detalles para tu equipo de TI o auditoría, contáctanos.
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
