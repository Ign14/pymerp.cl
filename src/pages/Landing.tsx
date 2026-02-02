import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import SEO, { createOrganizationSchema } from '../components/SEO';
import { env } from '../config/env';

export default function Landing() {
  const navigate = useNavigate();
  const [showMaintenanceNotice, setShowMaintenanceNotice] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const organizationSchema = useMemo(
    () =>
      createOrganizationSchema({
        name: 'PYM-ERP',
        url: typeof window !== 'undefined' ? window.location.origin : env.publicBaseUrl,
        logo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/logopymerp.png`
            : `${env.publicBaseUrl}/logopymerp.png`,
        description:
          'PYM-ERP ayuda a emprendedores a mostrar servicios o productos, recibir reservas y conectar con clientes.',
      }),
    []
  );

  return (
    <>
      <SEO
        title="PYM-ERP | Plataforma todo-en-uno para tu negocio | AgendaWeb"
        description="Automatiza reservas, facturación y marketing en una sola plataforma diseñada para PYMES y profesionales independientes."
        keywords="pymes, agenda online, gestión de negocios, reservas, ERP"
        ogImage="/logopymerp.png"
        ogImageAlt="PYM-ERP plataforma"
        schema={organizationSchema}
        robots="index, follow"
      />
      <div className="min-h-screen bg-white">
        <nav
          id="navigation"
          className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-xl border-b border-gray-700/50 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-18">
              <button
                className="flex items-center relative"
                aria-label="Ir a inicio de PyM-ERP"
                onClick={() => navigate('/')}
              >
                <div className="relative">
                  <img
                    alt="PyM-ERP Logo"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10"
                    src="/logoapp.png"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </button>
              <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                <Link
                  to="/pymes-cercanas"
                  className="relative px-4 py-2 text-white font-medium rounded-lg bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-200 text-sm lg:text-base flex items-center space-x-2"
                  aria-label="Ver PYMEs cercanas"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span className="hidden lg:inline">PYMEs Cercanas</span>
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-100 font-medium hover:text-white transition-colors duration-200 text-sm lg:text-base"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/request-access"
                  className="px-5 lg:px-6 py-2 bg-white text-gray-900 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 text-sm lg:text-base"
                >
                  Comenzar Gratis
                </Link>
              </div>
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-700/50 active:bg-gray-600/50 transition-colors duration-200"
                aria-label="Abrir menú de navegación"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav"
                type="button"
                onClick={() => setMobileNavOpen((prev) => !prev)}
              >
                <svg
                  className="w-6 h-6 text-gray-100"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          <div
            id="mobile-nav"
            className="md:hidden overflow-hidden bg-gray-800/95 backdrop-blur-xl border-t border-gray-700/50 shadow-lg transition-all duration-300"
            style={{ height: mobileNavOpen ? 'auto' : '0px', opacity: mobileNavOpen ? 1 : 0 }}
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/pymes-cercanas"
                onClick={() => setMobileNavOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-white font-medium bg-red-600 hover:bg-red-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span>PYMEs Cercanas</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-gray-100 font-medium border border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 hover:text-white transition-all duration-200 active:scale-[0.98] bg-gray-800 shadow-sm"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/request-access"
                onClick={() => setMobileNavOpen(false)}
                className="block w-full text-center px-4 py-2.5 bg-white text-gray-900 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
              >
                Regístrate gratis
              </Link>
            </div>
          </div>
        </nav>

        <main id="main-content">
          {showMaintenanceNotice && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="maintenance-notice-title"
            >
              <div className="relative w-full max-w-xl rounded-2xl border border-blue-300/30 bg-blue-950/85 backdrop-blur-xl shadow-2xl px-6 py-6 sm:px-8 text-white">
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 transition-colors"
                  aria-label="Cerrar aviso"
                  onClick={() => setShowMaintenanceNotice(false)}
                >
                  ✕
                </button>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-800/60 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                  AVISO IMPORTANTE
                </div>
                <h2 id="maintenance-notice-title" className="mt-4 text-lg sm:text-xl font-semibold">
                  Estamos mejorando la app
                </h2>
                <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
                  Estamos actualizando la plataforma con mejoras frecuentes. Te recomendamos revisar y actualizar tu
                  página regularmente. Tus datos están seguros y se guardan correctamente.
                </p>
              </div>
            </div>
          )}
          <div id="hero">
            <section
              aria-labelledby="landing-hero-heading"
              className="relative min-h-screen flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: 'url(/wallp.landing.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-[0.05]" />
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-[0.05]" />
              </div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 md:pt-24 md:pb-14 text-center">
                <h1
                  id="landing-hero-heading"
                  className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 sm:mb-6 leading-snug sm:leading-tight tracking-tight max-w-3xl mx-auto drop-shadow-lg"
                >
                  Transforma tu negocio a digital en minutos
                </h1>
                <p className="text-lg sm:text-xl text-gray-100 font-medium mb-8 sm:mb-9 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                  Tu sitio web se ajusta a tu categoría: agenda, catálogo, menú QR, formulario de contacto o
                  tarjeta de presentación. Además, incluye un sistema de gestión simple para operar tu día a
                  día. Sin conocimientos técnicos y sin costos ocultos.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                  <Link
                    to="/request-access"
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow duration-300 w-full sm:w-auto"
                  >
                    Regístrate gratis →
                  </Link>
                  <a
                    href="#how-it-works"
                    className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg border-2 border-gray-500 hover:border-gray-600 hover:bg-gray-100 transition-all duration-300 w-full sm:w-auto"
                  >
                    Cómo funciona
                  </a>
                  <Link
                    to="/costos"
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold text-lg border-2 border-indigo-700 hover:border-indigo-800 hover:bg-indigo-700 transition-all duration-300 w-full sm:w-auto"
                  >
                    Ver precios
                  </Link>
                </div>
                <div className="mt-8 sm:mt-9 flex flex-wrap justify-center gap-3 text-sm">
                  <span className="flex items-center text-gray-100 font-medium drop-shadow-sm">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Plan BÁSICO gratis para siempre
                  </span>
                  <span className="flex items-center text-gray-100 font-medium drop-shadow-sm">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Sin tarjeta de crédito
                  </span>
                  <span className="flex items-center text-gray-100 font-medium drop-shadow-sm">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Listo en minutos
                  </span>
                </div>
                <div className="mt-12 sm:mt-14 flex justify-center">
                  <Link
                    to="/pymes-cercanas"
                    className="relative inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white rounded-full shadow-2xl hover:shadow-red-500/50 transition-all duration-300 font-bold text-lg sm:text-xl lg:text-2xl border-4 border-white/20 backdrop-blur-sm -translate-y-[0.5cm]"
                  >
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mr-3 sm:mr-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span className="drop-shadow-lg">Descubre PYMEs cercanas a ti</span>
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ml-3 sm:ml-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div id="how-it-works">
            <section className="py-12 md:py-16 lg:py-20 relative overflow-hidden">
              <img
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center select-none"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                draggable={false}
                aria-hidden="true"
                src="/comofunciona.png"
              />
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    Cómo Funciona
                  </h2>
                  <p className="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto font-medium drop-shadow-md">
                    3 pasos simples para tener tu negocio online
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 justify-items-center">
                  {[
                    {
                      title: 'Crea tu emprendimiento',
                      body: 'Registra tu negocio con nombre, logo y datos básicos en 2 minutos.',
                      emoji: '🏪',
                    },
                    {
                      title: 'Configura servicios o productos',
                      body: 'Agrega lo que ofreces: servicios con agenda o productos con catálogo.',
                      emoji: '⚙️',
                    },
                    {
                      title: 'Comparte y recibe reservas',
                      body: 'Obtén tu link único y empieza a recibir reservas o pedidos por WhatsApp.',
                      emoji: '🚀',
                    },
                  ].map((step, index) => (
                    <article
                      key={step.title}
                      className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 md:p-10 shadow-md hover:shadow-xl transition-shadow duration-300 h-full border-2 border-white/30 flex flex-col items-center text-center max-w-sm"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg z-10 mt-2 mb-6">
                        {index + 1}
                      </div>
                      <div className="flex justify-center mb-5">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-4xl md:text-5xl shadow-md">
                          {step.emoji}
                        </div>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-base md:text-lg font-medium">{step.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div id="features">
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Todo lo que necesitas</h2>
                  <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
                    Funcionalidades pensadas para que tu negocio funcione solo
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center mb-12">
                  {[
                    { title: 'Agenda Online', body: 'Sistema de reservas automático donde tus clientes agendan 24/7 sin llamadas ni mensajes.', emoji: '📅', color: 'from-blue-500 to-indigo-600' },
                    { title: 'Catálogo de Productos/Servicios', body: 'Muestra lo que ofreces con fotos, descripciones y precios. Todo en un solo lugar.', emoji: '🛍️', color: 'from-purple-500 to-pink-600' },
                    { title: 'WhatsApp Integrado', body: 'Recibe notificaciones y confirmaciones directamente en tu WhatsApp personal o de negocio.', emoji: '💬', color: 'from-green-500 to-teal-600' },
                    { title: 'Página Pública Propia', body: 'Tu link único pymerp.cl/tu-negocio para compartir en redes, tarjetas o donde quieras.', emoji: '🌐', color: 'from-orange-500 to-red-600' },
                    { title: 'Personalización Visual', body: 'Elige colores, sube tu logo y personaliza tu página para que refleje tu marca.', emoji: '🎨', color: 'from-yellow-500 to-orange-600' },
                    { title: 'App Instalable (PWA)', body: 'Tus clientes pueden instalar tu página como una app en su celular con un click.', emoji: '📱', color: 'from-indigo-500 to-purple-600' },
                  ].map((feature) => (
                    <article key={feature.title} className="relative group">
                      <div
                        className={`h-full bg-gradient-to-br ${feature.color} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white/20 flex flex-col items-center text-center`}
                      >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 mb-6 text-3xl shadow-md">
                          {feature.emoji}
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-white mb-3">{feature.title}</h3>
                        <p className="text-white/90 leading-relaxed text-sm md:text-base font-medium">{feature.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    Funciones de los planes PRO en adelante disponibles en Enero - Febrero 2026.
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 max-w-3xl mx-auto">
                    Periodo beta 2026 promociones y uso limitado de plan starter por periodo de pruebas.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div id="segmentation">
            <section className="py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Soluciones a tu Medida</h2>
                  <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
                    Elige según el tipo de negocio que tienes
                  </p>
                </div>
                <div className="flex justify-center mb-12" role="tablist" aria-label="Tipo de negocio">
                  <div className="inline-flex bg-gray-100 rounded-xl p-1">
                    <button
                      role="tab"
                      aria-selected="true"
                      aria-controls="servicios-panel"
                      className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 bg-white text-indigo-600 shadow-md"
                    >
                      Servicios
                    </button>
                    <button
                      role="tab"
                      aria-selected="false"
                      aria-controls="productos-panel"
                      className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 text-gray-600 hover:text-gray-900"
                    >
                      Productos
                    </button>
                  </div>
                </div>
                <div role="tabpanel" id="servicios-panel" className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
                  <div className="w-full md:w-[480px]">
                    <article className="relative overflow-hidden">
                      <div className="h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 border-2 border-white/20 transition-all duration-300 shadow-lg hover:shadow-2xl text-center flex flex-col items-center">
                        <div className="flex flex-col items-center mb-6">
                          <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-4xl mb-4 shadow-lg">
                            📅
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Negocios de Servicios</h3>
                          <p className="text-white/90 text-sm md:text-base font-medium">
                            Pensado para Barberías y Agenda Profesionales que necesitan reservas online y gestión de horarios.
                          </p>
                        </div>
                        <ul className="space-y-2.5 mb-6 w-full max-w-xl" role="list">
                          {[
                            'Agenda online 24/7 con reservas automáticas',
                            'Gestión de horarios, profesionales y disponibilidad',
                            'Confirmaciones y recordatorios por WhatsApp',
                            'Catálogo de servicios personalizable',
                            'Registro básico de clientes y seguimiento',
                          ].map((item) => (
                            <li key={item} className="flex items-start justify-center text-left">
                              <svg className="w-5 h-5 text-white mr-3 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-white/90 text-sm md:text-base font-medium">{item}</span>
                            </li>
                          ))}
                        </ul>
                        <Link
                          to="/request-access"
                          className="w-full py-3 bg-white/15 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow duration-300 border border-white/20"
                        >
                          Más Información →
                        </Link>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 opacity-30 rounded-full blur-3xl" aria-hidden="true" />
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div id="trust">
            <section className="py-16 bg-white border-y border-gray-200">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div>
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="text-4xl md:text-5xl">🇨🇱</div>
                    <div className="text-4xl md:text-5xl">🌎</div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Hecho para emprendedores en Chile y el mundo
                  </h2>
                  <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                    PyM-ERP nació porque vimos cómo emprendedores y PYMEs luchan con plataformas complejas y costosas. Creamos algo simple, accesible y que realmente funciona para negocios en toda Latinoamérica y el mundo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    {[
                      { title: '5 min', body: 'Para estar online', emoji: '⚡' },
                      { title: '$0 CLP', body: 'Plan básico gratis', emoji: '💰' },
                      { title: 'WhatsApp', body: 'Todo integrado', emoji: '💬' },
                    ].map((item) => (
                      <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="text-3xl mb-3">{item.emoji}</div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.body}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-12 bg-white rounded-2xl p-8 shadow-md border border-gray-200 max-w-2xl mx-auto">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-gray-700 italic mb-4 leading-relaxed">
                          "Testimonios de usuarios reales próximamente. Estamos en fase de lanzamiento y queremos que seas de los primeros en probarlo."
                        </p>
                        <div className="text-sm text-gray-500">
                          <div className="font-semibold text-gray-900">Únete al beta</div>
                          <div>Primeros usuarios · Chile</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="relative py-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 bg-black opacity-10" />
            </div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl" />
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div>
                <div className="inline-flex items-center px-6 py-3 mb-8 bg-white/90 backdrop-blur-sm text-slate-900 rounded-full text-sm md:text-base font-medium text-center shadow-sm">
                  <span className="mr-2">🎯</span>Únete al lanzamiento de la Aplicación de PYMEs más esperada por Emprendedores y clientes
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                  Tu vitrina online y tu sistema de gestión, en uno
                </h2>
                <p className="text-lg sm:text-xl text-white text-opacity-90 mb-10 max-w-2xl mx-auto">
                  Crea tu sitio web, recibe clientes y administra tu negocio desde un solo lugar. Además, los clientes pueden
                  encontrar PYMEs por categoría y comuna. Soporte 24/7 para ayudarte a crecer.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/request-access"
                    className="px-10 py-4 bg-white text-indigo-600 rounded-lg font-bold text-lg shadow-2xl hover:shadow-3xl transition-shadow duration-300 w-full sm:w-auto"
                  >
                    Regístrate gratis →
                  </Link>
                  <Link
                    to="/categorias"
                    className="px-10 py-4 border-2 border-white/70 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl hover:bg-white/10 transition-all duration-300 w-full sm:w-auto"
                  >
                    Explorar categorías →
                  </Link>
                </div>
                <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white text-opacity-90">
                  {[
                    'Sitio web + gestión empresarial',
                    'Búsqueda por categorías y comuna',
                    'Soporte 24/7',
                  ].map((line) => (
                    <div key={line} className="flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm md:text-base font-medium">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer id="footer" className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div>
                <h3 className="text-lg font-bold mb-4 text-white text-center">Empresa</h3>
                <ul className="space-y-3 text-center">
                  <li>
                    <Link to="/about" className="text-white hover:text-white transition-colors font-medium">
                      Acerca de
                    </Link>
                  </li>
                  <li>
                    <Link to="/contacto" className="text-white hover:text-white transition-colors font-medium">
                      Carreras
                    </Link>
                  </li>
                  <li>
                    <Link to="/contacto" className="text-white hover:text-white transition-colors font-medium">
                      Prensa
                    </Link>
                  </li>
                  <li>
                    <Link to="/contacto" className="text-white hover:text-white transition-colors font-medium">
                      Contacto
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4 text-white text-center">Producto</h3>
                <ul className="space-y-3 text-center">
                  <li>
                    <Link to="/costos" className="text-white hover:text-white transition-colors font-medium">
                      Precios
                    </Link>
                  </li>
                  <li>
                    <Link to="/security" className="text-white hover:text-white transition-colors font-medium">
                      Seguridad
                    </Link>
                  </li>
                  <li>
                    <Link to="/roadmap" className="text-white hover:text-white transition-colors font-medium">
                      Roadmap
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4 text-white text-center">Recursos</h3>
                <ul className="space-y-3 text-center">
                  <li>
                    <Link to="/contacto" className="text-white hover:text-white transition-colors font-medium">
                      Documentación
                    </Link>
                  </li>
                  <li>
                    <Link to="/contacto" className="text-white hover:text-white transition-colors font-medium">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link to="/contacto" className="text-white hover:text-white transition-colors font-medium">
                      Centro de Ayuda
                    </Link>
                  </li>
                  <li>
                    <Link to="/contacto" className="text-white hover:text-white transition-colors font-medium">
                      API
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4 text-white text-center">Legal</h3>
                <ul className="space-y-3 text-center">
                  <li>
                    <Link to="/privacidad" className="text-white hover:text-white transition-colors font-medium">
                      Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link to="/terminos" className="text-white hover:text-white transition-colors font-medium">
                      Términos
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacidad" className="text-white hover:text-white transition-colors font-medium">
                      Cookies
                    </Link>
                  </li>
                  <li>
                    <Link to="/terminos" className="text-white hover:text-white transition-colors font-medium">
                      Licencias
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left space-y-2">
                <p className="text-white text-sm font-medium">© 2026 PyM-ERP. Todos los derechos reservados.</p>
                <div className="text-gray-300 text-sm leading-relaxed">
                  <p>PYMERP PLATAFORMA DIGITAL SpA · RUT 78.340.269-6</p>
                  <p>Romeral, Región del Maule · Chile</p>
                  <p>📧 ignacio@datakomerz.com</p>
                </div>
              </div>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="X de PYM-ERP"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="sr-only">X</span>
                </a>
                <a
                  href="https://instagram.com/pymerp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram de PYM-ERP"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                  <span className="sr-only">Instagram</span>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="LinkedIn de PYM-ERP"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="GitHub de PYM-ERP"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
