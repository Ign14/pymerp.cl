import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function FeaturesPage() {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'FREE',
      tagline: 'Empezar',
      price: '$0',
      period: '/mes',
      description: 'Para independientes y micro-emprendedores',
      color: 'from-gray-500 to-gray-600',
      buttonText: 'Empezar Gratis',
      includes: [
        '1 usuario',
        '1 profesional',
        '1 sucursal',
        'Agenda / Catálogo básica',
        'Agenda / Catálogo manual',
        'Clientes (máx. 20)',
        'Catálogo servicios (máx. 5)',
        'Citas (máx. 30 / mes)',
        'Correos automáticos básicos'
      ],
      limitations: [
        'Sin ventas',
        'Sin compras',
        'Sin inventario',
        'Sin proveedores',
        'Sin reportes',
        'Sin exportaciones',
        'Marca "Powered by PymeERP"',
        'Sin soporte humano'
      ],
      features: {
        usuarios: '1',
        profesionales: '1',
        sucursales: '1',
        agenda: true,
        ventas: false,
        compras: false,
        inventario: null,
        reportes: null,
        rrhh: false
      }
    },
    {
      id: 'starter',
      name: 'STARTER',
      tagline: 'Agenda / Catálogo Pro',
      price: '$29.990',
      period: '/mes',
      description: 'Para micro-pymes que necesitan orden',
      color: 'from-green-500 to-green-600',
      buttonText: 'Comenzar Starter',
      includes: [
        'Hasta 2 usuarios',
        'Hasta 3 profesionales',
        '1 sucursal',
        'Agenda / Catálogo completa',
        'Agenda / Catálogo manual desde dashboard',
        'Clientes ilimitados',
        'Catálogo de servicios ilimitado',
        'Citas (hasta 300 / mes)',
        'Cancelaciones y reprogramaciones',
        'Correos automáticos',
        'Historial del cliente'
      ],
      limitations: [
        'Ventas',
        'Compras',
        'Inventario',
        'Proveedores',
        'Reportes financieros',
        'Multi-sucursal'
      ],
      features: {
        usuarios: '2',
        profesionales: '3',
        sucursales: '1',
        agenda: true,
        ventas: false,
        compras: false,
        inventario: null,
        reportes: null,
        rrhh: false
      }
    },
    {
      id: 'pro',
      name: 'PRO',
      tagline: 'Control del Negocio',
      price: '$89.990',
      period: '/mes',
      description: 'Para pymes que venden servicios y productos',
      color: 'from-blue-500 to-blue-600',
      buttonText: 'Comenzar Pro',
      includes: [
        'Hasta 15 usuarios',
        'Hasta 15 profesionales',
        '1 sucursal',
        'Todo lo de Starter +',
        'Ventas completas',
        'Clientes y proveedores',
        'Catálogo de productos',
        'Compras',
        'Inventario básico',
        'Servicios pendientes',
        'Reportes operativos',
        'Roles y permisos'
      ],
      limitations: [
        'Multi-sucursal',
        'Inventario avanzado',
        'Reportes financieros avanzados'
      ],
      features: {
        usuarios: '15',
        profesionales: '15',
        sucursales: '1',
        agenda: true,
        ventas: true,
        compras: true,
        inventario: 'Básico',
        reportes: 'Operativos',
        rrhh: false
      }
    },
    {
      id: 'business',
      name: 'BUSINESS',
      tagline: 'Escalar sin Caos',
      price: '$169.990',
      period: '/mes',
      description: 'Para empresas en crecimiento',
      color: 'from-purple-500 to-purple-600',
      buttonText: 'Comenzar Business',
      includes: [
        'Hasta 40 usuarios',
        'Hasta 60 profesionales',
        'Multi-sucursal',
        'Todo lo de Pro +',
        'Inventario avanzado (kardex)',
        'Reportes financieros',
        'Auditoría de acciones',
        'Exportaciones (Excel/PDF)',
        'Permisos avanzados',
        'Soporte prioritario'
      ],
      limitations: [],
      features: {
        usuarios: '40',
        profesionales: '60',
        sucursales: '∞',
        agenda: true,
        ventas: true,
        compras: true,
        inventario: 'Avanzado',
        reportes: 'Financieros',
        rrhh: false
      }
    },
    {
      id: 'enterprise',
      name: 'ENTERPRISE',
      tagline: 'Operación Profesional',
      price: 'Desde $249.990',
      period: '/mes',
      description: 'Para operación crítica',
      color: 'from-red-500 to-red-600',
      buttonText: 'Contactar Ventas',
      includes: [
        'Usuarios ilimitados',
        'Profesionales ilimitados',
        'Multi-sucursal avanzada',
        'Todo lo de Business +',
        'RRHH operativo (turnos, asistencia)',
        'Integraciones externas',
        'SLA',
        'Onboarding asistido',
        'Soporte dedicado'
      ],
      limitations: [],
      features: {
        usuarios: '∞',
        profesionales: '∞',
        sucursales: '∞',
        agenda: true,
        ventas: true,
        compras: true,
        inventario: 'Avanzado',
        reportes: 'Financieros',
        rrhh: true
      }
    }
  ];

  const comparisonFeatures = [
    { label: 'Usuarios', key: 'usuarios' },
    { label: 'Profesionales', key: 'profesionales' },
    { label: 'Sucursales', key: 'sucursales' },
    { label: 'Agenda / Catálogo', key: 'agenda' },
    { label: 'Ventas', key: 'ventas' },
    { label: 'Compras', key: 'compras' },
    { label: 'Inventario', key: 'inventario' },
    { label: 'Reportes', key: 'reportes' },
    { label: 'RRHH', key: 'rrhh' }
  ];

  return (
    <>
      <SEO
        title="Planes y Funcionalidades | PyM-ERP"
        description="Compara nuestros planes y elige el que mejor se adapte a tu negocio. Desde FREE hasta ENTERPRISE, encuentra todas las funcionalidades que necesitas."
        canonical="/features"
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
            className="text-center mb-10 md:mb-12"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
              Planes y Funcionalidades
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Elige el plan perfecto para tu negocio. Todos los planes incluyen funcionalidades básicas, 
              desde gratis hasta soluciones empresariales completas.
            </p>
          </motion.div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`bg-white rounded-xl shadow-lg border-2 ${
                  plan.id === 'free' ? 'border-gray-300' : 
                  plan.id === 'starter' ? 'border-green-300' :
                  plan.id === 'pro' ? 'border-blue-300' :
                  plan.id === 'business' ? 'border-purple-300' :
                  'border-red-300'
                } hover:shadow-xl transition-all flex flex-col`}
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${plan.color} rounded-t-xl p-4 text-white text-center`}>
                  <div className="text-xs font-semibold mb-1 opacity-90">{plan.tagline}</div>
                  <div className="text-xl font-bold">{plan.name}</div>
                </div>

                {/* Price */}
                <div className="p-4 text-center border-b border-gray-200">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`font-bold text-gray-900 ${plan.price.length > 10 ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'}`}>
                      {plan.price}
                    </span>
                    <span className="text-sm md:text-base text-gray-600 whitespace-nowrap">{plan.period}</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 mt-2">{plan.description}</p>
                </div>

                {/* Includes */}
                <div className="p-4 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Incluye:</h3>
                  <ul className="space-y-2 mb-4">
                    {plan.includes.slice(0, 6).map((item, i) => (
                      <li key={i} className="flex items-start text-xs md:text-sm text-gray-700">
                        <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                    {plan.includes.length > 6 && (
                      <li className="text-xs text-gray-500 italic">
                        +{plan.includes.length - 6} más...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="p-4 pt-0 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">No incluye:</h3>
                    <ul className="space-y-1">
                      {plan.limitations.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start text-xs text-gray-500">
                          <span className="text-gray-400 mr-2 flex-shrink-0">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                      {plan.limitations.length > 3 && (
                        <li className="text-xs text-gray-400 italic">
                          +{plan.limitations.length - 3} más...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <div className="p-4 pt-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => plan.id === 'free' ? navigate('/request-access') : navigate('/contacto')}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      plan.id === 'free' 
                        ? `bg-gradient-to-r ${plan.color} text-white shadow-md hover:shadow-lg`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.buttonText}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-12 md:mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
              Tabla Comparativa
            </h2>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-lg border-2 border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Funcionalidad
                        </th>
                        {plans.map((plan) => (
                          <th
                            key={plan.id}
                            className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider ${
                              plan.id === 'free' ? 'text-gray-700' :
                              plan.id === 'starter' ? 'text-green-700' :
                              plan.id === 'pro' ? 'text-blue-700' :
                              plan.id === 'business' ? 'text-purple-700' :
                              'text-red-700'
                            }`}
                          >
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {comparisonFeatures.map((feature, idx) => (
                        <tr key={feature.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {feature.label}
                          </td>
                          {plans.map((plan) => {
                            const value = plan.features[feature.key as keyof typeof plan.features];
                            return (
                              <td key={plan.id} className="px-4 py-3 text-center text-sm text-gray-700">
                                {typeof value === 'boolean' ? (
                                  value ? (
                                    <span className="text-green-600 font-bold">✓</span>
                                  ) : (
                                    <span className="text-gray-300">✗</span>
                                  )
                                ) : value === null ? (
                                  <span className="text-gray-300">—</span>
                                ) : (
                                  <span className="font-medium">{value}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 lg:p-12 text-center text-white"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">¿Listo para comenzar?</h2>
            <p className="text-base md:text-lg mb-5 md:mb-6 opacity-90">
              Comienza con el plan FREE y actualiza cuando lo necesites. Sin compromisos, sin tarjeta de crédito.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/request-access')}
              className="px-6 md:px-8 py-3 md:py-4 bg-white text-indigo-600 rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-shadow"
            >
              Crear Cuenta Gratis →
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
