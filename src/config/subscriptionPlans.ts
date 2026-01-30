/**
 * Subscription Plans Configuration
 * 
 * Define los planes de suscripción disponibles y sus límites/features
 */

export type SubscriptionPlan = 'BASIC' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface PlanLimits {
  professionals: number; // 1-60
  services: number;
  products: number;
  serviceSchedules: number;
}

export interface PlanFeatures {
  automaticReminders: boolean;
  exportData: boolean;
  integrations: boolean;
  featuredInDirectory: boolean;
  customDomain: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
}

export interface PlanConfig {
  planId: SubscriptionPlan;
  label: string;
  description: string;
  price: string;
  limits: PlanLimits;
  features: PlanFeatures;
  recommended?: boolean;
}

/**
 * Límites por plan
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  BASIC: {
    professionals: 1,
    services: 5,
    products: 5,
    serviceSchedules: 5,
  },
  STARTER: {
    professionals: 6,
    services: 40,
    products: 40,
    serviceSchedules: 40,
  },
  PRO: {
    professionals: 10,
    services: Infinity,
    products: Infinity,
    serviceSchedules: Infinity,
  },
  BUSINESS: {
    professionals: 30,
    services: Infinity,
    products: Infinity,
    serviceSchedules: Infinity,
  },
  ENTERPRISE: {
    professionals: 60,
    services: Infinity,
    products: Infinity,
    serviceSchedules: Infinity,
  },
};

/**
 * Features por plan
 */
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  BASIC: {
    automaticReminders: false,
    exportData: false,
    integrations: false,
    featuredInDirectory: false,
    customDomain: false,
    advancedAnalytics: false,
    prioritySupport: false,
    whiteLabel: false,
  },
  STARTER: {
    automaticReminders: true,
    exportData: false,
    integrations: false,
    featuredInDirectory: false,
    customDomain: false,
    advancedAnalytics: false,
    prioritySupport: false,
    whiteLabel: false,
  },
  PRO: {
    automaticReminders: true,
    exportData: true,
    integrations: true,
    featuredInDirectory: true,
    customDomain: false,
    advancedAnalytics: true,
    prioritySupport: true,
    whiteLabel: false,
  },
  BUSINESS: {
    automaticReminders: true,
    exportData: true,
    integrations: true,
    featuredInDirectory: true,
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: true,
    whiteLabel: false,
  },
  ENTERPRISE: {
    automaticReminders: true,
    exportData: true,
    integrations: true,
    featuredInDirectory: true,
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: true,
    whiteLabel: true,
  },
};

/**
 * Configuración completa de planes
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  BASIC: {
    planId: 'BASIC',
    label: 'Basic',
    description: 'Plan esencial para comenzar con tu negocio',
    price: '$0',
    limits: PLAN_LIMITS.BASIC,
    features: PLAN_FEATURES.BASIC,
  },
  STARTER: {
    planId: 'STARTER',
    label: 'Starter',
    description: 'Sistema de gestión sencillo para crecer',
    price: '$27.900/mes',
    limits: PLAN_LIMITS.STARTER,
    features: PLAN_FEATURES.STARTER,
    recommended: true,
  },
  PRO: {
    planId: 'PRO',
    label: 'Pro',
    description: 'Gestión empresarial pro con automatizaciones',
    price: '$69.800/mes',
    limits: PLAN_LIMITS.PRO,
    features: PLAN_FEATURES.PRO,
  },
  BUSINESS: {
    planId: 'BUSINESS',
    label: 'Business',
    description: 'E-commerce y operaciones avanzadas para expansión',
    price: '$247.900/mes',
    limits: PLAN_LIMITS.BUSINESS,
    features: PLAN_FEATURES.BUSINESS,
  },
  ENTERPRISE: {
    planId: 'ENTERPRISE',
    label: 'Enterprise',
    description: 'Consultoría y desarrollo a medida',
    price: 'Personalizado',
    limits: PLAN_LIMITS.ENTERPRISE,
    features: PLAN_FEATURES.ENTERPRISE,
  },
};

/**
 * Obtener límites de un plan
 */
export function getPlanLimits(planId: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[planId];
}

/**
 * Obtener features de un plan
 */
export function getPlanFeatures(planId: SubscriptionPlan): PlanFeatures {
  return PLAN_FEATURES[planId];
}

/**
 * Obtener configuración completa de un plan
 */
export function getPlanConfig(planId: SubscriptionPlan): PlanConfig {
  return SUBSCRIPTION_PLANS[planId];
}

/**
 * Obtener todos los planes
 */
export function getAllPlans(): PlanConfig[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Obtener plan recomendado para upgrade
 */
export function getRecommendedUpgrade(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
  const upgradePath: Record<SubscriptionPlan, SubscriptionPlan | null> = {
    BASIC: 'STARTER',
    STARTER: 'PRO',
    PRO: 'BUSINESS',
    BUSINESS: 'ENTERPRISE',
    ENTERPRISE: null,
  };
  return upgradePath[currentPlan];
}

/**
 * Verificar si un plan es upgrade de otro
 */
export function isUpgrade(fromPlan: SubscriptionPlan, toPlan: SubscriptionPlan): boolean {
  const planOrder: Record<SubscriptionPlan, number> = {
    BASIC: 1,
    STARTER: 2,
    PRO: 3,
    BUSINESS: 4,
    ENTERPRISE: 5,
  };
  return planOrder[toPlan] > planOrder[fromPlan];
}

/**
 * Obtener límite de un recurso específico para un plan
 */
export function getResourceLimit(
  planId: SubscriptionPlan,
  resource: keyof PlanLimits
): number {
  return PLAN_LIMITS[planId][resource];
}

/**
 * Verificar si un plan tiene una feature específica
 */
export function hasFeature(
  planId: SubscriptionPlan,
  feature: keyof PlanFeatures
): boolean {
  return PLAN_FEATURES[planId][feature];
}

/**
 * Obtener plan por defecto (si no está definido)
 */
export function getDefaultPlan(): SubscriptionPlan {
  return 'BASIC';
}

/**
 * Obtener entidades (límites y features) de un plan
 */
export function getPlanEntitlements(planId: SubscriptionPlan) {
  return {
    limits: getPlanLimits(planId),
    features: getPlanFeatures(planId),
    config: getPlanConfig(planId),
  };
}

/**
 * Migrar plan legacy a nuevo plan
 * Mapea planes antiguos (STANDARD, APPROVED25) a nuevos planes
 */
export function migrateLegacyPlan(legacyPlan: string): SubscriptionPlan {
  const migrationMap: Record<string, SubscriptionPlan> = {
    'BASIC': 'BASIC',
    'STANDARD': 'STARTER', // STANDARD -> STARTER
    'PRO': 'PRO',
    'APPROVED25': 'PRO', // APPROVED25 -> PRO (similar límites)
  };
  
  return migrationMap[legacyPlan] || 'BASIC';
}
