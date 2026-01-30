import type { CategoryId } from '../../src/config/categories';

export type DemoProfile = {
  companyName: string;
  tagline: string;
  description: string;
  address: string;
  commune: string;
  region: string;
  whatsapp: string;
  bookingMessage: string;
  serviceExamples?: string[];
  productExamples?: string[];
  menuCategories?: string[];
  propertyTitles?: string[];
  workOrderTypes?: string[];
  specialties?: string[];
  leadIntents?: string[];
};

const PROFILE_PRESETS: Partial<Record<CategoryId, DemoProfile>> = {
  barberias: {
    companyName: 'Barbería Central Demo',
    tagline: 'Cortes clásicos y barbas prolijas',
    description: 'Espacio masculino con barberos expertos en fades, barba y estilo urbano.',
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955551234',
    bookingMessage: 'Hola, quiero agendar un corte de cabello',
    serviceExamples: ['Corte clásico', 'Corte fade moderno', 'Arreglo de barba', 'Afeitado con toalla caliente', 'Perfilado de cejas', 'Corte infantil', 'Coloración parcial', 'Peinado para evento'],
    productExamples: ['Pomada mate', 'Aceite para barba', 'Cera con brillo', 'Shampoo de carbón activo', 'Bálsamo refrescante', 'Aftershave mentolado', 'Peine de madera', 'Tónico capilar'],
    specialties: ['Fades', 'Barbas', 'Color'],
  },
  restaurantes_comida_rapida: {
    companyName: 'Bendito Burger Demo',
    tagline: 'Burgers a la parrilla con ingredientes frescos',
    description: 'Hamburguesas smash, papas crujientes y salsas caseras listas para delivery o retiro.',
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955555678',
    bookingMessage: 'Hola, quiero pedir para hoy',
    menuCategories: ['Burgers', 'Combos', 'Veggie', 'Acompañamientos', 'Bebidas', 'Postres'],
    productExamples: [
      'Smash burger clásica',
      'Doble cheddar',
      'BBQ ahumada',
      'Pollo crispy',
      'Veggie garbanzo',
      'Papas rústicas',
      'Camote frito',
      'Aros de cebolla',
      'Limonada menta',
      'Milkshake vainilla',
      'Cheesecake maracuyá',
      'Combo familiar',
      'Combo oficina',
      'Salsa de la casa',
      'Té frío',
      'Brownie nuez',
    ],
  },
  minimarket: {
    companyName: 'Mini Market Barrio Demo',
    tagline: 'Despensa completa y productos frescos del barrio',
    description: 'Alimentos, abarrotes y frescos listos para tu compra rápida o delivery.',
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955553456',
    bookingMessage: 'Hola, quiero armar un pedido',
    menuCategories: ['Despensa', 'Frescos', 'Bebidas', 'Lácteos', 'Snacks', 'Limpieza'],
    productExamples: [
      'Pan de molde integral',
      'Leche descremada 1L',
      'Yogurt griego',
      'Queso mantecoso',
      'Huevos de campo',
      'Mantequilla con sal',
      'Arroz grano largo',
      'Fideos spaghetti',
      'Porotos negros',
      'Atún en agua',
      'Salsa de tomate',
      'Aceite de oliva',
      'Cereal multigrano',
      'Galletas de avena',
      'Barras de granola',
      'Papitas artesanales',
      'Bebida cola 1.5L',
      'Agua con gas',
      'Jugo natural',
      'Detergente líquido',
      'Lavaloza limón',
      'Cloro gel',
      'Papel higiénico 18x',
      'Toallas de cocina',
    ],
  },
  inmobiliaria_terrenos_casas: {
    companyName: 'Vive Urbano Propiedades Demo',
    tagline: 'Casas y departamentos listos para visitar',
    description: 'Portafolio curado con propiedades luminosas, bien ubicadas y con gestión ágil.',
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955559876',
    bookingMessage: 'Hola, quiero agendar una visita',
    propertyTitles: [
      'Casa familiar en Ñuñoa con patio',
      'Departamento estudio en Providencia',
      'Parcela con vista en Calera de Tango',
      'Loft industrial en Barrio Italia',
      'Casa mediterránea en Chicureo',
      'Departamento 3D2B en La Reina',
      'Casa esquina remodelada en Macul',
      'Terreno urbano en Peñalolén',
      'Casa con quincho en Puente Alto',
      'Departamento con terraza en Vitacura',
      'Casa en condominio en Colina',
      'Departamento dúplex en Santiago Centro',
    ],
    leadIntents: ['visit', 'consult'],
  },
  construccion: {
    companyName: 'Constructora Andes Demo',
    tagline: 'Obras menores, remodelaciones y mantenimiento',
    description: 'Equipo técnico que agenda visitas, genera presupuestos y ejecuta con control de calidad.',
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955557890',
    bookingMessage: 'Hola, necesito una visita técnica',
    serviceExamples: ['Visita técnica', 'Remodelación cocina', 'Ampliación living', 'Mantención eléctrica', 'Pintura interior', 'Impermeabilización', 'Instalación de porcelanato'],
    workOrderTypes: ['Remodelación', 'Obra menor', 'Visita técnica', 'Mantenimiento', 'Cotización estructural'],
    specialties: ['Obras menores', 'Terminaciones', 'Instalaciones'],
  },
  agenda_profesionales_independientes: {
    companyName: 'Consultores Autónomos Demo',
    tagline: 'Agenda de asesorías y sesiones 1 a 1',
    description: 'Profesionales independientes que reservan sesiones online y presenciales.',
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955551212',
    bookingMessage: 'Hola, quiero agendar una sesión',
    serviceExamples: ['Asesoría estratégica', 'Mentoría financiera', 'Sesión de marketing', 'Revisión de CV', 'Coaching ejecutivo', 'Plan de contenidos', 'Reunión de diagnóstico'],
    specialties: ['Negocios', 'Marketing', 'Finanzas'],
  },
  actividad_entrenamiento_fisico: {
    companyName: 'Movimiento Studio Demo',
    tagline: 'Entrenamiento funcional y planes personalizados',
    description: 'Clases grupales, evaluaciones y planes online con agenda visible.',
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955556700',
    bookingMessage: 'Hola, quiero coordinar una clase de prueba',
    serviceExamples: ['Clase funcional', 'HIIT 45', 'Evaluación física', 'Plan fuerza', 'Clase movilidad', 'Entrenamiento personalizado', 'Bootcamp en parque'],
    specialties: ['Funcional', 'HIIT', 'Movilidad'],
  },
  productos_cuidado_personal: {
    companyName: 'Glow Care Demo',
    tagline: 'Cuidado personal y belleza consciente',
    description: 'Catálogo curado de productos para piel, cabello y bienestar diario.',
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955552323',
    bookingMessage: 'Hola, quiero armar un pedido de skincare',
    menuCategories: ['Cabello', 'Rostro', 'Cuerpo', 'Maquillaje', 'Fragancias', 'Packs'],
    productExamples: [
      'Shampoo hidratante',
      'Acondicionador nutritivo',
      'Serum vitamina C',
      'Crema contorno de ojos',
      'Protector solar FPS50',
      'Gel de limpieza suave',
      'Tónico equilibrante',
      'Mascarilla de arcilla',
      'Aceite capilar',
      'Bálsamo labial',
      'Hidratante corporal',
      'Exfoliante café',
      'Perfume floral',
      'Agua micelar',
      'Desodorante natural',
      'Crema manos karité',
      'Roller facial',
      'Set viaje cuidado piel',
    ],
  },
};

const FALLBACK_PRODUCTS = [
  'Producto destacado',
  'Servicio premium',
  'Kit profesional',
  'Plan mensual',
  'Pack ahorro',
  'Suscripción trimestral',
  'Combo familiar',
  'Accesorio esencial',
];

const FALLBACK_SERVICES = [
  'Consulta inicial',
  'Servicio estándar',
  'Servicio avanzado',
  'Revisión en terreno',
  'Soporte mensual',
  'Asesoría express',
  'Implementación guiada',
];

export function getDemoProfile(categoryId: CategoryId): DemoProfile {
  const preset = PROFILE_PRESETS[categoryId];
  if (preset) return preset;

  const readableName = categoryId.replace(/_/g, ' ');

  return {
    companyName: `Demo ${readableName}`,
    tagline: `Servicios y productos de ${readableName}`,
    description: `Empresa demo para la categoría ${readableName}, con catálogo listo para pruebas.`,
    address: 'Av. Principal, Romeral',
    commune: 'Romeral',
    region: 'Maule',
    whatsapp: '56955550000',
    bookingMessage: 'Hola, quiero más información',
    productExamples: FALLBACK_PRODUCTS,
    serviceExamples: FALLBACK_SERVICES,
    specialties: ['Especialidad demo'],
  };
}
