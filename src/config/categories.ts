/**
 * Sistema de categorías (verticales) para empresas
 * Define módulos del dashboard, iconos, temas y configuraciones por vertical
 */

// ==================== TIPOS ====================

export type CategoryGroup =
  | 'SALUD'
  | 'BELLEZA'
  | 'HOGAR'
  | 'AUTOMOTRIZ'
  | 'EDUCACION'
  | 'RETAIL'
  | 'ALIMENTOS'
  | 'TURISMO_EVENTOS'
  | 'MASCOTAS'
  | 'ARTES_OFICIOS'
  | 'OTROS';

export type CategoryId =
  // Salud
  | 'clinicas_odontologicas'
  | 'clinicas_kinesiologicas'
  | 'centros_entrenamiento'
  | 'actividad_entrenamiento_fisico'
  | 'centros_terapia'
  | 'psicologia'
  | 'nutricion'
  | 'masajes_spa'
  // Belleza
  | 'barberias'
  | 'peluquerias'
  | 'centros_estetica'
  | 'unas'
  | 'tatuajes_piercing'
  // Hogar
  | 'aseo_ornato'
  | 'chef_personal'
  | 'asesoria_hogar'
  | 'construccion_mantencion'
  | 'construccion'
  // Automotriz
  | 'taller_vehiculos'
  // Educación
  | 'cursos_capacitaciones'
  // Retail
  | 'minimarket'
  | 'articulos_aseo'
  | 'productos_cuidado_personal'
  | 'ferreteria'
  | 'floreria'
  | 'ropa_accesorios'
  | 'libreria_papeleria'
  | 'tecnologia'
  | 'botillerias'
  // Alimentos
  | 'restaurantes_comida_rapida'
  | 'restaurantes'
  | 'bares'
  | 'foodtruck'
  | 'panaderia_pasteleria'
  // Turismo y Eventos
  | 'centros_eventos'
  | 'deporte_aventura'
  | 'turismo'
  | 'fotografia'
  | 'arriendo_cabanas_casas'
  | 'inmobiliaria_terrenos_casas'
  // Mascotas
  | 'mascotas_veterinarias'
  // Artes y Oficios
  | 'artesania'
  | 'talabarteria'
  | 'taller_artes'
  // Servicios
  | 'agenda_profesionales'
  | 'agenda_profesionales_independientes'
  | 'servicios_legales'
  | 'contabilidad'
  | 'bodegas_logistica'
  | 'agricultura_productores'
  | 'distribuidores'
  | 'otros';

/**
 * Módulos disponibles en el dashboard
 */
export type DashboardModule =
  | 'appointments' // Sistema de citas completo
  | 'appointments-lite' // Citas simplificadas (sin pacientes avanzados)
  | 'patients' // Gestión de pacientes/fichas
  | 'patients-lite' // Fichas básicas
  | 'catalog' // Catálogo de productos/servicios
  | 'orders' // Pedidos/órdenes
  | 'work-orders' // Órdenes de trabajo (talleres)
  | 'work-orders-lite' // Órdenes de trabajo simplificadas
  | 'inventory' // Inventario
  | 'professionals' // Gestión de profesionales
  | 'schedule' // Calendario/agenda
  | 'reports' // Reportes y estadísticas
  | 'notifications' // Notificaciones
  | 'menu-categories' // Categorías del menú (restaurantes)
  | 'menu-qr' // QR para menú digital
  | 'clinic-resources' // Recursos clínicos
  | 'events' // Eventos
  | 'event-reservations' // Reservas de eventos
  | 'properties' // Propiedades
  | 'property-bookings' // Reservas de propiedades
  | 'delivery-routes' // Rutas de reparto (distribuidores)
  | 'collections' // Cobranza (distribuidores)
  | 'geolocation'; // Geolocalización (distribuidores)

/**
 * Packs de iconos disponibles
 */
export type IconPackKey =
  | 'medical' // Iconos médicos/salud
  | 'beauty' // Iconos belleza/spa
  | 'automotive' // Iconos automotriz
  | 'retail' // Iconos retail/tienda
  | 'food' // Iconos comida/restaurante
  | 'education' // Iconos educación
  | 'tourism' // Iconos turismo/eventos
  | 'pets' // Iconos mascotas
  | 'crafts' // Iconos artesanía/oficios
  | 'default'; // Iconos por defecto

/**
 * Configuración de tema por defecto
 */
export interface CategoryTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

/**
 * Configuración completa de una categoría
 */
export interface CategoryConfig {
  id: CategoryId;
  labelKey: string; // Clave i18n para el label
  group: CategoryGroup;
  groupLabelKey: string; // Clave i18n para el grupo
  businessModesAllowed: Array<'SERVICES' | 'PRODUCTS' | 'BOTH'>;
  dashboardModules: DashboardModule[];
  iconPackKey: IconPackKey;
  defaultTheme: CategoryTheme;
}

const CATEGORY_ALIASES: Record<string, CategoryId> = {
  // Alias para mantener compatibilidad con empresas existentes
  construccion_mantencion: 'construccion',
};

// ==================== CONFIGURACIÓN DE CATEGORÍAS ====================

const defaultTheme: CategoryTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const healthTheme: CategoryTheme = {
  primaryColor: '#059669',
  secondaryColor: '#047857',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const beautyTheme: CategoryTheme = {
  primaryColor: '#ec4899',
  secondaryColor: '#db2777',
  accentColor: '#f472b6',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const automotiveTheme: CategoryTheme = {
  primaryColor: '#dc2626',
  secondaryColor: '#b91c1c',
  accentColor: '#ef4444',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const retailTheme: CategoryTheme = {
  primaryColor: '#f59e0b',
  secondaryColor: '#d97706',
  accentColor: '#fbbf24',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const foodTheme: CategoryTheme = {
  primaryColor: '#ea580c',
  secondaryColor: '#c2410c',
  accentColor: '#fb923c',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const educationTheme: CategoryTheme = {
  primaryColor: '#7c3aed',
  secondaryColor: '#6d28d9',
  accentColor: '#a78bfa',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const tourismTheme: CategoryTheme = {
  primaryColor: '#0891b2',
  secondaryColor: '#0e7490',
  accentColor: '#22d3ee',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const petsTheme: CategoryTheme = {
  primaryColor: '#65a30d',
  secondaryColor: '#4d7c0f',
  accentColor: '#84cc16',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const craftsTheme: CategoryTheme = {
  primaryColor: '#92400e',
  secondaryColor: '#78350f',
  accentColor: '#d97706',
  backgroundColor: '#ffffff',
  textColor: '#111827',
};

const constructionBaseConfig = {
  group: 'HOGAR' as CategoryGroup,
  groupLabelKey: 'categories.groups.HOGAR',
  businessModesAllowed: ['SERVICES'] as CategoryConfig['businessModesAllowed'],
  dashboardModules: ['appointments-lite', 'work-orders-lite', 'schedule', 'reports', 'notifications'] as DashboardModule[],
  iconPackKey: 'default' as IconPackKey,
  defaultTheme: defaultTheme,
};

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  // ==================== SALUD ====================
  clinicas_odontologicas: {
    id: 'clinicas_odontologicas',
    labelKey: 'categories.clinicas_odontologicas',
    group: 'SALUD',
    groupLabelKey: 'categories.groups.SALUD',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients', 'schedule', 'professionals', 'reports', 'notifications', 'clinic-resources'],
    iconPackKey: 'medical',
    defaultTheme: healthTheme,
  },
  clinicas_kinesiologicas: {
    id: 'clinicas_kinesiologicas',
    labelKey: 'categories.clinicas_kinesiologicas',
    group: 'SALUD',
    groupLabelKey: 'categories.groups.SALUD',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients', 'schedule', 'professionals', 'reports', 'notifications', 'clinic-resources'],
    iconPackKey: 'medical',
    defaultTheme: healthTheme,
  },
  centros_entrenamiento: {
    id: 'centros_entrenamiento',
    labelKey: 'categories.centros_entrenamiento',
    group: 'SALUD',
    groupLabelKey: 'categories.groups.SALUD',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'medical',
    defaultTheme: healthTheme,
  },
  actividad_entrenamiento_fisico: {
    id: 'actividad_entrenamiento_fisico',
    labelKey: 'categories.actividad_entrenamiento_fisico',
    group: 'SALUD',
    groupLabelKey: 'categories.groups.SALUD',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'medical',
    defaultTheme: healthTheme,
  },
  centros_terapia: {
    id: 'centros_terapia',
    labelKey: 'categories.centros_terapia',
    group: 'SALUD',
    groupLabelKey: 'categories.groups.SALUD',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients', 'schedule', 'professionals', 'reports', 'notifications', 'clinic-resources'],
    iconPackKey: 'medical',
    defaultTheme: healthTheme,
  },
  psicologia: {
    id: 'psicologia',
    labelKey: 'categories.psicologia',
    group: 'SALUD',
    groupLabelKey: 'categories.groups.SALUD',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'medical',
    defaultTheme: healthTheme,
  },
  nutricion: {
    id: 'nutricion',
    labelKey: 'categories.nutricion',
    group: 'SALUD',
    groupLabelKey: 'categories.groups.SALUD',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'medical',
    defaultTheme: healthTheme,
  },
  masajes_spa: {
    id: 'masajes_spa',
    labelKey: 'categories.masajes_spa',
    group: 'BELLEZA',
    groupLabelKey: 'categories.groups.BELLEZA',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'beauty',
    defaultTheme: beautyTheme,
  },

  // ==================== BELLEZA ====================
  barberias: {
    id: 'barberias',
    labelKey: 'categories.barberias',
    group: 'BELLEZA',
    groupLabelKey: 'categories.groups.BELLEZA',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'beauty',
    defaultTheme: beautyTheme,
  },
  peluquerias: {
    id: 'peluquerias',
    labelKey: 'categories.peluquerias',
    group: 'BELLEZA',
    groupLabelKey: 'categories.groups.BELLEZA',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'beauty',
    defaultTheme: beautyTheme,
  },
  centros_estetica: {
    id: 'centros_estetica',
    labelKey: 'categories.centros_estetica',
    group: 'BELLEZA',
    groupLabelKey: 'categories.groups.BELLEZA',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'beauty',
    defaultTheme: beautyTheme,
  },
  unas: {
    id: 'unas',
    labelKey: 'categories.unas',
    group: 'BELLEZA',
    groupLabelKey: 'categories.groups.BELLEZA',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'beauty',
    defaultTheme: beautyTheme,
  },
  tatuajes_piercing: {
    id: 'tatuajes_piercing',
    labelKey: 'categories.tatuajes_piercing',
    group: 'BELLEZA',
    groupLabelKey: 'categories.groups.BELLEZA',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'beauty',
    defaultTheme: beautyTheme,
  },

  // ==================== HOGAR ====================
  aseo_ornato: {
    id: 'aseo_ornato',
    labelKey: 'categories.aseo_ornato',
    group: 'HOGAR',
    groupLabelKey: 'categories.groups.HOGAR',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },
  chef_personal: {
    id: 'chef_personal',
    labelKey: 'categories.chef_personal',
    group: 'HOGAR',
    groupLabelKey: 'categories.groups.HOGAR',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'food',
    defaultTheme: foodTheme,
  },
  asesoria_hogar: {
    id: 'asesoria_hogar',
    labelKey: 'categories.asesoria_hogar',
    group: 'HOGAR',
    groupLabelKey: 'categories.groups.HOGAR',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },
  construccion_mantencion: {
    id: 'construccion_mantencion',
    labelKey: 'categories.construccion_mantencion',
    ...constructionBaseConfig,
  },
  construccion: {
    id: 'construccion',
    labelKey: 'categories.construccion',
    ...constructionBaseConfig,
  },
  inmobiliaria_terrenos_casas: {
    id: 'inmobiliaria_terrenos_casas',
    labelKey: 'categories.inmobiliaria_terrenos_casas',
    group: 'HOGAR',
    groupLabelKey: 'categories.groups.HOGAR',
    businessModesAllowed: ['BOTH'],
    dashboardModules: ['properties', 'property-bookings', 'appointments-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },

  // ==================== AUTOMOTRIZ ====================
  taller_vehiculos: {
    id: 'taller_vehiculos',
    labelKey: 'categories.taller_vehiculos',
    group: 'AUTOMOTRIZ',
    groupLabelKey: 'categories.groups.AUTOMOTRIZ',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'work-orders-lite', 'schedule', 'reports', 'notifications'],
    // Nota: work-orders-lite porque el módulo completo aún no existe
    iconPackKey: 'automotive',
    defaultTheme: automotiveTheme,
  },

  // ==================== EDUCACIÓN ====================
  cursos_capacitaciones: {
    id: 'cursos_capacitaciones',
    labelKey: 'categories.cursos_capacitaciones',
    group: 'EDUCACION',
    groupLabelKey: 'categories.groups.EDUCACION',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'education',
    defaultTheme: educationTheme,
  },

  // ==================== RETAIL ====================
  minimarket: {
    id: 'minimarket',
    labelKey: 'categories.minimarket',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },
  articulos_aseo: {
    id: 'articulos_aseo',
    labelKey: 'categories.articulos_aseo',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },
  productos_cuidado_personal: {
    id: 'productos_cuidado_personal',
    labelKey: 'categories.productos_cuidado_personal',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },
  ferreteria: {
    id: 'ferreteria',
    labelKey: 'categories.ferreteria',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },
  floreria: {
    id: 'floreria',
    labelKey: 'categories.floreria',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },
  ropa_accesorios: {
    id: 'ropa_accesorios',
    labelKey: 'categories.ropa_accesorios',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },
  libreria_papeleria: {
    id: 'libreria_papeleria',
    labelKey: 'categories.libreria_papeleria',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },
  tecnologia: {
    id: 'tecnologia',
    labelKey: 'categories.tecnologia',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },
  botillerias: {
    id: 'botillerias',
    labelKey: 'categories.botillerias',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },

  // ==================== ALIMENTOS ====================
  restaurantes_comida_rapida: {
    id: 'restaurantes_comida_rapida',
    labelKey: 'categories.restaurantes_comida_rapida',
    group: 'ALIMENTOS',
    groupLabelKey: 'categories.groups.ALIMENTOS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications', 'menu-categories', 'menu-qr'],
    iconPackKey: 'food',
    defaultTheme: foodTheme,
  },
  // Duplicado de "Restaurantes y Comida Rápida" dividido en 3 categorías
  restaurantes: {
    id: 'restaurantes',
    labelKey: 'categories.restaurantes',
    group: 'ALIMENTOS',
    groupLabelKey: 'categories.groups.ALIMENTOS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications', 'menu-categories', 'menu-qr'],
    iconPackKey: 'food',
    defaultTheme: beautyTheme,
  },
  bares: {
    id: 'bares',
    labelKey: 'categories.bares',
    group: 'ALIMENTOS',
    groupLabelKey: 'categories.groups.ALIMENTOS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications', 'menu-categories', 'menu-qr'],
    iconPackKey: 'food',
    defaultTheme: beautyTheme,
  },
  foodtruck: {
    id: 'foodtruck',
    labelKey: 'categories.foodtruck',
    group: 'ALIMENTOS',
    groupLabelKey: 'categories.groups.ALIMENTOS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications', 'menu-categories', 'menu-qr'],
    iconPackKey: 'food',
    defaultTheme: beautyTheme,
  },
  panaderia_pasteleria: {
    id: 'panaderia_pasteleria',
    labelKey: 'categories.panaderia_pasteleria',
    group: 'ALIMENTOS',
    groupLabelKey: 'categories.groups.ALIMENTOS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'food',
    defaultTheme: foodTheme,
  },

  // ==================== TURISMO Y EVENTOS ====================
  centros_eventos: {
    id: 'centros_eventos',
    labelKey: 'categories.centros_eventos',
    group: 'TURISMO_EVENTOS',
    groupLabelKey: 'categories.groups.TURISMO_EVENTOS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['events', 'event-reservations', 'reports', 'notifications'],
    iconPackKey: 'tourism',
    defaultTheme: tourismTheme,
  },
  deporte_aventura: {
    id: 'deporte_aventura',
    labelKey: 'categories.deporte_aventura',
    group: 'TURISMO_EVENTOS',
    groupLabelKey: 'categories.groups.TURISMO_EVENTOS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'tourism',
    defaultTheme: tourismTheme,
  },
  turismo: {
    id: 'turismo',
    labelKey: 'categories.turismo',
    group: 'TURISMO_EVENTOS',
    groupLabelKey: 'categories.groups.TURISMO_EVENTOS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'tourism',
    defaultTheme: tourismTheme,
  },
  fotografia: {
    id: 'fotografia',
    labelKey: 'categories.fotografia',
    group: 'TURISMO_EVENTOS',
    groupLabelKey: 'categories.groups.TURISMO_EVENTOS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'tourism',
    defaultTheme: tourismTheme,
  },
  arriendo_cabanas_casas: {
    id: 'arriendo_cabanas_casas',
    labelKey: 'categories.arriendo_cabanas_casas',
    group: 'TURISMO_EVENTOS',
    groupLabelKey: 'categories.groups.TURISMO_EVENTOS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['properties', 'property-bookings', 'reports', 'notifications'],
    iconPackKey: 'tourism',
    defaultTheme: tourismTheme,
  },

  // ==================== MASCOTAS ====================
  mascotas_veterinarias: {
    id: 'mascotas_veterinarias',
    labelKey: 'categories.mascotas_veterinarias',
    group: 'MASCOTAS',
    groupLabelKey: 'categories.groups.MASCOTAS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'pets',
    defaultTheme: petsTheme,
  },

  // ==================== ARTES Y OFICIOS ====================
  artesania: {
    id: 'artesania',
    labelKey: 'categories.artesania',
    group: 'ARTES_OFICIOS',
    groupLabelKey: 'categories.groups.ARTES_OFICIOS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'reports', 'notifications'],
    iconPackKey: 'crafts',
    defaultTheme: craftsTheme,
  },
  talabarteria: {
    id: 'talabarteria',
    labelKey: 'categories.talabarteria',
    group: 'ARTES_OFICIOS',
    groupLabelKey: 'categories.groups.ARTES_OFICIOS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'reports', 'notifications'],
    iconPackKey: 'crafts',
    defaultTheme: craftsTheme,
  },
  taller_artes: {
    id: 'taller_artes',
    labelKey: 'categories.taller_artes',
    group: 'ARTES_OFICIOS',
    groupLabelKey: 'categories.groups.ARTES_OFICIOS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'reports', 'notifications'],
    iconPackKey: 'crafts',
    defaultTheme: craftsTheme,
  },

  // ==================== SERVICIOS PROFESIONALES ====================
  agenda_profesionales: {
    id: 'agenda_profesionales',
    labelKey: 'categories.agenda_profesionales',
    group: 'BELLEZA',
    groupLabelKey: 'categories.groups.BELLEZA',
    businessModesAllowed: ['SERVICES'],
    // Duplicado de Barberías: misma estructura de agenda + profesionales + reportes.
    dashboardModules: ['appointments-lite', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'],
    iconPackKey: 'beauty',
    defaultTheme: beautyTheme,
  },
  agenda_profesionales_independientes: {
    id: 'agenda_profesionales_independientes',
    labelKey: 'categories.agenda_profesionales_independientes',
    group: 'OTROS',
    groupLabelKey: 'categories.groups.OTROS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },
  servicios_legales: {
    id: 'servicios_legales',
    labelKey: 'categories.servicios_legales',
    group: 'OTROS',
    groupLabelKey: 'categories.groups.OTROS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },
  contabilidad: {
    id: 'contabilidad',
    labelKey: 'categories.contabilidad',
    group: 'OTROS',
    groupLabelKey: 'categories.groups.OTROS',
    businessModesAllowed: ['SERVICES'],
    dashboardModules: ['appointments', 'patients-lite', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },
  bodegas_logistica: {
    id: 'bodegas_logistica',
    labelKey: 'categories.bodegas_logistica',
    group: 'OTROS',
    groupLabelKey: 'categories.groups.OTROS',
    businessModesAllowed: ['PRODUCTS'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },
  agricultura_productores: {
    id: 'agricultura_productores',
    labelKey: 'categories.agricultura_productores',
    group: 'OTROS',
    groupLabelKey: 'categories.groups.OTROS',
    businessModesAllowed: ['PRODUCTS', 'BOTH'],
    dashboardModules: ['catalog', 'orders', 'inventory', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },
  distribuidores: {
    id: 'distribuidores',
    labelKey: 'categories.distribuidores',
    group: 'RETAIL',
    groupLabelKey: 'categories.groups.RETAIL',
    businessModesAllowed: ['PRODUCTS'],
    dashboardModules: ['catalog', 'orders', 'delivery-routes', 'collections', 'geolocation', 'reports', 'notifications'],
    iconPackKey: 'retail',
    defaultTheme: retailTheme,
  },

  // ==================== OTROS ====================
  otros: {
    id: 'otros',
    labelKey: 'categories.otros',
    group: 'OTROS',
    groupLabelKey: 'categories.groups.OTROS',
    businessModesAllowed: ['SERVICES', 'PRODUCTS', 'BOTH'],
    dashboardModules: ['appointments', 'catalog', 'orders', 'schedule', 'reports', 'notifications'],
    iconPackKey: 'default',
    defaultTheme: defaultTheme,
  },
};

// ==================== FUNCIONES UTILITARIAS ====================

/**
 * Obtiene la configuración de una categoría por su ID
 * @param categoryId - ID de la categoría
 * @returns Configuración de la categoría o configuración por defecto (OTROS)
 */
export function getCategoryConfig(categoryId: CategoryId | string | null | undefined): CategoryConfig {
  if (!categoryId || typeof categoryId !== 'string') {
    return CATEGORIES.otros;
  }

  const normalizedId = normalizeCategoryId(categoryId);
  if (!normalizedId) {
    console.warn(`[categories] Categoría desconocida: ${categoryId}, usando OTROS`);
    return CATEGORIES.otros;
  }

  return CATEGORIES[normalizedId];
}

/**
 * Obtiene todas las categorías de un grupo específico
 * @param group - Grupo de categorías
 * @returns Array de configuraciones de categorías
 */
export function getCategoriesByGroup(group: CategoryGroup): CategoryConfig[] {
  return Object.values(CATEGORIES).filter((cat) => cat.group === group);
}

/**
 * Obtiene todas las categorías disponibles
 * @returns Array de todas las configuraciones de categorías
 */
export function getAllCategories(): CategoryConfig[] {
  return Object.values(CATEGORIES);
}

/**
 * Verifica si un módulo está habilitado para una categoría
 * @param categoryId - ID de la categoría
 * @param module - Módulo a verificar
 * @returns true si el módulo está habilitado
 */
export function isModuleEnabled(categoryId: CategoryId | string | null | undefined, module: DashboardModule): boolean {
  const config = getCategoryConfig(categoryId);
  return config.dashboardModules.includes(module);
}

/**
 * Valida si un categoryId es conocido (considerando alias)
 * @param categoryId - ID de la categoría (o alias) a validar
 */
export function isValidCategoryId(categoryId: string | null | undefined): categoryId is CategoryId {
  if (!categoryId || typeof categoryId !== 'string') {
    return false;
  }

  return Boolean(normalizeCategoryId(categoryId));
}

/**
 * Resuelve el category_id de una empresa con fallback seguro
 * Maneja diferentes nombres de campo (category_id, categoryId) y valida que exista
 * @param company - Objeto de empresa (puede ser Company o cualquier objeto con category_id/categoryId)
 * @returns CategoryId válido, siempre retorna 'otros' como fallback
 */
export function resolveCategoryId(company: { category_id?: string | null; categoryId?: string | null } | null | undefined): CategoryId {
  if (!company) {
    return 'otros';
  }

  // Intentar obtener category_id o categoryId (soporta ambos nombres)
  const rawId = company.category_id ?? company.categoryId ?? null;

  if (!rawId || typeof rawId !== 'string') {
    return 'otros';
  }

  // Resolver alias y validar existencia
  const normalizedId = normalizeCategoryId(rawId);
  if (normalizedId) {
    return normalizedId;
  }

  // Si el ID no existe, usar fallback
  console.warn(`[categories] Categoría desconocida: ${rawId}, usando OTROS`);
  return 'otros';
}

/**
 * Obtiene el tema (colores) de una categoría
 * @param categoryId - ID de la categoría
 * @returns Objeto con colores primario, secundario y acento
 */
export function getCategoryTheme(categoryId: CategoryId | string | null | undefined): {
  primary: string;
  secondary: string;
  accent: string;
} {
  const config = getCategoryConfig(categoryId);
  return {
    primary: config.defaultTheme.primaryColor,
    secondary: config.defaultTheme.secondaryColor,
    accent: config.defaultTheme.accentColor,
  };
}

function normalizeCategoryId(rawId: string): CategoryId | null {
  const alias = CATEGORY_ALIASES[rawId];
  if (alias) {
    return alias;
  }

  if (rawId in CATEGORIES) {
    return rawId as CategoryId;
  }

  return null;
}
