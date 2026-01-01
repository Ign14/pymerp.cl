export type SubscriptionPlan = 'BASIC' | 'STANDARD' | 'PRO' | 'APPROVED25';

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
    BASIC: Infinity,
    STANDARD: Infinity,
    PRO: Infinity,
    APPROVED25: Infinity,
  },
  services: {
    BASIC: Infinity,
    STANDARD: Infinity,
    PRO: Infinity,
    APPROVED25: Infinity,
  },
  serviceSchedules: {
    BASIC: Infinity,
    STANDARD: Infinity,
    PRO: Infinity,
    APPROVED25: Infinity,
  },
  professionals: {
    BASIC: Infinity,
    STANDARD: Infinity,
    PRO: Infinity,
    APPROVED25: Infinity,
  },
} as const satisfies Record<string, Record<SubscriptionPlan, number>>;

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  BASIC: 'Basic',
  STANDARD: 'Standard',
  PRO: 'Pro',
  APPROVED25: 'Approved 25',
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
    description: 'Ideal para emprendedores individuales',
    price: 'Gratis',
    features: [
      '1 profesional',
      'Hasta 3 servicios o productos',
      '5 horarios de servicio',
      'Página pública personalizada',
      'Integración con WhatsApp',
    ],
    limits: {
      professionals: 1,
      services: 3,
      products: 3,
      serviceSchedules: 5,
    },
  },
  STANDARD: {
    name: 'Standard',
    description: 'Para pequeños equipos en crecimiento',
    price: '$9.990/mes',
    features: [
      'Hasta 5 profesionales',
      'Hasta 10 servicios',
      'Hasta 15 productos',
      '15 horarios de servicio',
      'Todas las funciones de Basic',
      'Soporte prioritario',
    ],
    limits: {
      professionals: 5,
      services: 10,
      products: 15,
      serviceSchedules: 15,
    },
    recommended: true,
  },
  PRO: {
    name: 'Pro',
    description: 'Sin límites para empresas establecidas',
    price: '$29.990/mes',
    features: [
      'Hasta 60 profesionales',
      'Servicios ilimitados',
      'Productos ilimitados',
      'Horarios ilimitados',
      'Todas las funciones de Standard',
      'Soporte premium 24/7',
      'Análisis avanzados',
    ],
    limits: {
      professionals: 60,
      services: Infinity,
      products: Infinity,
      serviceSchedules: Infinity,
    },
  },
  APPROVED25: {
    name: 'Approved 25',
    description: 'Plan especial para usuarios aprobados',
    price: 'Personalizado',
    features: [
      'Hasta 10 profesionales',
      'Hasta 25 servicios',
      'Hasta 25 productos',
      'Horarios ilimitados',
      'Todas las funciones incluidas',
    ],
    limits: {
      professionals: 10,
      services: 25,
      products: 25,
      serviceSchedules: Infinity,
    },
  },
};
