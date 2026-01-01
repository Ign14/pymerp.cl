import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      icon: '🎯',
      title: 'Simplicidad',
      description: 'Creemos que la tecnología debe ser accesible para todos. Sin complicaciones, sin barreras técnicas.'
    },
    {
      icon: '🚀',
      title: 'Innovación',
      description: 'Estamos constantemente mejorando y agregando nuevas funcionalidades basadas en las necesidades reales de nuestros usuarios.'
    },
    {
      icon: '🤝',
      title: 'Compromiso',
      description: 'Tu éxito es nuestro éxito. Trabajamos día a día para que tu negocio crezca y prospere.'
    },
    {
      icon: '🔒',
      title: 'Seguridad',
      description: 'Protegemos tus datos con tecnología de nivel empresarial y cumplimos con todas las normativas chilenas.'
    }
  ];

  const milestones = [
    {
      year: '2024',
      title: 'Nacimiento de PyM-ERP',
      description: 'Identificamos la necesidad de digitalizar las PYMEs chilenas con una solución simple y accesible.'
    },
    {
      year: '2024 Q4',
      title: 'Lanzamiento Beta',
      description: 'Lanzamos nuestra plataforma básica con funcionalidades esenciales para emprendedores y pequeñas empresas.'
    },
    {
      year: '2026',
      title: 'Expansión y Crecimiento',
      description: 'Lanzamiento de planes avanzados y funcionalidades ERP completas para empresas en crecimiento.'
    }
  ];

  return (
    <>
      <SEO
        title="Acerca de Nosotros | PyM-ERP"
        description="Conoce la historia, misión y valores de PyM-ERP. Somos una plataforma diseñada para digitalizar y hacer crecer tu negocio."
        canonical="/about"
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate('/')}
            className="mb-8 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Volver al inicio
          </motion.button>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Acerca de PyM-ERP
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
              Somos una plataforma tecnológica diseñada específicamente para emprendedores y PYMEs chilenas. 
              Nuestra misión es democratizar el acceso a herramientas profesionales de gestión empresarial.
            </p>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed font-medium">
                "Creemos que cada negocio, sin importar su tamaño, merece tener acceso a tecnología de clase mundial 
                para competir y crecer en el mercado digital actual."
              </p>
            </div>
          </motion.div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white border-2 border-indigo-100 rounded-2xl p-8 shadow-lg"
            >
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Facilitar la transformación digital de emprendedores y PYMEs en Chile, proporcionando herramientas 
                intuitivas, accesibles y poderosas que les permitan gestionar su negocio de manera profesional sin 
                necesidad de conocimientos técnicos avanzados ni grandes inversiones.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white border-2 border-purple-100 rounded-2xl p-8 shadow-lg"
            >
              <div className="text-5xl mb-4">🌟</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Nuestra Visión</h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Ser la plataforma líder en Chile para la gestión empresarial de PYMEs, reconocida por su simplicidad, 
                innovación y compromiso con el éxito de nuestros usuarios. Aspiramos a ser el socio tecnológico de 
                confianza que impulsa el crecimiento de miles de negocios chilenos.
              </p>
            </motion.div>
          </div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
              Nuestros Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow text-center"
                >
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Our Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Nuestra Historia</h2>
            <div className="space-y-6 max-w-4xl mx-auto">
              <p className="text-lg md:text-xl leading-relaxed">
                PyM-ERP nació de la observación de una realidad: miles de emprendedores y pequeñas empresas en Chile 
                luchan por competir en un mercado cada vez más digitalizado, pero carecen de acceso a herramientas 
                profesionales de gestión debido a su complejidad y costo.
              </p>
              <p className="text-lg md:text-xl leading-relaxed">
                Decidimos crear una solución que combinara la potencia de un ERP empresarial con la simplicidad que 
                necesita un emprendedor. Utilizamos tecnología de punta (Firebase, React, Cloud Computing) para ofrecer 
                una plataforma robusta, segura y escalable, pero con una interfaz intuitiva que cualquiera puede usar.
              </p>
              <p className="text-lg md:text-xl leading-relaxed">
                Hoy, PyM-ERP está ayudando a cientos de negocios a digitalizarse, gestionar sus operaciones y crecer. 
                Nuestro compromiso es seguir innovando y mejorando para ser el mejor aliado tecnológico de tu negocio.
              </p>
            </div>
          </motion.div>

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
              Hitos Importantes
            </h2>
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-shrink-0">
                      <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-lg">
                        {milestone.year}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-base md:text-lg text-gray-700 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Technology */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
              Tecnología de Clase Mundial
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl mb-3">☁️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Google Cloud</h3>
                <p className="text-gray-700 text-sm">
                  Infraestructura escalable y segura con 99.9% de disponibilidad
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Seguridad Avanzada</h3>
                <p className="text-gray-700 text-sm">
                  Cifrado de datos y cumplimiento con normativas chilenas
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Rendimiento Óptimo</h3>
                <p className="text-gray-700 text-sm">
                  Tecnología moderna para máxima velocidad y experiencia fluida
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Únete a Nuestra Comunidad</h2>
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Comienza tu transformación digital hoy. El plan básico es completamente gratis y te da acceso 
              a todas las herramientas esenciales para gestionar tu negocio profesionalmente.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/request-access')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow"
            >
              Crear Cuenta Gratis →
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
