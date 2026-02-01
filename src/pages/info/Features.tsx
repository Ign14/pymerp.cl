import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

type Plan = {
  name: string;
  planId: 'BASIC' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  tagline: string;
  price: string;
  priceNote?: string;
  description: string;
  includes: string[];
  excludes?: string[];
  buttonLabel: string;
  buttonVariant: string;
  buttonLink: string;
  footerNote?: string;
  badge?: string;
  blocked?: boolean;
};

const plans: Plan[] = [
  {
    name: 'Basic',
    planId: 'BASIC',
    tagline: 'Plan esencial para comenzar con tu negocio',
    price: '$0',
    description: 'Plan gratuito limitado. Ideal para dar a conocer tu PYME con funcionalidades básicas.',
    includes: [
      'Página pública personalizable',
      'Integración con WhatsApp (simple)',
      'Menú, agenda y catálogo básico según tu categoría',
      'Sitio web básico para tu negocio',
      'Hasta 1 profesional',
      'Hasta 5 servicios',
      'Hasta 5 productos',
      'Hasta 5 horarios'
    ],
    excludes: ['Recordatorios automáticos', 'Exportación de datos', '+4 más...'],
    buttonLabel: 'Empezar Gratis',
    buttonVariant: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md hover:shadow-lg',
    buttonLink: '/request-access',
  },
  {
    name: 'Starter',
    planId: 'STARTER',
    tagline: 'Sistema de gestión sencillo para crecer',
    price: '$27.900',
    priceNote: '/mes',
    description: 'Sistema de gestión sencillo para crecer',
    includes: [
      'Página pública personalizable',
      'Menú, agenda y catálogo con gestión empresarial sencilla',
      'Diseño de páginas Starter',
      'Gestión de citas/órdenes automatizadas desde tu panel',
      'Hasta 6 profesionales',
      'Hasta 40 servicios',
      'Hasta 40 productos',
      'Hasta 40 horarios',
      'Recordatorios automáticos de citas'
    ],
    excludes: ['Exportación de datos', 'Integraciones externas', '+4 más...'],
    buttonLabel: 'Solicitar Starter',
    buttonVariant: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
    buttonLink: '/contacto',
    footerNote: 'Contacta para más información',
    badge: 'Recomendado'
  },
  {
    name: 'Pro',
    planId: 'PRO',
    tagline: 'Gestión empresarial pro con automatizaciones',
    price: '$69.800',
    priceNote: '/mes',
    description: 'Gestión empresarial pro con automatizaciones',
    includes: [
      'Página pública personalizable',
      'Gestión empresarial Pro (menú, agenda, catálogo y sitio web)',
      'Diseño Premium + contenido + personalización',
      'Gestión de citas/órdenes automatizadas desde tu panel',
      'Soporte prioritario + colaboración en marketing digital',
      'Agente IA Pro',
      'Hasta 10 profesionales',
      'Servicios ilimitados',
      'Productos ilimitados',
      'Horarios ilimitados',
      'Recordatorios automáticos de citas',
      'Exportación de datos (Excel/PDF)',
      'Integraciones con terceros',
      'Destacado en directorio de PYMEs',
      'Analíticas y reportes avanzados',
      'Soporte prioritario por email'
    ],
    excludes: ['Dominio personalizado'],
    buttonLabel: 'Solicitar Pro',
    buttonVariant: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
    buttonLink: '/contacto',
    footerNote: 'Contacta para más información',
    blocked: true
  },
  {
    name: 'Business',
    planId: 'BUSINESS',
    tagline: 'E-commerce y operaciones avanzadas para expansión',
    price: '$247.900',
    priceNote: '/mes',
    description: 'E-commerce y operaciones avanzadas para expansión',
    includes: [
      'Dominio propio .cl / .com',
      'E-commerce con métodos de pago',
      'Diseño de páginas a medida',
      'ERP profesional para carga masiva de datos',
      'Sistema multisucursal y multiusuario',
      'Reportes modulares en tiempo real',
      'Gestión de RRHH',
      'Agente IA Enterprise',
      'Hasta 30 profesionales',
      'Servicios ilimitados',
      'Productos ilimitados',
      'Horarios ilimitados',
      'Recordatorios automáticos de citas',
      'Exportación de datos (Excel/PDF)',
      'Integraciones con terceros',
      'Destacado en directorio de PYMEs',
      'Dominio personalizado (ej: tuempresa.cl)',
      'Analíticas y reportes avanzados',
      'Soporte prioritario por email'
    ],
    buttonLabel: 'Solicitar Business',
    buttonVariant: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
    buttonLink: '/contacto',
    footerNote: 'Contacta para más información',
    blocked: true
  },
  {
    name: 'Enterprise',
    planId: 'ENTERPRISE',
    tagline: 'Consultoría y desarrollo a medida',
    price: 'Personalizado',
    description: 'Consultoría y desarrollo a medida',
    includes: ['Consultoría y solución a medida para tu negocio'],
    buttonLabel: 'Contactar Ventas',
    buttonVariant: 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md hover:shadow-lg',
    buttonLink: '/contacto',
    footerNote: 'Contacta para más información'
  }
];

const planThemes: Record<string, { border: string; header: string }> = {
  Basic: { border: 'border-gray-300', header: 'from-gray-500 to-gray-600' },
  Starter: { border: 'border-blue-300', header: 'from-blue-500 to-blue-600' },
  Pro: { border: 'border-purple-300', header: 'from-purple-500 to-purple-600' },
  Business: { border: 'border-indigo-300', header: 'from-indigo-500 to-indigo-600' },
  Enterprise: { border: 'border-green-300', header: 'from-green-500 to-green-600' }
};

const comparisonRows = [
  { label: 'Profesionales', basic: '1', starter: '6', pro: '∞', business: '∞', enterprise: 'A medida' },
  { label: 'Servicios', basic: '5', starter: '40', pro: '∞', business: '∞', enterprise: 'A medida' },
  { label: 'Productos', basic: '5', starter: '40', pro: '∞', business: '∞', enterprise: 'A medida' },
  { label: 'Horarios', basic: '5', starter: '40', pro: '∞', business: '∞', enterprise: 'A medida' },
  { label: 'Recordatorios automáticos', basic: '✗', starter: '✓', pro: '✓', business: '✓', enterprise: 'A medida' },
  { label: 'Exportación de datos', basic: '✗', starter: '✗', pro: '✓', business: '✓', enterprise: 'A medida' },
  { label: 'Integraciones', basic: '✗', starter: '✗', pro: '✓', business: '✓', enterprise: 'A medida' },
  { label: 'Destacado en directorio', basic: '✗', starter: '✗', pro: '✓', business: '✓', enterprise: 'A medida' },
  { label: 'Dominio personalizado', basic: '✗', starter: '✗', pro: '✗', business: '✓', enterprise: 'A medida' },
  { label: 'Analíticas avanzadas', basic: '✗', starter: '✗', pro: '✓', business: '✓', enterprise: 'A medida' },
  { label: 'Soporte prioritario', basic: '✗', starter: '✗', pro: '✓', business: '✓', enterprise: 'A medida' },
  { label: 'White Label', basic: '✗', starter: '✗', pro: '✗', business: '✗', enterprise: 'A medida' }
];

export default function Features() {
  const navigate = useNavigate();
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  return (
    <>
      <SEO
        title="Planes y Funcionalidades | PyM-ERP | AgendaWeb"
        description="Cada categoría tiene su sistema de gestión especializado. Elige el plan que determine qué funcionalidades estarán disponibles para tu PYME. Plan Basic gratis para dar a conocer tu negocio."
        canonical="/features"
        ogImage="/og-default.jpg"
      />
      <div className="min-h-screen bg-white">
        {showAnnouncement && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center px-4 py-4 sm:py-6 bg-black/60 backdrop-blur-sm sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="features-announcement-title"
          >
            <div className="relative w-full max-w-2xl rounded-3xl border border-indigo-100 bg-white shadow-2xl overflow-hidden max-h-[82vh] sm:max-h-[80vh] flex flex-col">
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-200/20 via-white/80 to-purple-200/20"></div>
              <div className="relative p-4 sm:p-8 overflow-y-auto flex-1">
                <div className="space-y-3 sm:space-y-4 text-gray-900">
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-indigo-800 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.2)]"></span>
                    ¡Aviso Importante!
                  </div>
                  <div>
                    <h2 id="features-announcement-title" className="text-xl sm:text-3xl font-extrabold text-indigo-950 leading-tight">
                      Periodo Beta: Todas las Funcionalidades Liberadas
                    </h2>
                    <p className="mt-2 text-sm sm:text-lg text-gray-800 leading-relaxed">
                      Estamos en periodo beta. Todas las funcionalidades de PyM-ERP están disponibles para probar, sin importar el plan que veas aquí.
                    </p>
                  </div>
                  <div className="space-y-3 sm:space-y-4 text-[13px] sm:text-base text-gray-800">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg text-blue-900">
                      <p className="font-semibold text-blue-900 mb-1.5">📢 Aviso Importante sobre el Plan Gratuito:</p>
                      <p className="text-blue-900/90 leading-relaxed">
                        El plan Basic (gratuito) tiene una carga limitada de imágenes en productos y servicios. Los planes superiores incluyen más capacidad de almacenamiento.
                      </p>
                    </div>
                    <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 rounded-r-lg text-green-900">
                      <p className="font-semibold text-green-900 mb-1.5">✨ Periodo Beta:</p>
                      <p className="text-green-900 leading-relaxed">
                        Durante este periodo beta, <span className="font-semibold">todas las funcionalidades</span> de la aplicación estarán liberadas para tu prueba, sin importar el plan que elijas al crear tu cuenta.
                      </p>
                    </div>
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-r-lg text-amber-900">
                      <p className="font-semibold text-amber-900 mb-1.5">⏰ Activación de Planes de Pago:</p>
                      <p className="text-amber-900/90 leading-relaxed">
                        Te avisaremos con <span className="font-semibold">45 días de anticipación</span> cuando se active la plataforma de pago y las características definitivas de cada plan.
                      </p>
                    </div>
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-3 sm:p-4 rounded-r-lg text-purple-900">
                      <p className="font-semibold text-purple-900 mb-1.5">🎁 Descuento Exclusivo para Beta Users:</p>
                      <p className="text-purple-900/90 leading-relaxed">
                        Las cuentas creadas hasta <span className="font-semibold">45 días antes</span> de la activación de la plataforma de pago recibirán un{' '}
                        <span className="font-semibold text-purple-900">descuento exclusivo del 50%</span>en cualquier plan durante los primeros 2 años.
                      </p>
                    </div>
                    <p className="text-blue-900 italic mt-3 sm:mt-4">
                      Realizaremos encuestas y ajustes continuos en este periodo. Tu feedback define el producto final y te garantiza beneficios exclusivos.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs sm:text-sm text-blue-900">
                      Participa ahora y asegura ventajas preferentes cuando publiquemos los precios definitivos.
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                      <button
                        type="button"
                        className="rounded-full border border-white/70 bg-white/70 px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-200 hover:bg-white"
                        onClick={() => setShowAnnouncement(false)}
                      >
                        Ver planes
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                        onClick={() => navigate('/request-access?utm=features-announcement')}
                      >
                        Quiero participar →
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-indigo-900 shadow hover:bg-white"
                  aria-label="Cerrar anuncio"
                  onClick={() => setShowAnnouncement(false)}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <button className="mb-6 md:mb-8 text-indigo-600 hover:text-indigo-700 font-medium" onClick={() => navigate('/')}>
            ← Volver al inicio
          </button>

          <div className="text-center mb-10 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">Planes y Funcionalidades</h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Cada categoría de negocio tiene su propio sistema de gestión especializado. Elige el plan que determine qué funcionalidades estarán disponibles o
              bloqueadas para tu PYME.
            </p>
            <div className="max-w-4xl mx-auto mt-8 mb-12 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Sistemas de Gestión por Categoría</h2>
              <p className="text-base md:text-lg text-gray-900 mb-4">
                PyM-ERP adapta su sistema de gestión según tu tipo de negocio. Cada categoría tiene funcionalidades específicas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 text-left">
                <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                  <div className="font-semibold text-indigo-950 mb-2">🏥 Clínicas</div>
                  <p className="text-sm text-gray-700">Gestión de pacientes, citas médicas, fichas clínicas, profesionales y recursos.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                  <div className="font-semibold text-indigo-950 mb-2">💇 Barberías</div>
                  <p className="text-sm text-gray-700">Agenda de citas, catálogo de servicios, gestión de profesionales y horarios.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                  <div className="font-semibold text-indigo-950 mb-2">🍽️ Restaurantes</div>
                  <p className="text-sm text-gray-700">Menú QR, pedidos, delivery/takeaway, gestión de productos y categorías.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                  <div className="font-semibold text-indigo-950 mb-2">🛒 Minimarket</div>
                  <p className="text-sm text-gray-700">Catálogo de productos, carrito, pedidos, búsqueda y gestión de stock.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                  <div className="font-semibold text-indigo-950 mb-2">🔧 Talleres</div>
                  <p className="text-sm text-gray-700">Órdenes de trabajo, cotizaciones, seguimiento y gestión de servicios.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                  <div className="font-semibold text-indigo-950 mb-2">Y más...</div>
                  <p className="text-sm text-gray-700">Más de 40 categorías especializadas con sistemas adaptados a cada industria.</p>
                </div>
              </div>
              <p className="text-sm text-gray-900 mt-6 italic">
                El plan que elijas determinará qué funcionalidades de tu sistema estarán disponibles o bloqueadas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-8 mb-12 md:mb-16">
            {plans.map((plan) => {
              const theme = planThemes[plan.name];
              return (
                <div
                  key={plan.name}
                  className={`bg-white rounded-xl shadow-lg border-2 ${theme.border} hover:shadow-xl transition-all flex flex-col relative`}
                >
                  {plan.blocked && (
                    <div className="absolute inset-0 z-20 rounded-xl bg-white/70 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.15)] flex items-center justify-center text-center px-6">
                      <div className="rounded-2xl border border-white/70 bg-white/60 px-6 py-4 text-sm sm:text-base font-semibold text-indigo-900 tracking-wide shadow-md">
                        PRONTO MÁS INFROMACIÓN
                      </div>
                    </div>
                  )}
                  <div className={`bg-gradient-to-r ${theme.header} rounded-t-xl p-5 text-white text-center relative overflow-hidden`}>
                    {plan.badge && (
                      <div className="absolute top-2 right-2 bg-white/20 text-white text-[10px] px-2 py-1 rounded-full font-semibold">
                        {plan.badge}
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-2 left-2 bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors"
                      aria-label="Información sobre características del plan"
                      title="Más información"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </button>
                    <div className="text-xs font-semibold mb-1.5 opacity-90">{plan.tagline}</div>
                    <div className="text-2xl font-bold">{plan.name}</div>
                  </div>
                  <div className="p-5 text-center border-b border-gray-200 bg-gray-50">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="font-bold text-red-600 text-2xl md:text-3xl">{plan.price}</span>
                      {plan.priceNote && <span className="text-sm font-semibold text-gray-500">{plan.priceNote}</span>}
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mt-2.5 leading-relaxed">{plan.description}</p>
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Incluye:</h3>
                    <ul className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                      {plan.includes.map((item) => (
                        <li key={item} className="flex items-start text-xs md:text-sm text-gray-700">
                          <span className="text-green-500 mr-2 flex-shrink-0 mt-0.5">✓</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {plan.excludes && (
                    <div className="p-4 pt-0 border-t border-gray-200 bg-gray-50">
                      <h3 className="text-xs font-semibold text-gray-700 mb-2">No disponible en este plan:</h3>
                      <ul className="space-y-1">
                        {plan.excludes.map((item, index) => {
                          if (item.startsWith('+')) {
                            return (
                              <li key={`${plan.name}-exclude-${index}`} className="text-xs text-gray-400 italic mt-1">
                                {item}
                              </li>
                            );
                          }
                          return (
                            <li key={`${plan.name}-exclude-${index}`} className="flex items-start text-xs text-gray-500">
                              <span className="text-gray-400 mr-1.5 flex-shrink-0 mt-0.5">—</span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="p-4 pt-0 border-t border-gray-200">
                    <button
                      className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${plan.buttonVariant}`}
                      tabIndex={0}
                      onClick={() =>
                        plan.planId === 'BASIC'
                          ? navigate(plan.buttonLink)
                          : navigate(`${plan.buttonLink}?plan=${plan.planId}`)
                      }
                    >
                      {plan.buttonLabel}
                    </button>
                    {plan.footerNote && <p className="text-xs text-gray-500 text-center mt-2">{plan.footerNote}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Tabla Comparativa</h2>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-lg border-2 border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Funcionalidad</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700">Basic</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">Starter</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-purple-700">Pro</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-indigo-700">Business</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-green-700">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {comparisonRows.map((row, index) => (
                        <tr key={row.label} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.label}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">
                            <span className="font-medium">{row.basic}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">
                            <span className="font-medium">{row.starter}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">
                            <span className={row.pro === '∞' ? 'font-bold text-purple-600' : 'font-medium'}>{row.pro}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">
                            <span className={row.business === '∞' ? 'font-bold text-purple-600' : 'font-medium'}>{row.business}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">
                            <span className="font-medium">{row.enterprise}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 lg:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">¿Listo para comenzar?</h2>
            <p className="text-base md:text-lg mb-5 md:mb-6 opacity-90">
              Comienza con el plan Basic gratuito para dar a conocer tu PYME. Actualiza a un plan superior cuando necesites más funcionalidades. Sin compromisos,
              sin tarjeta de crédito.
            </p>
            <button
              className="px-6 md:px-8 py-3 md:py-4 bg-white text-indigo-600 rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-shadow"
              onClick={() => navigate('/request-access')}
            >
              Crear Cuenta Gratis →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
