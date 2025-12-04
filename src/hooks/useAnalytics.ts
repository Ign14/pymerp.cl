/**
 * Custom Hooks para Analytics y Tracking
 * 
 * Simplifica el uso de analytics en componentes React
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackPageView, 
  trackEvent, 
  trackTimeOnPage,
  trackScrollDepth,
  GAEventAction,
  GAEventCategory,
} from '../config/analytics';
import { addBreadcrumb } from '../config/sentry';
import { logger } from '../utils/logger';

/**
 * Hook para trackear pageviews automáticamente
 */
export function usePageTracking() {
  const location = useLocation();
  const prevLocation = useRef(location.pathname);

  useEffect(() => {
    // Solo trackear si la ruta cambió
    if (location.pathname !== prevLocation.current) {
      trackPageView(location.pathname + location.search);
      addBreadcrumb('Page viewed', {
        path: location.pathname,
        search: location.search,
      });
      
      logger.debug('Page tracked:', location.pathname);
      prevLocation.current = location.pathname;
    }
  }, [location]);
}

/**
 * Hook para trackear tiempo en página
 */
export function useTimeOnPage() {
  const location = useLocation();
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Reset al cambiar de página
    startTime.current = Date.now();

    return () => {
      const timeSpent = (Date.now() - startTime.current) / 1000;
      
      // Solo trackear si estuvo más de 3 segundos
      if (timeSpent > 3) {
        trackTimeOnPage(timeSpent, location.pathname);
        logger.debug('Time on page:', timeSpent, 'seconds');
      }
    };
  }, [location.pathname]);
}

/**
 * Hook para trackear scroll depth
 */
export function useScrollTracking() {
  const location = useLocation();
  const tracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Reset tracking al cambiar de página
    tracked.current = new Set();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const percentage = Math.round((scrolled / scrollHeight) * 100);

      // Trackear en 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      
      milestones.forEach(milestone => {
        if (percentage >= milestone && !tracked.current.has(milestone)) {
          tracked.current.add(milestone);
          trackScrollDepth(milestone, location.pathname);
          logger.debug('Scroll depth:', milestone + '%');
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);
}

/**
 * Hook para trackear clicks en elementos específicos
 */
export function useClickTracking(
  elementName: string,
  eventAction: GAEventAction = GAEventAction.CLICK,
  category: GAEventCategory = GAEventCategory.ENGAGEMENT
) {
  return useCallback((additionalData?: Record<string, any>) => {
    trackEvent(eventAction, {
      category,
      element_name: elementName,
      ...additionalData,
    });
    
    addBreadcrumb('Element clicked', {
      element: elementName,
      ...additionalData,
    });
    
    logger.debug('Click tracked:', elementName);
  }, [elementName, eventAction, category]);
}

/**
 * Hook para trackear conversiones
 */
export function useConversionTracking() {
  return useCallback((
    action: GAEventAction,
    value?: number,
    additionalData?: Record<string, any>
  ) => {
    trackEvent(action, {
      category: GAEventCategory.CONVERSION,
      value,
      currency: 'CLP',
      ...additionalData,
    });
    
    addBreadcrumb('Conversion tracked', {
      action,
      value,
      ...additionalData,
    });
    
    logger.debug('Conversion tracked:', action, value);
  }, []);
}

/**
 * Hook para trackear búsquedas
 */
export function useSearchTracking() {
  return useCallback((searchTerm: string, resultsCount?: number) => {
    trackEvent(GAEventAction.SEARCH, {
      category: GAEventCategory.NAVIGATION,
      search_term: searchTerm,
      results_count: resultsCount,
    });
    
    addBreadcrumb('Search performed', {
      term: searchTerm,
      results: resultsCount,
    });
    
    logger.debug('Search tracked:', searchTerm, resultsCount);
  }, []);
}

/**
 * Hook para trackear formularios
 */
export function useFormTracking(formName: string) {
  const trackFormStart = useCallback(() => {
    trackEvent('form_start', {
      category: GAEventCategory.ENGAGEMENT,
      form_name: formName,
    });
    
    addBreadcrumb('Form started', { form: formName });
    logger.debug('Form started:', formName);
  }, [formName]);

  const trackFormComplete = useCallback((success: boolean = true) => {
    trackEvent(success ? 'form_complete' : 'form_error', {
      category: GAEventCategory.ENGAGEMENT,
      form_name: formName,
      success,
    });
    
    addBreadcrumb('Form completed', { form: formName, success });
    logger.debug('Form completed:', formName, success);
  }, [formName]);

  const trackFormField = useCallback((fieldName: string) => {
    trackEvent('form_field_interaction', {
      category: GAEventCategory.ENGAGEMENT,
      form_name: formName,
      field_name: fieldName,
    });
  }, [formName]);

  return {
    trackFormStart,
    trackFormComplete,
    trackFormField,
  };
}

/**
 * Hook para trackear videos
 */
export function useVideoTracking(videoId: string) {
  const trackVideoStart = useCallback(() => {
    trackEvent('video_start', {
      category: GAEventCategory.ENGAGEMENT,
      video_id: videoId,
    });
    
    logger.debug('Video started:', videoId);
  }, [videoId]);

  const trackVideoComplete = useCallback((duration: number) => {
    trackEvent('video_complete', {
      category: GAEventCategory.ENGAGEMENT,
      video_id: videoId,
      video_duration: duration,
    });
    
    logger.debug('Video completed:', videoId, duration);
  }, [videoId]);

  const trackVideoProgress = useCallback((percentage: number) => {
    trackEvent('video_progress', {
      category: GAEventCategory.ENGAGEMENT,
      video_id: videoId,
      video_percent: percentage,
    });
  }, [videoId]);

  return {
    trackVideoStart,
    trackVideoComplete,
    trackVideoProgress,
  };
}

/**
 * Hook para trackear errores en componentes
 */
export function useErrorTracking() {
  return useCallback((error: Error, errorInfo?: any) => {
    trackEvent(GAEventAction.ERROR_OCCURRED, {
      category: GAEventCategory.ERROR,
      error_message: error.message,
      error_stack: error.stack,
      component: errorInfo?.componentStack,
    });
    
    logger.error('Error tracked:', error.message);
  }, []);
}

/**
 * Hook todo-en-uno para analytics completo
 */
export function useAnalytics() {
  // Auto-tracking de página
  usePageTracking();
  
  // Auto-tracking de tiempo
  useTimeOnPage();
  
  // Auto-tracking de scroll
  useScrollTracking();

  return {
    trackClick: useClickTracking,
    trackConversion: useConversionTracking,
    trackSearch: useSearchTracking,
    trackForm: useFormTracking,
    trackVideo: useVideoTracking,
    trackError: useErrorTracking,
  };
}
