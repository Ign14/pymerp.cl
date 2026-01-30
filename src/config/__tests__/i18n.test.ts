/**
 * Tests for i18n translation keys
 * 
 * Verifies that all translation keys used in the codebase exist
 * in both Spanish and English translation files.
 */

import { describe, it, expect } from 'vitest';
import esTranslations from '../../../public/locales/es/translation.json';
import enTranslations from '../../../public/locales/en/translation.json';

// Helper to get nested value from object by dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

describe('i18n Translation Keys', () => {
  // Keys that should exist in both languages
  const requiredKeys = [
    // Common keys
    'common.brand',
    'common.tagline',
    'common.email',
    'common.password',
    'common.submit',
    'common.cancel',
    'common.save',
    'common.delete',
    'common.edit',
    'common.close',
    'common.loading',
    'common.search',
    'common.filter',
    'common.back',
    'common.noResults',
    
    // Nearby companies keys
    'nearby.title',
    'nearby.subtitle',
    'nearby.loading',
    'nearby.loadingMap',
    'nearby.mapError',
    'nearby.mapErrorDescription',
    'nearby.back',
    'nearby.useLocation',
    'nearby.myLocation',
    'nearby.searchPlaceholder',
    'nearby.categoryFilter',
    'nearby.communeFilter',
    'nearby.distanceFilter',
    'nearby.allDistances',
    'nearby.clearFilters',
    'nearby.noResults',
    'nearby.viewOnMap',
    'nearby.getDirections',
    'nearby.viewProfile',
    'nearby.viewPublicProfile',
    'nearby.companiesFound',
    'nearby.companiesFound_plural',
  ];

  describe('Required keys exist in both languages', () => {
    requiredKeys.forEach((key) => {
      it(`should have key "${key}" in Spanish`, () => {
        const value = getNestedValue(esTranslations, key);
        expect(value, `Key "${key}" missing in Spanish translations`).toBeDefined();
        expect(typeof value, `Key "${key}" should be a string`).toBe('string');
        expect(value.length, `Key "${key}" should not be empty`).toBeGreaterThan(0);
      });

      it(`should have key "${key}" in English`, () => {
        const value = getNestedValue(enTranslations, key);
        expect(value, `Key "${key}" missing in English translations`).toBeDefined();
        expect(typeof value, `Key "${key}" should be a string`).toBe('string');
        expect(value.length, `Key "${key}" should not be empty`).toBeGreaterThan(0);
      });
    });
  });

  describe('Translation structure consistency', () => {
    it('should have the same top-level keys in both languages', () => {
      const esKeys = Object.keys(esTranslations);
      const enKeys = Object.keys(enTranslations);
      
      // Check that main sections exist in both
      const mainSections = ['common', 'nearby'];
      mainSections.forEach((section) => {
        expect(esKeys).toContain(section);
        expect(enKeys).toContain(section);
      });
    });

    it('should have nearby section with required keys', () => {
      expect(esTranslations).toHaveProperty('nearby');
      expect(enTranslations).toHaveProperty('nearby');
      
      const esNearby = (esTranslations as any).nearby;
      const enNearby = (enTranslations as any).nearby;
      
      expect(esNearby).toHaveProperty('title');
      expect(esNearby).toHaveProperty('subtitle');
      expect(esNearby).toHaveProperty('loading');
      expect(esNearby).toHaveProperty('mapError');
      
      expect(enNearby).toHaveProperty('title');
      expect(enNearby).toHaveProperty('subtitle');
      expect(enNearby).toHaveProperty('loading');
      expect(enNearby).toHaveProperty('mapError');
    });
  });

  describe('Translation quality', () => {
    it('should not have placeholder text in Spanish', () => {
      const esStr = JSON.stringify(esTranslations);
      // Check for common placeholder patterns
      expect(esStr).not.toContain('TODO');
      expect(esStr).not.toContain('FIXME');
      expect(esStr).not.toContain('PLACEHOLDER');
    });

    it('should not have placeholder text in English', () => {
      const enStr = JSON.stringify(enTranslations);
      // Check for common placeholder patterns
      expect(enStr).not.toContain('TODO');
      expect(enStr).not.toContain('FIXME');
      expect(enStr).not.toContain('PLACEHOLDER');
    });

    it('should have meaningful translations (not just keys)', () => {
      const esNearby = (esTranslations as any).nearby;
      const enNearby = (enTranslations as any).nearby;
      
      // Check that translations are not just the key names
      expect(esNearby.title).not.toBe('nearby.title');
      expect(enNearby.title).not.toBe('nearby.title');
      expect(esNearby.title.length).toBeGreaterThan(5);
      expect(enNearby.title.length).toBeGreaterThan(5);
    });
  });
});

