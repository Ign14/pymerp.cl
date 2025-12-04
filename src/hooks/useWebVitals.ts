/**
 * Custom React Hook for Web Vitals
 * Provides access to Core Web Vitals metrics stored in localStorage
 */

import { useState, useEffect } from 'react';
import { getStoredWebVitals, calculateAverageVitals, clearStoredWebVitals as clearVitals } from '../config/webVitals';
import type { WebVitalsMetric } from '../config/webVitals';

/**
 * Hook to access Web Vitals metrics and utilities
 * @returns Object with vitals data, averages, and utility functions
 * 
 * @example
 * ```tsx
 * const { vitals, averages, loading, refresh, clearMetrics } = useWebVitals();
 * 
 * // Display average LCP
 * console.log(`Average LCP: ${averages?.LCP?.average}ms`);
 * 
 * // Clear all stored metrics
 * clearMetrics();
 * ```
 */
export function useWebVitals() {
  const [vitals, setVitals] = useState<WebVitalsMetric[]>([]);
  const [averages, setAverages] = useState<ReturnType<typeof calculateAverageVitals> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadVitals = () => {
    try {
      const storedVitals = getStoredWebVitals();
      setVitals(storedVitals);
      
      if (storedVitals.length > 0) {
        const avgVitals = calculateAverageVitals(storedVitals);
        setAverages(avgVitals);
      } else {
        setAverages(null);
      }
    } catch (error) {
      console.error('Error loading Web Vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVitals();

    // Listen to storage events for cross-tab updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'web_vitals') {
        loadVitals();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Refresh vitals data from localStorage
   */
  const refresh = () => {
    loadVitals();
  };

  /**
   * Clear all stored Web Vitals metrics
   */
  const clearMetrics = () => {
    clearVitals();
    setVitals([]);
    setAverages(null);
  };

  return {
    vitals,
    averages,
    loading,
    refresh,
    clearMetrics,
    // Re-export utility functions
    getStoredWebVitals,
    calculateAverageVitals,
    clearStoredWebVitals: clearVitals,
  };
}
