import { Fragment } from 'react';
import { type PublicLayoutProps, type PublicLayoutSections } from './types';

type SectionKey = keyof PublicLayoutSections;

const DEFAULT_ORDER: SectionKey[] = [
  'highlight',
  'services',
  'team',
  'products',
  'properties',
  'schedule',
  'reviews',
  'faqs',
  'missionVision',
  'hours',
  'location',
  'media',
];

const BEAUTY_ORDER: SectionKey[] = [
  'hero',
  'highlight',
  'services',
  'team',
  'products',
  'missionVision',
  'hours',
  'location',
  'media',
];

const PRODUCTS_ORDER: SectionKey[] = [
  'hero',
  'highlight',
  'products',
  'services',
  'location',
  'hours',
  'reviews',
  'faqs',
  'media',
];

const PROPERTY_ORDER: SectionKey[] = [
  'hero',
  'highlight',
  'properties',
  'schedule',
  'team',
  'location',
  'hours',
  'faqs',
  'media',
];

const FITNESS_ORDER: SectionKey[] = ['highlight', 'services', 'schedule', 'team', 'products', 'properties', 'reviews', 'faqs', 'missionVision', 'hours', 'location', 'media'];

const INDIE_PROS_ORDER: SectionKey[] = ['hero', 'services', 'schedule', 'team', 'highlight', 'hours', 'location', 'faqs', 'reviews', 'media'];

function resolveOrder(layoutKey: PublicLayoutProps['layoutKey']): SectionKey[] {
  if (layoutKey === 'beautyShowcase') return BEAUTY_ORDER;
  if (layoutKey === 'productsShowcase') return PRODUCTS_ORDER;
  if (layoutKey === 'restaurantesComidaRapidaShowcase') return PRODUCTS_ORDER;
  if (layoutKey === 'minimarketShowcase') return PRODUCTS_ORDER;
  if (layoutKey === 'productosCuidadoPersonalShowcase') return PRODUCTS_ORDER;
  if (layoutKey === 'inmobiliariaTerrenosCasasShowcase') return PROPERTY_ORDER;
  if (layoutKey === 'propertyShowcase') return PROPERTY_ORDER;
  if (layoutKey === 'actividadEntrenamientoFisicoShowcase') return FITNESS_ORDER;
  if (layoutKey === 'agendaProfesionalesIndependientesShowcase') return INDIE_PROS_ORDER;
  return DEFAULT_ORDER;
}

function SectionGroup({ sections, order, hideHero }: { sections: PublicLayoutSections; order: SectionKey[]; hideHero?: boolean }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {order.map((key) => {
        if (hideHero && key === 'hero') return null;
        const content = sections[key];
        if (!content) return null;
        // Performance: evita renderizar secciones fuera de viewport (mejora scroll fluido en mobile).
        // Agregar ID para navegación desde el menú móvil
        const sectionId = `section-${key}`;
        return (
          <div key={key} id={sectionId} className="perf-section scroll-mt-20">
            <Fragment>{content}</Fragment>
          </div>
        );
      })}
    </div>
  );
}

export function PublicLayoutShell({
  layoutKey,
  variant,
  sections,
  contactActions,
  floatingCta,
  appearance,
}: PublicLayoutProps) {
  const order = resolveOrder(layoutKey);
  const heroBlock = sections.hero;

  const heroPadding =
    variant === 'compact'
      ? 'p-5 sm:p-7 lg:p-8'
      : 'p-5 sm:p-8 lg:p-10';

  const heroVariantClass =
    variant === 'immersive'
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl'
      : variant === 'modern'
      ? 'bg-white/80 backdrop-blur-xl border border-slate-200 text-slate-900 shadow-[0_10px_40px_rgba(15,23,42,0.14)]'
      : variant === 'compact'
      ? 'bg-slate-50/90 border border-slate-200 text-slate-900 shadow-sm'
      : variant === 'minimal'
      ? 'bg-white/90 border border-slate-200 text-slate-900 shadow-sm'
      : 'bg-gradient-to-br from-blue-50 via-white to-sky-50 text-slate-900 shadow-lg';

  return (
    <div className="space-y-8 sm:space-y-10">
      {heroBlock &&
        (appearance ? (
          heroBlock
        ) : (
          <section
            className={`relative overflow-hidden rounded-3xl sm:rounded-[32px] ${heroPadding} focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 transition-shadow ${heroVariantClass}`}
            tabIndex={-1}
          >
            {heroBlock}
          </section>
        ))}

      <SectionGroup sections={sections} order={order} hideHero={Boolean(heroBlock)} />

      {sections.contact || contactActions ? (
        <div id="section-contact" className="flex justify-center scroll-mt-20">
          {sections.contact ?? contactActions}
        </div>
      ) : null}

      {floatingCta && (
        <div className="fixed bottom-4 inset-x-4 sm:hidden z-40 drop-shadow-xl">{floatingCta}</div>
      )}
    </div>
  );
}
