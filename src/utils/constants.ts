export type SubscriptionPlan = 'BASIC' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export const DEFAULT_FUNCTIONS_REGION = 'us-central1';

export const DEFAULT_IMAGE_UPLOAD_CONFIG = {
  width: 1200,
  height: 800,
  maxSizeKB: 1000,
  format: 'image/jpeg',
  quality: 0.9,
} as const;

export const IMAGE_UPLOAD_RECOMMENDATION = `Recomendado: ${DEFAULT_IMAGE_UPLOAD_CONFIG.width}x${DEFAULT_IMAGE_UPLOAD_CONFIG.height} px, formato JPG o PNG, máx ~${Math.round(DEFAULT_IMAGE_UPLOAD_CONFIG.maxSizeKB / 1000)}MB.`;

export const TIME_INPUT_STEP_SECONDS = 300;

const PRO_FALLBACK_PLAN: SubscriptionPlan = 'PRO';

// NOTA: Límites deshabilitados temporalmente hasta implementar sistema de cobro
// Todos los planes tienen límites ilimitados (Infinity)
export const SUBSCRIPTION_PLAN_LIMITS = {
  products: {
    BASIC: 5,
    STARTER: 40,
    PRO: Infinity,
    BUSINESS: Infinity,
    ENTERPRISE: Infinity,
  },
  services: {
    BASIC: 5,
    STARTER: 40,
    PRO: Infinity,
    BUSINESS: Infinity,
    ENTERPRISE: Infinity,
  },
  serviceSchedules: {
    BASIC: 5,
    STARTER: 40,
    PRO: Infinity,
    BUSINESS: Infinity,
    ENTERPRISE: Infinity,
  },
  professionals: {
    BASIC: 1,
    STARTER: 6,
    PRO: 10,
    BUSINESS: 30,
    ENTERPRISE: 60,
  },
} as const satisfies Record<string, Record<SubscriptionPlan, number>>;

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  BASIC: 'Basic',
  STARTER: 'Starter',
  PRO: 'Pro',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

export const getSubscriptionLimit = <T extends keyof typeof SUBSCRIPTION_PLAN_LIMITS>(
  resource: T,
  plan?: SubscriptionPlan,
): number => {
  const limits = SUBSCRIPTION_PLAN_LIMITS[resource];
  return limits[plan ?? PRO_FALLBACK_PLAN] ?? limits[PRO_FALLBACK_PLAN];
};

export const getPlanLabel = (plan?: SubscriptionPlan): string =>
  SUBSCRIPTION_PLAN_LABELS[plan ?? PRO_FALLBACK_PLAN] ?? SUBSCRIPTION_PLAN_LABELS[PRO_FALLBACK_PLAN];

// Plan details with descriptions and features
export interface PlanDetails {
  name: string;
  description: string;
  price: string;
  features: string[];
  limits: {
    professionals: number;
    services: number;
    products: number;
    serviceSchedules: number;
  };
  recommended?: boolean;
}

export const SUBSCRIPTION_PLANS_DETAILS: Record<SubscriptionPlan, PlanDetails> = {
  BASIC: {
    name: 'Basic',
    description: 'Plan esencial para comenzar con tu negocio',
    price: '$0',
    features: [
      '1 profesional',
      'Hasta 5 servicios o productos',
      '5 horarios de servicio',
      'Página pública personalizada',
      'Integración con WhatsApp',
    ],
    limits: {
      professionals: 1,
      services: 5,
      products: 5,
      serviceSchedules: 5,
    },
  },
  STARTER: {
    name: 'Starter',
    description: 'Sistema de gestión sencillo para crecer',
    price: '$27.900/mes',
    features: [
      'Hasta 6 profesionales',
      'Hasta 40 servicios',
      'Hasta 40 productos',
      '40 horarios de servicio',
      'Todas las funciones de Basic',
      'Soporte prioritario',
    ],
    limits: {
      professionals: 6,
      services: 40,
      products: 40,
      serviceSchedules: 40,
    },
    recommended: true,
  },
  PRO: {
    name: 'Pro',
    description: 'Gestión empresarial pro con automatizaciones',
    price: '$69.800/mes',
    features: [
      'Hasta 10 profesionales',
      'Servicios ilimitados',
      'Productos ilimitados',
      'Horarios ilimitados',
      'Todas las funciones de Starter',
      'Soporte premium 24/7',
      'Análisis avanzados',
    ],
    limits: {
      professionals: 10,
      services: Infinity,
      products: Infinity,
      serviceSchedules: Infinity,
    },
  },
  BUSINESS: {
    name: 'Business',
    description: 'E-commerce y operaciones avanzadas para expansión',
    price: '$247.900/mes',
    features: [
      'Hasta 30 profesionales',
      'Servicios ilimitados',
      'Productos ilimitados',
      'Horarios ilimitados',
      'Todas las funciones de Pro',
    ],
    limits: {
      professionals: 30,
      services: Infinity,
      products: Infinity,
      serviceSchedules: Infinity,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Consultoría y desarrollo a medida',
    price: 'Personalizado',
    features: [
      'Hasta 60 profesionales',
      'Servicios ilimitados',
      'Productos ilimitados',
      'Horarios ilimitados',
      'Todas las funciones de Business',
    ],
    limits: {
      professionals: 60,
      services: Infinity,
      products: Infinity,
      serviceSchedules: Infinity,
    },
  },
};
