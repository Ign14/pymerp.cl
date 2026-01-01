import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SubscriptionPlan } from '../utils/constants';
import { SUBSCRIPTION_PLAN_LIMITS, SUBSCRIPTION_PLANS_DETAILS } from '../utils/constants';
import type { Company } from '../types';

/**
 * Service for managing company subscriptions
 */

// ==================== GET SUBSCRIPTION INFO ====================

/**
 * Get subscription information for a company
 * @param companyId - The company ID
 * @returns Promise with subscription details
 */
export const getCompanySubscription = async (companyId: string) => {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);
  
  if (!companySnap.exists()) {
    throw new Error('Company not found');
  }
  
  const companyData = companySnap.data() as Company;
  const plan = companyData.subscription_plan || 'BASIC';
  const planDetails = SUBSCRIPTION_PLANS_DETAILS[plan];
  
  return {
    currentPlan: plan,
    planDetails,
    limits: {
      professionals: SUBSCRIPTION_PLAN_LIMITS.professionals[plan],
      services: SUBSCRIPTION_PLAN_LIMITS.services[plan],
      products: SUBSCRIPTION_PLAN_LIMITS.products[plan],
      serviceSchedules: SUBSCRIPTION_PLAN_LIMITS.serviceSchedules[plan],
    },
    subscription: companyData.subscription,
  };
};

// ==================== UPDATE SUBSCRIPTION PLAN ====================

/**
 * Update company subscription plan
 * This should only be called by SUPERADMIN users
 * @param companyId - The company ID
 * @param newPlan - The new subscription plan
 */
export const updateCompanySubscriptionPlan = async (
  companyId: string,
  newPlan: SubscriptionPlan
): Promise<void> => {
  const companyRef = doc(db, 'companies', companyId);
  
  // Get new limits based on plan
  const maxProfessionals = SUBSCRIPTION_PLAN_LIMITS.professionals[newPlan];
  
  await updateDoc(companyRef, {
    subscription_plan: newPlan,
    'subscription.maxProfessionals': maxProfessionals,
    updated_at: new Date(),
  });
};

// ==================== CHECK LIMITS ====================

/**
 * Check if a company can add more of a specific resource
 * @param companyId - The company ID
 * @param resource - The resource type to check
 * @param currentCount - Current count of the resource
 * @returns Object with canAdd boolean and limit info
 */
export const checkResourceLimit = async (
  companyId: string,
  resource: keyof typeof SUBSCRIPTION_PLAN_LIMITS,
  currentCount: number
) => {
  const subscription = await getCompanySubscription(companyId);
  const limit = subscription.limits[resource];
  
  return {
    canAdd: currentCount < limit,
    limit,
    currentCount,
    remaining: limit === Infinity ? Infinity : limit - currentCount,
  };
};

// ==================== GET ALL PLANS ====================

/**
 * Get all available subscription plans
 * @returns Array of all plans with details
 */
export const getAllPlans = () => {
  return Object.entries(SUBSCRIPTION_PLANS_DETAILS).map(([plan, details]) => ({
    plan: plan as SubscriptionPlan,
    details,
  }));
};

// ==================== UPGRADE HELPERS ====================

/**
 * Get recommended upgrade plan based on current plan
 * @param currentPlan - Current subscription plan
 * @returns Recommended upgrade plan or null if already on highest plan
 */
export const getRecommendedUpgrade = (currentPlan: SubscriptionPlan): SubscriptionPlan | null => {
  const upgradePath: Record<SubscriptionPlan, SubscriptionPlan | null> = {
    BASIC: 'STANDARD',
    STANDARD: 'PRO',
    PRO: null,
    APPROVED25: 'PRO',
  };
  
  return upgradePath[currentPlan];
};

/**
 * Compare two plans to see if one is an upgrade
 * @param fromPlan - Current plan
 * @param toPlan - Target plan
 * @returns true if toPlan is an upgrade from fromPlan
 */
export const isUpgrade = (fromPlan: SubscriptionPlan, toPlan: SubscriptionPlan): boolean => {
  const planOrder: Record<SubscriptionPlan, number> = {
    BASIC: 1,
    STANDARD: 2,
    APPROVED25: 2.5,
    PRO: 3,
  };
  
  return planOrder[toPlan] > planOrder[fromPlan];
};

