import { Fragment } from 'react';
import { type PublicLayoutProps, type PublicLayoutSections } from './types';

type SectionKey = keyof PublicLayoutSections;

/* Helper para generar color con opacidad desde hex o rgba */
const withOpacity = (color: string, alpha: number): string => {
  if (!color) return `rgba(255,255,255,${alpha})`;
  const a = Math.min(1, Math.max(0, alpha));
  const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgba) return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${a})`;
  const n = color.replace('#', '');
  const f = n.length === 3 ? n.split('').map((c: string) => c + c).join('') : n.padEnd(6, '0');
  const i = parseInt(f.substring(0, 6), 16);
  const r = (i >> 16) & 255;
  const g = (i >> 8) & 255;
  const b = i & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

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

const RESTAURANTS_ORDER: SectionKey[] = [
  'hero',
  'highlight',
  'products',
  'services',
  'hours',
  'location',
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
  if (layoutKey === 'restaurantesComidaRapidaShowcase') return RESTAURANTS_ORDER;
  if (layoutKey === 'minimarketShowcase') return PRODUCTS_ORDER;
  if (layoutKey === 'productosCuidadoPersonalShowcase') return PRODUCTS_ORDER;
  if (layoutKey === 'inmobiliariaTerrenosCasasShowcase') return PROPERTY_ORDER;
  if (layoutKey === 'propertyShowcase') return PROPERTY_ORDER;
  if (layoutKey === 'actividadEntrenamientoFisicoShowcase') return FITNESS_ORDER;
  if (layoutKey === 'agendaProfesionalesIndependientesShowcase') return INDIE_PROS_ORDER;
  return DEFAULT_ORDER;
}

function SectionGroup({ 
  sections, 
  order, 
  hideHero, 
  hideHighlight, 
  hideLocation 
}: { 
  sections: PublicLayoutSections; 
  order: SectionKey[]; 
  hideHero?: boolean;
  hideHighlight?: boolean;
  hideLocation?: boolean;
}) {
  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
      {order.map((key) => {
        if (hideHero && key === 'hero') return null;
        if (hideHighlight && key === 'highlight') return null;
        if (hideLocation && key === 'location') return null;
        const content = sections[key];
        if (!content) return null;
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
  theme,
}: PublicLayoutProps) {
  const order = resolveOrder(layoutKey);
  const heroBlock = sections.hero;
  const highlightBlock = sections.highlight;
  const locationBlock = sections.location;

  const heroPadding =
    variant === 'compact'
      ? 'p-5 sm:p-7 lg:p-8'
      : 'p-5 sm:p-8 lg:p-10';

  /* Estilos del hero según variante, usando theme para respetar apariencia de categoría */
  const heroStyle = (() => {
    const cardBg = theme?.cardColor || '#ffffff';
    const cardAlpha = withOpacity(cardBg, 0.95);
    const borderAlpha = theme?.titleColor ? withOpacity(theme.titleColor, 0.12) : 'rgba(148, 163, 184, 0.3)';
    if (variant === 'immersive') {
      return {
        background: theme?.buttonColor
          ? `linear-gradient(135deg, ${withOpacity(theme.buttonColor, 0.95)} 0%, ${withOpacity(theme.buttonColor, 0.85)} 50%, ${withOpacity(theme.buttonColor, 0.9)} 100%)`
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: theme?.buttonTextColor || '#ffffff',
        border: `1px solid ${withOpacity(theme?.buttonTextColor || '#fff', 0.2)}`,
      };
    }
    if (variant === 'modern') {
      return {
        background: cardAlpha,
        color: theme?.textColor || '#0f172a',
        border: `1px solid ${borderAlpha}`,
        boxShadow: '0 10px 40px rgba(15,23,42,0.08)',
      };
    }
    if (variant === 'compact' || variant === 'minimal') {
      return {
        background: theme?.bgColor ? withOpacity(theme.bgColor, 0.9) : 'rgba(248, 250, 252, 0.95)',
        color: theme?.textColor || '#0f172a',
        border: `1px solid ${borderAlpha}`,
      };
    }
    return {
      background: theme?.bgColor
        ? `linear-gradient(135deg, ${withOpacity(theme.bgColor, 0.4)} 0%, ${cardAlpha} 50%, ${withOpacity(theme?.buttonColor || '#0ea5e9', 0.08)} 100%)`
        : 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #e0f2fe 100%)',
      color: theme?.textColor || '#0f172a',
      border: `1px solid ${borderAlpha}`,
    };
  })();

  // Detectar si debemos usar layout de 2 columnas
  const use2ColumnLayout = Boolean(heroBlock && highlightBlock && locationBlock);

  return (
    <div className="space-y-8 sm:space-y-10">
      {use2ColumnLayout ? (
        <>
          {/* Layout de 2 columnas para desktop: hero + highlight (izq) y location (der) */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-8 lg:space-y-0">
            {/* Columna izquierda: Hero + Highlight */}
            <div className="space-y-6 sm:space-y-8">
              {heroBlock &&
                (appearance ? (
                  heroBlock
                ) : (
                  <section
                    className={`relative overflow-hidden rounded-2xl sm:rounded-3xl ${heroPadding} focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 transition-shadow backdrop-blur-sm`}
                    style={{ ...heroStyle, fontFamily: theme?.fontBody }}
                    tabIndex={-1}
                  >
                    {heroBlock}
                  </section>
                ))}
              
              {highlightBlock && (
                <div id="section-highlight" className="perf-section scroll-mt-20">
                  <Fragment>{highlightBlock}</Fragment>
                </div>
              )}
            </div>

            {/* Columna derecha: Location */}
            <div>
              {locationBlock && (
                <div id="section-location" className="perf-section scroll-mt-20">
                  <Fragment>{locationBlock}</Fragment>
                </div>
              )}
            </div>
          </div>

          {/* Resto de secciones (excluyendo hero, highlight y location) */}
          <SectionGroup sections={sections} order={order} hideHero hideHighlight hideLocation />
        </>
      ) : (
        <>
          {/* Layout normal (1 columna) */}
          {heroBlock &&
            (appearance ? (
              heroBlock
            ) : (
              <section
                className={`relative overflow-hidden rounded-2xl sm:rounded-3xl ${heroPadding} focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 transition-shadow backdrop-blur-sm`}
                style={{ ...heroStyle, fontFamily: theme?.fontBody }}
                tabIndex={-1}
              >
                {heroBlock}
              </section>
            ))}

          <SectionGroup sections={sections} order={order} hideHero={Boolean(heroBlock)} />
        </>
      )}

      {sections.contact || contactActions ? (
        <div id="section-contact" className="flex justify-center scroll-mt-20 pt-4">
          {sections.contact ?? contactActions}
        </div>
      ) : null}

      {floatingCta && (
        <div className="fixed bottom-4 inset-x-4 sm:hidden z-40 drop-shadow-xl safe-area-inset-bottom">{floatingCta}</div>
      )}
    </div>
  );
}
