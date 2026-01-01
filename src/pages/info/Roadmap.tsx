import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function Roadmap() {
  const navigate = useNavigate();

  const phases = [
    {
      status: 'completed',
      title: 'Fase 1: Lanzamiento Beta',
      period: '2024 Q4',
      features: [
        'Plataforma web básica',
        'Sistema de registro y autenticación',
        'Catálogo de productos/servicios',
        'Integración con WhatsApp',
        'Búsqueda por comuna y categoría'
      ]
    },
    {
      status: 'current',
      title: 'Fase 2: Expansión de Funcionalidades',
      period: '2026 Q1-Q2',
      features: [
        'Lanzamiento de PyM-ERP APP móvil',
        'Planes Lite, Standard y Enterprise',
        'Sistema de estadísticas básicas',
        'Gestión de inventario',
        'Notificaciones automáticas',
        'Plantillas de diseño premium'
      ]
    },
    {
      status: 'planned',
      title: 'Fase 3: ERP Completo',
      period: '2026 Q3-Q4',
      features: [
        'ERP modular multiusuario',
        'Facturación electrónica integrada',
        'Reportes avanzados y analítica',
        'Sistema de roles y permisos',
        'Integraciones con plataformas externas',
        'API pública para desarrolladores'
      ]
    },
    {
      status: 'future',
      title: 'Fase 4: Inteligencia Artificial',
      period: '2027',
      features: [
        'Asistente IA personalizado',
        'Predicción de demanda',
        'Recomendaciones automáticas',
        'Optimización de precios',
        'Análisis de sentimiento de clientes',
        'Automatización inteligente'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-500';
      case 'planned': return 'bg-purple-500';
      case 'future': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado ✓';
      case 'current': return 'En Desarrollo 🚀';
      case 'planned': return 'Planificado 📋';
      case 'future': return 'Futuro 🔮';
      default: return '';
    }
  };

  return (
    <>
      <SEO
        title="Roadmap | PyM-ERP"
        description="Conoce el plan de desarrollo y las próximas funcionalidades que llegarán a PyM-ERP."
        canonical="/roadmap"
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Roadmap de Desarrollo
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Conoce lo que estamos construyendo y hacia dónde vamos
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

            {phases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative mb-12 md:ml-16"
              >
                {/* Timeline dot */}
                <div className={`hidden md:block absolute -left-[4.5rem] top-6 w-8 h-8 rounded-full ${getStatusColor(phase.status)} border-4 border-white shadow-lg`} />

                <div className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-lg border-2 border-gray-300">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`px-4 py-1 ${getStatusColor(phase.status)} text-white text-sm font-semibold rounded-full`}>
                      {getStatusLabel(phase.status)}
                    </span>
                    <span className="text-gray-500 font-medium">{phase.period}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{phase.title}</h2>
                  
                  <ul className="space-y-2">
                    {phase.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white mt-16"
          >
            <h2 className="text-3xl font-bold mb-4">Sé Parte del Futuro</h2>
            <p className="text-lg mb-6 opacity-90">
              Únete ahora con el plan gratuito y sé de los primeros en acceder a nuevas funcionalidades
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/request-access')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-shadow"
            >
              Crear Cuenta Gratis →
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
}

