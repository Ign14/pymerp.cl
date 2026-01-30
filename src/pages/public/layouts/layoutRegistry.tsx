import { lazy, Suspense } from 'react';
import type { PublicLayoutKey } from '../../../services/publicPage';
import { PublicLayoutShell } from './PublicLayoutShell';
import type { PublicLayoutProps } from './types';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';

// Lazy-load layouts específicos para mejorar el primer render (code splitting)
const LazyBarberiasPublicLayout = lazy(() =>
  import('../../../components/public/layouts/BarberiasPublicLayout').then((mod) => ({
    default: mod.BarberiasPublicLayout,
  }))
);
const LazyAgendaProfesionalesPublicLayout = lazy(() =>
  import('../../../components/public/layouts/AgendaProfesionalesPublicLayout').then((mod) => ({
    default: mod.AgendaProfesionalesPublicLayout,
  }))
);
const LazyMinimarketPublicLayout = lazy(() =>
  import('../../../components/public/layouts/MinimarketPublicLayout').then((mod) => ({
    default: mod.MinimarketPublicLayout,
  }))
);
const LazyRestaurantesComidaRapidaPublicLayout = lazy(() =>
  import('../../../components/public/layouts/RestaurantesComidaRapidaPublicLayout').then((mod) => ({
    default: mod.RestaurantesComidaRapidaPublicLayout,
  }))
);
const LazyInmobiliariaTerrenosCasasPublicLayout = lazy(() =>
  import('../../../components/public/layouts/InmobiliariaTerrenosCasasPublicLayout').then((mod) => ({
    default: mod.InmobiliariaTerrenosCasasPublicLayout,
  }))
);
const LazyConstruccionPublicLayout = lazy(() =>
  import('../../../components/public/layouts/ConstruccionPublicLayout').then((mod) => ({
    default: mod.ConstruccionPublicLayout,
  }))
);
const LazyActividadEntrenamientoFisicoPublicLayout = lazy(() =>
  import('../../../components/public/layouts/ActividadEntrenamientoFisicoPublicLayout').then((mod) => ({
    default: mod.ActividadEntrenamientoFisicoPublicLayout,
  }))
);
const LazyAgendaProfesionalesIndependientesPublicLayout = lazy(() =>
  import('../../../components/public/layouts/AgendaProfesionalesIndependientesPublicLayout').then((mod) => ({
    default: mod.AgendaProfesionalesIndependientesPublicLayout,
  }))
);
const LazyProductosCuidadoPersonalPublicLayout = lazy(() =>
  import('../../../components/public/layouts/ProductosCuidadoPersonalPublicLayout').then((mod) => ({
    default: mod.ProductosCuidadoPersonalPublicLayout,
  }))
);

type LayoutRenderer = (props: PublicLayoutProps) => JSX.Element;

const defaultRenderer: LayoutRenderer = (props) => <PublicLayoutShell {...props} />;

const servicesRenderer: LayoutRenderer = (props) => {
  const orderedSections = {
    ...props.sections,
    highlight: props.sections.highlight ?? props.sections.services,
  };

  return (
    <PublicLayoutShell
      {...props}
      sections={orderedSections}
    />
  );
};

const productsRenderer: LayoutRenderer = (props) => {
  const orderedSections = {
    ...props.sections,
    highlight: props.sections.highlight ?? props.sections.products,
  };
  return (
    <PublicLayoutShell
      {...props}
      sections={orderedSections}
    />
  );
};

const beautyRenderer: LayoutRenderer = (props) => {
  const orderedSections = {
    ...props.sections,
    highlight: props.sections.highlight ?? props.sections.hero,
  };

  return (
    <PublicLayoutShell
      {...props}
      sections={orderedSections}
    />
  );
};

const propertyRenderer: LayoutRenderer = (props) => {
  const orderedSections = {
    ...props.sections,
    highlight: props.sections.highlight ?? props.sections.properties ?? props.sections.hero,
  };

  return (
    <PublicLayoutShell
      {...props}
      sections={orderedSections}
    />
  );
};

// Wrapper para lazy-loaded layouts con Suspense
const withSuspense = (LazyComponent: React.LazyExoticComponent<LayoutRenderer>): LayoutRenderer => {
  return (props: PublicLayoutProps) => (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

const layoutRegistry: Record<PublicLayoutKey, LayoutRenderer> = {
  default: defaultRenderer,
  servicesShowcase: servicesRenderer,
  productsShowcase: productsRenderer,
  beautyShowcase: beautyRenderer,
  propertyShowcase: propertyRenderer,
  // Layouts específicos con lazy-loading para code splitting
  barberiasShowcase: withSuspense(LazyBarberiasPublicLayout),
  agendaProfesionalesShowcase: withSuspense(LazyAgendaProfesionalesPublicLayout),
  actividadEntrenamientoFisicoShowcase: withSuspense(LazyActividadEntrenamientoFisicoPublicLayout),
  agendaProfesionalesIndependientesShowcase: withSuspense(LazyAgendaProfesionalesIndependientesPublicLayout),
  restaurantesComidaRapidaShowcase: withSuspense(LazyRestaurantesComidaRapidaPublicLayout),
  minimarketShowcase: withSuspense(LazyMinimarketPublicLayout),
  inmobiliariaTerrenosCasasShowcase: withSuspense(LazyInmobiliariaTerrenosCasasPublicLayout),
  construccionShowcase: withSuspense(LazyConstruccionPublicLayout),
  productosCuidadoPersonalShowcase: withSuspense(LazyProductosCuidadoPersonalPublicLayout),
};

/**
 * Obtiene el renderer de layout para una clave dada.
 * Fallback robusto: siempre retorna un renderer válido (default si la clave no existe).
 * 
 * @param layoutKey - Clave del layout (puede ser inválida, se usará default)
 * @returns Renderer de layout (nunca null/undefined)
 */
export function getLayoutRenderer(layoutKey: PublicLayoutKey | string | null | undefined): LayoutRenderer {
  // Validar que layoutKey sea válido
  if (!layoutKey || typeof layoutKey !== 'string') {
    return defaultRenderer;
  }
  
  // Buscar en el registro
  const renderer = layoutRegistry[layoutKey as PublicLayoutKey];
  
  // Fallback a default si no existe
  return renderer ?? defaultRenderer;
}
