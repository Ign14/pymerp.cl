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

export const SUBSCRIPTION_PLAN_LIMITS = {
  products: {
    BASIC: 3,
    STANDARD: 15,
    PRO: Infinity,
    APPROVED25: 25,
  },
  services: {
    BASIC: 3,
    STANDARD: 10,
    PRO: Infinity,
    APPROVED25: 25,
  },
  serviceSchedules: {
    BASIC: 5,
    STANDARD: 15,
    PRO: Infinity,
    APPROVED25: Infinity,
  },
} as const satisfies Record<string, Record<SubscriptionPlan, number>>;

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  BASIC: 'Basic',
  STANDARD: 'Standard',
  PRO: 'Pro',
  APPROVED25: 'Pro',
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
