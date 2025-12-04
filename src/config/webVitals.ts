/**
 * Web Vitals Tracking
 * 
 * Monitorea Core Web Vitals y las envía a:
 * - Google Analytics 4
 * - Sentry (para debugging)
 * - Console (desarrollo)
 * 
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms  
 * - CLS (Cumulative Layout Shift): < 0.1
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 600ms
 * - INP (Interaction to Next Paint): < 200ms
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import { trackTiming } from './analytics';
import { logger } from '../utils/logger';
import * as Sentry from '@sentry/react';

// Umbrales de Web Vitals (en ms o score)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 600, needsImprovement: 1500 },
  INP: { good: 200, needsImprovement: 500 },
};

type Rating = 'good' | 'needs-improvement' | 'poor';

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: Rating;
  timestamp: number;
  url: string;
}

/**
 * Determinar rating basado en valor y umbrales
 */
function getRating(name: string, value: number): Rating {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Handler genérico para métricas
 */
function handleMetric(metric: Metric): void {
  const { name, value, rating, delta, id } = metric;

  // Calcular rating personalizado si no existe
  const finalRating = rating || getRating(name, value);

  // Log en desarrollo
  logger.debug(`Web Vital [${name}]:`, {
    value: Math.round(value),
    rating: finalRating,
    delta: Math.round(delta),
    id,
  });

  // Enviar a Google Analytics
  trackTiming(name, value, 'Web Vitals');

  // Enviar evento con rating
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(value),
      event_label: id,
      non_interaction: true,
      metric_rating: finalRating,
    });
  }

  // Enviar a Sentry si es performance pobre
  if (finalRating === 'poor') {
    Sentry.captureMessage(`Poor Web Vital: ${name}`, {
      level: 'warning',
      tags: {
        web_vital: name,
        rating: finalRating,
      },
      contexts: {
        'Web Vitals': {
          name,
          value: Math.round(value),
          rating: finalRating,
          delta: Math.round(delta),
          id,
        },
      },
    });
  }

  // Guardar en localStorage para análisis
  try {
    const vitals = JSON.parse(localStorage.getItem('web-vitals') || '[]');
    vitals.push({
      name,
      value: Math.round(value),
      rating: finalRating,
      timestamp: Date.now(),
      url: window.location.pathname,
    });

    // Mantener solo las últimas 50 métricas
    if (vitals.length > 50) {
      vitals.shift();
    }

    localStorage.setItem('web-vitals', JSON.stringify(vitals));
  } catch (error) {
    logger.error('Error guardando Web Vitals:', error);
  }
}

/**
 * Inicializar tracking de Web Vitals
 */
export function initWebVitals(): void {
  try {
    // Core Web Vitals
    onLCP(handleMetric);
    onCLS(handleMetric);

    // Additional metrics
    onFCP(handleMetric);
    onTTFB(handleMetric);
    
    // INP (reemplaza FID en futuro)
    try {
      onINP(handleMetric);
    } catch (error) {
      // INP puede no estar disponible en todos los navegadores
      logger.debug('INP no disponible');
    }

    logger.success('Web Vitals tracking inicializado');
  } catch (error) {
    logger.error('Error inicializando Web Vitals:', error);
  }
}

/**
 * Obtener Web Vitals guardados en localStorage
 */
export function getStoredWebVitals(): WebVitalsMetric[] {
  try {
    return JSON.parse(localStorage.getItem('web-vitals') || '[]');
  } catch (error) {
    logger.error('Error leyendo Web Vitals:', error);
    return [];
  }
}

/**
 * Limpiar Web Vitals almacenados
 */
export function clearStoredWebVitals(): void {
  try {
    localStorage.removeItem('web-vitals');
    logger.debug('Web Vitals cleared');
  } catch (error) {
    logger.error('Error limpiando Web Vitals:', error);
  }
}

/**
 * Calcular promedio de métricas
 */
export function calculateAverageVitals(metricsArray?: WebVitalsMetric[]): Record<string, {
  average: number;
  good: number;
  needsImprovement: number;
  poor: number;
}> {
  const vitals = metricsArray || getStoredWebVitals();
  const metrics: Record<string, number[]> = {};
  const ratings: Record<string, { good: number; needsImprovement: number; poor: number }> = {};

  vitals.forEach(({ name, value, rating }) => {
    if (!metrics[name]) {
      metrics[name] = [];
      ratings[name] = { good: 0, needsImprovement: 0, poor: 0 };
    }
    metrics[name].push(value);
    
    if (rating === 'good') ratings[name].good++;
    else if (rating === 'needs-improvement') ratings[name].needsImprovement++;
    else ratings[name].poor++;
  });

  const result: Record<string, any> = {};

  Object.keys(metrics).forEach(name => {
    const values = metrics[name];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    result[name] = {
      average: Math.round(average),
      ...ratings[name],
    };
  });

  return result;
}

/**
 * Hook para usar Web Vitals en componentes React
 */
export function useWebVitals() {
  return {
    getStoredWebVitals,
    clearStoredWebVitals,
    calculateAverageVitals,
  };
}
