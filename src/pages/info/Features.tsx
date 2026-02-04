import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function Features() {
  const navigate = useNavigate();
  return (
    <>
      <SEO
        title="Costos Claros | PyM-ERP | AgendaWeb"
        description="Crear una página web básica o publicar tu página en nuestra plataforma es 100% gratis. Planes mensuales por categoría según herramientas y servicios adicionales a medida."
        canonical="/features"
        ogImage="/og-default.jpg"
      />
      <div className="min-h-screen bg-black text-slate-100">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-32 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl"></div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <button className="mb-6 md:mb-8 text-emerald-300 hover:text-emerald-200 font-medium" onClick={() => navigate('/')}>
            ← Volver al inicio
          </button>

          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200 shadow-sm">
              Costos claros para crecer sin vueltas
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
              Crea, publica y ordena tu negocio sin complicaciones
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
              Crear una página web básica o publicar tu página en nuestra plataforma es 100% gratis. Nuestro servicio es ser la plataforma digital que impulsa
              crecimiento, formación digital y orden de todo emprendedor o pyme.
            </p>
            <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto mt-4">
              Comienza a ordenar tu negocio en un par de minutos y con las funciones de desarrollo web de la app y estrategia de ads, tu negocio no pasará nunca más
              desapercibido.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
            <div className="rounded-2xl border border-amber-400/30 bg-slate-900/70 shadow-lg p-6 md:p-8 flex flex-col">
              <div className="text-sm font-semibold text-amber-200 mb-2">100% gratis</div>
              <h2 className="text-2xl font-bold text-white mb-3">Publica tu web básica sin costo</h2>
              <p className="text-slate-300 mb-5">
                Tu presencia digital esencial lista para empezar. Ideal para validar, mostrar tu catálogo o agenda y recibir clientes.
              </p>
              <ul className="space-y-2 text-sm text-slate-300 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-300 mt-0.5">●</span>
                  Página pública lista para compartir
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-300 mt-0.5">●</span>
                  Orden básico de tu negocio en minutos
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-300 mt-0.5">●</span>
                  Sin tarjeta de crédito
                </li>
              </ul>
              <button
                className="mt-auto w-full rounded-xl bg-emerald-500 text-black py-3 font-semibold shadow-lg hover:bg-emerald-400 transition-colors"
                onClick={() => navigate('/request-access')}
              >
                Crear cuenta gratis
              </button>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 shadow-lg p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4 rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold px-3 py-1">Próximamente</div>
              <div className="text-sm font-semibold text-slate-400 mb-2">Suscripción por categoría</div>
              <h2 className="text-2xl font-bold text-white mb-3">Planes según el nivel de herramientas</h2>
              <p className="text-slate-300 mb-5">
                Cada categoría tiene distintos planes y precios mensuales según las herramientas que necesitas para tu sitio web y gestión.
              </p>
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200 mb-6">
                Pronto más información dentro de tu panel principal.
              </div>
              <button
                className="mt-auto w-full rounded-xl bg-slate-950 text-slate-100 py-3 font-semibold border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition-colors"
                onClick={() => navigate('/request-access')}
              >
                Ver mi panel
              </button>
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-slate-900/70 shadow-lg p-6 md:p-8 flex flex-col">
              <div className="text-sm font-semibold text-emerald-200 mb-2">Servicios adicionales</div>
              <h2 className="text-2xl font-bold text-white mb-3">Escala tu marca al siguiente nivel</h2>
              <p className="text-slate-300 mb-5">
                Profesionalizamos aún más tu sitio web. Si quieres escalar tu marca, empresa o producto, nuestro equipo crea la web o app que necesitas a un precio
                justo y sin tantas vueltas.
              </p>
              <button
                className="mt-auto w-full rounded-xl bg-white text-black py-3 font-semibold shadow-lg hover:bg-slate-200 transition-colors"
                onClick={() => navigate('/contacto')}
              >
                Hablar con el equipo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 md:gap-10 items-center mb-12 md:mb-16">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 md:p-8 shadow-md">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Lo que impulsamos con nuestra plataforma</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-300 mt-1">●</span>
                  Crecimiento real con presencia digital clara y fácil de compartir
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-300 mt-1">●</span>
                  Formación digital práctica para ordenar procesos y equipos
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-300 mt-1">●</span>
                  Organización del negocio en minutos con herramientas simples
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-300 mt-1">●</span>
                  Visibilidad con funciones de desarrollo web y estrategia de ads
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 md:p-8 shadow-md">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-100 mb-3">¿Listo para comenzar?</h3>
              <p className="text-emerald-100/80 mb-5">
                Empieza gratis y escala cuando lo necesites. Te acompañamos en el camino con herramientas claras y un equipo que responde.
              </p>
              <button
                className="w-full rounded-xl bg-emerald-400 text-black py-3 font-semibold shadow-lg hover:bg-emerald-300 transition-colors"
                onClick={() => navigate('/request-access')}
              >
                Crear cuenta gratis
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
