import { resolveCategoryId, type CategoryId } from '../config/categories';
import { BusinessType, type Company, type PublicLayoutVariantChoice } from '../types';

export type PublicLayoutKey =
  | 'default'
  | 'servicesShowcase'
  | 'productsShowcase'
  | 'beautyShowcase'
  | 'propertyShowcase'
  | 'barberiasShowcase'
  | 'agendaProfesionalesShowcase'
  | 'agendaProfesionalesIndependientesShowcase'
  | 'actividadEntrenamientoFisicoShowcase'
  | 'restaurantesComidaRapidaShowcase'
  | 'minimarketShowcase'
  | 'inmobiliariaTerrenosCasasShowcase'
  | 'construccionShowcase'
  | 'productosCuidadoPersonalShowcase';
export type PublicLayoutVariant = PublicLayoutVariantChoice;

const CATEGORY_PUBLIC_LAYOUT_MAP: Partial<Record<CategoryId, PublicLayoutKey>> = {
  barberias: 'barberiasShowcase',
  agenda_profesionales: 'barberiasShowcase',
  peluquerias: 'barberiasShowcase',
  centros_estetica: 'beautyShowcase',
  unas: 'barberiasShowcase',
  tatuajes_piercing: 'beautyShowcase',
  masajes_spa: 'barberiasShowcase',
  clinicas_odontologicas: 'servicesShowcase',
  clinicas_kinesiologicas: 'servicesShowcase',
  centros_entrenamiento: 'servicesShowcase',
  agenda_profesionales_independientes: 'agendaProfesionalesIndependientesShowcase',
  actividad_entrenamiento_fisico: 'actividadEntrenamientoFisicoShowcase',
  centros_terapia: 'servicesShowcase',
  psicologia: 'servicesShowcase',
  nutricion: 'servicesShowcase',
  cursos_capacitaciones: 'servicesShowcase',
  servicios_legales: 'servicesShowcase',
  contabilidad: 'servicesShowcase',
  bodegas_logistica: 'servicesShowcase',
  taller_vehiculos: 'servicesShowcase',
  minimarket: 'minimarketShowcase',
  // Distribuidores: usar el mismo layout público de Minimarket (dashboard intacto).
  distribuidores: 'minimarketShowcase',
  articulos_aseo: 'productsShowcase',
  productos_cuidado_personal: 'productosCuidadoPersonalShowcase',
  ferreteria: 'productsShowcase',
  floreria: 'productsShowcase',
  ropa_accesorios: 'productsShowcase',
  libreria_papeleria: 'productsShowcase',
  tecnologia: 'productsShowcase',
  botillerias: 'productsShowcase',
  restaurantes_comida_rapida: 'restaurantesComidaRapidaShowcase',
  restaurantes: 'barberiasShowcase',
  bares: 'barberiasShowcase',
  foodtruck: 'barberiasShowcase',
  panaderia_pasteleria: 'productsShowcase',
  turismo: 'servicesShowcase',
  deporte_aventura: 'servicesShowcase',
  fotografia: 'servicesShowcase',
  arriendo_cabanas_casas: 'propertyShowcase',
  inmobiliaria_terrenos_casas: 'inmobiliariaTerrenosCasasShowcase',
  centros_eventos: 'propertyShowcase',
  construccion: 'construccionShowcase',
  construccion_mantencion: 'construccionShowcase',
};

const LAYOUT_KEYS: PublicLayoutKey[] = [
  'default',
  'servicesShowcase',
  'productsShowcase',
  'beautyShowcase',
  'propertyShowcase',
  'barberiasShowcase',
  'agendaProfesionalesShowcase',
  'agendaProfesionalesIndependientesShowcase',
  'actividadEntrenamientoFisicoShowcase',
  'restaurantesComidaRapidaShowcase',
  'minimarketShowcase',
  'inmobiliariaTerrenosCasasShowcase',
  'construccionShowcase',
  'productosCuidadoPersonalShowcase',
];
const LAYOUT_VARIANTS: PublicLayoutVariant[] = ['classic', 'modern', 'compact', 'immersive', 'minimal'];

const CATEGORY_VARIANT_MAP: Partial<Record<CategoryId, PublicLayoutVariant>> = {
  barberias: 'modern',
  agenda_profesionales: 'modern',
  peluquerias: 'modern',
  centros_estetica: 'modern',
  unas: 'modern',
  tatuajes_piercing: 'modern',
  restaurantes_comida_rapida: 'classic',
  restaurantes: 'classic',
  bares: 'classic',
  foodtruck: 'classic',
  panaderia_pasteleria: 'classic',
  arriendo_cabanas_casas: 'compact',
  inmobiliaria_terrenos_casas: 'compact',
  centros_eventos: 'immersive',
  deporte_aventura: 'immersive',
  fotografia: 'modern',
  construccion: 'modern',
  construccion_mantencion: 'modern',
  actividad_entrenamiento_fisico: 'modern',
  agenda_profesionales_independientes: 'modern',
  masajes_spa: 'modern',
};

function normalizeLayoutKey(raw: unknown): PublicLayoutKey | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  const match = LAYOUT_KEYS.find((key) => key.toLowerCase() === normalized);
  return match ?? null;
}

function normalizeLayoutVariant(raw: unknown): PublicLayoutVariant | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  const match = LAYOUT_VARIANTS.find((variant) => variant.toLowerCase() === normalized);
  return match ?? null;
}

function getLayoutOverride(company: Company | null | undefined): PublicLayoutKey | null {
  const candidate =
    (company as any)?.public_layout_key ??
    (company as any)?.public_layout_template ??
    (company as any)?.publicLayoutTemplate ??
    (company as any)?.public_layout_variant ??
    (company as any)?.publicLayoutVariant;
  return normalizeLayoutKey(candidate);
}

function getVariantOverride(company: Company | null | undefined): PublicLayoutVariant | null {
  if (!company) return null;
  
  const candidate =
    (company as any)?.public_layout_variant ??
    (company as any)?.public_layout_style ??
    (company as any)?.publicLayoutStyle ??
    (company as any)?.public_layout_variant_extra;

  // Si el candidato está vacío, null, o undefined, retornar null
  if (!candidate || (typeof candidate === 'string' && candidate.trim() === '')) {
    return null;
  }

  // If the selected value actually matches a layout key, ignore it for variant purposes
  if (normalizeLayoutKey(candidate)) {
    return null;
  }

  const normalized = normalizeLayoutVariant(candidate);
  
  // Validar que el variant normalizado es válido
  if (!normalized || !LAYOUT_VARIANTS.includes(normalized)) {
    return null;
  }

  return normalized;
}

export interface ResolvedPublicLayout {
  key: PublicLayoutKey;
  variant: PublicLayoutVariant;
  source: 'override' | 'category' | 'businessType' | 'fallback';
  variantSource?: 'company' | 'category' | 'fallback';
  categoryId?: CategoryId | null;
  override?: string | null;
}

/**
 * Resuelve la variante de layout público a usar para una empresa.
 * IMPORTANTE: No depende del slug; usa SOLO category_id + public_layout_variant.
 * El slug solo se usa para resolver la company, nunca para determinar el layout.
 * 
 * @param company - La empresa (puede ser null/undefined para fallback seguro)
 * @returns Layout resuelto con fallback robusto a 'default' si falta data
 */
export function resolvePublicLayout(company: Company | null | undefined): ResolvedPublicLayout {
  // Fallback robusto: si no hay company, retornar default
  if (!company) {
    return {
      key: 'default',
      variant: 'classic',
      source: 'fallback',
      variantSource: 'fallback',
      categoryId: null,
      override: null,
    };
  }

  // Resolver category_id de forma segura
  let categoryId: CategoryId | null = null;
  try {
    categoryId = resolveCategoryId(company as any);
  } catch {
    // Si falla resolveCategoryId, usar null (se usará fallback)
    categoryId = null;
  }

  // Obtener variant override de forma segura con validación robusta
  const variantFromCompany = getVariantOverride(company);
  const categoryVariant = categoryId ? (CATEGORY_VARIANT_MAP[categoryId] || null) : null;
  
  // Fallback robusto: validar que el variant resuelto es válido
  let resolvedVariant: PublicLayoutVariant = 'classic';
  if (variantFromCompany && LAYOUT_VARIANTS.includes(variantFromCompany)) {
    resolvedVariant = variantFromCompany;
  } else if (categoryVariant && LAYOUT_VARIANTS.includes(categoryVariant)) {
    resolvedVariant = categoryVariant;
  } else {
    resolvedVariant = 'classic'; // Fallback seguro
  }

  // Intentar obtener layout override
  const override = getLayoutOverride(company);
  if (override) {
    return {
      key: override,
      variant: resolvedVariant,
      source: 'override',
      variantSource: variantFromCompany ? 'company' : categoryVariant ? 'category' : 'fallback',
      override: override,
      categoryId,
    };
  }

  // Intentar obtener layout por categoría
  const categoryLayout = categoryId ? (CATEGORY_PUBLIC_LAYOUT_MAP[categoryId] || null) : null;

  if (categoryLayout) {
    return {
      key: categoryLayout,
      variant: resolvedVariant,
      source: 'category',
      variantSource: variantFromCompany ? 'company' : categoryVariant ? 'category' : 'fallback',
      categoryId,
      override: null,
    };
  }

  // Fallback por business_type si está disponible
  if (company.business_type === BusinessType.PRODUCTS) {
    return {
      key: 'productsShowcase',
      variant: resolvedVariant,
      source: 'businessType',
      variantSource: variantFromCompany ? 'company' : categoryVariant ? 'category' : 'fallback',
      categoryId,
      override: null,
    };
  }

  // Fallback final: default layout
  return {
    key: 'default',
    variant: resolvedVariant,
    source: 'fallback',
    variantSource: variantFromCompany ? 'company' : categoryVariant ? 'category' : 'fallback',
    categoryId,
    override: null,
  };
}

export function resolvePublicLayoutKey(company: Company | null | undefined): PublicLayoutKey {
  return resolvePublicLayout(company).key;
}
