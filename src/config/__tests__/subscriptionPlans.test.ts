import { describe, it, expect } from 'vitest';
import {
  getPlanEntitlements,
  getPlanLimits,
  getPlanFeatures,
  getPlanConfig,
  getRecommendedUpgrade,
  isUpgrade,
  getResourceLimit,
  hasFeature,
  getDefaultPlan,
  type SubscriptionPlan,
} from '../subscriptionPlans';

describe('subscriptionPlans', () => {
  describe('getPlanEntitlements', () => {
    it('should return correct entitlements for BASIC plan', () => {
      const entitlements = getPlanEntitlements('BASIC');
      
      expect(entitlements.limits.professionals).toBe(1);
      expect(entitlements.limits.services).toBe(5);
      expect(entitlements.limits.products).toBe(5);
      expect(entitlements.limits.serviceSchedules).toBe(5);
      
      expect(entitlements.features.automaticReminders).toBe(false);
      expect(entitlements.features.exportData).toBe(false);
      expect(entitlements.features.integrations).toBe(false);
      expect(entitlements.features.featuredInDirectory).toBe(false);
      
      expect(entitlements.config.planId).toBe('BASIC');
      expect(entitlements.config.label).toBe('Basic');
    });

    it('should return correct entitlements for STARTER plan', () => {
      const entitlements = getPlanEntitlements('STARTER');
      
      expect(entitlements.limits.professionals).toBe(3);
      expect(entitlements.features.automaticReminders).toBe(true);
      expect(entitlements.features.exportData).toBe(false);
    });

    it('should return correct entitlements for PRO plan', () => {
      const entitlements = getPlanEntitlements('PRO');
      
      expect(entitlements.limits.professionals).toBe(10);
      expect(entitlements.features.automaticReminders).toBe(true);
      expect(entitlements.features.exportData).toBe(true);
      expect(entitlements.features.integrations).toBe(true);
    });

    it('should return correct entitlements for BUSINESS plan', () => {
      const entitlements = getPlanEntitlements('BUSINESS');
      
      expect(entitlements.limits.professionals).toBe(30);
      expect(entitlements.features.customDomain).toBe(true);
    });

    it('should return correct entitlements for ENTERPRISE plan', () => {
      const entitlements = getPlanEntitlements('ENTERPRISE');
      
      expect(entitlements.limits.professionals).toBe(60);
      expect(entitlements.limits.services).toBe(Infinity);
      expect(entitlements.limits.products).toBe(Infinity);
      expect(entitlements.features.whiteLabel).toBe(true);
    });
  });

  describe('getPlanLimits', () => {
    it('should return correct limits for each plan', () => {
      expect(getPlanLimits('BASIC').professionals).toBe(1);
      expect(getPlanLimits('STARTER').professionals).toBe(3);
      expect(getPlanLimits('PRO').professionals).toBe(10);
      expect(getPlanLimits('BUSINESS').professionals).toBe(30);
      expect(getPlanLimits('ENTERPRISE').professionals).toBe(60);
    });
  });

  describe('getPlanFeatures', () => {
    it('should return correct features for each plan', () => {
      expect(getPlanFeatures('BASIC').automaticReminders).toBe(false);
      expect(getPlanFeatures('STARTER').automaticReminders).toBe(true);
      expect(getPlanFeatures('PRO').exportData).toBe(true);
      expect(getPlanFeatures('BUSINESS').customDomain).toBe(true);
      expect(getPlanFeatures('ENTERPRISE').whiteLabel).toBe(true);
    });
  });

  describe('getRecommendedUpgrade', () => {
    it('should return correct upgrade path', () => {
      expect(getRecommendedUpgrade('BASIC')).toBe('STARTER');
      expect(getRecommendedUpgrade('STARTER')).toBe('PRO');
      expect(getRecommendedUpgrade('PRO')).toBe('BUSINESS');
      expect(getRecommendedUpgrade('BUSINESS')).toBe('ENTERPRISE');
      expect(getRecommendedUpgrade('ENTERPRISE')).toBe(null);
    });
  });

  describe('isUpgrade', () => {
    it('should correctly identify upgrades', () => {
      expect(isUpgrade('BASIC', 'STARTER')).toBe(true);
      expect(isUpgrade('BASIC', 'PRO')).toBe(true);
      expect(isUpgrade('BASIC', 'BUSINESS')).toBe(true);
      expect(isUpgrade('BASIC', 'ENTERPRISE')).toBe(true);
      expect(isUpgrade('STARTER', 'PRO')).toBe(true);
      expect(isUpgrade('PRO', 'BUSINESS')).toBe(true);
      expect(isUpgrade('BUSINESS', 'ENTERPRISE')).toBe(true);
    });

    it('should correctly identify non-upgrades', () => {
      expect(isUpgrade('PRO', 'BASIC')).toBe(false);
      expect(isUpgrade('STARTER', 'BASIC')).toBe(false);
      expect(isUpgrade('PRO', 'PRO')).toBe(false);
      expect(isUpgrade('ENTERPRISE', 'BUSINESS')).toBe(false);
    });
  });

  describe('getResourceLimit', () => {
    it('should return correct resource limits', () => {
      expect(getResourceLimit('BASIC', 'professionals')).toBe(1);
      expect(getResourceLimit('STARTER', 'professionals')).toBe(3);
      expect(getResourceLimit('PRO', 'professionals')).toBe(10);
      expect(getResourceLimit('BUSINESS', 'professionals')).toBe(30);
      expect(getResourceLimit('ENTERPRISE', 'professionals')).toBe(60);
      
      expect(getResourceLimit('BASIC', 'services')).toBe(5);
      expect(getResourceLimit('ENTERPRISE', 'services')).toBe(Infinity);
    });
  });

  describe('hasFeature', () => {
    it('should correctly check features', () => {
      expect(hasFeature('BASIC', 'automaticReminders')).toBe(false);
      expect(hasFeature('STARTER', 'automaticReminders')).toBe(true);
      expect(hasFeature('PRO', 'exportData')).toBe(true);
      expect(hasFeature('BUSINESS', 'customDomain')).toBe(true);
      expect(hasFeature('ENTERPRISE', 'whiteLabel')).toBe(true);
    });
  });

  describe('getDefaultPlan', () => {
    it('should return BASIC as default plan', () => {
      expect(getDefaultPlan()).toBe('BASIC');
    });
  });

  describe('getPlanConfig', () => {
    it('should return complete plan configuration', () => {
      const config = getPlanConfig('PRO');
      
      expect(config.planId).toBe('PRO');
      expect(config.label).toBe('Pro');
      expect(config.description).toBeDefined();
      expect(config.price).toBeDefined();
      expect(config.limits).toBeDefined();
      expect(config.features).toBeDefined();
    });

    it('should mark STARTER as recommended', () => {
      const config = getPlanConfig('STARTER');
      expect(config.recommended).toBe(true);
    });
  });
});

