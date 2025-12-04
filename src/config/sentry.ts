import * as Sentry from '@sentry/react';
import { logger } from '../utils/logger';

/**
 * Inicializar Sentry para tracking de errores con configuración enterprise
 * 
 * Features:
 * - Source maps automáticos
 * - Release tracking
 * - User context
 * - Breadcrumbs avanzados
 * - Performance monitoring
 * - Session replay
 * 
 * IMPORTANTE: Configurar VITE_SENTRY_DSN en .env antes de usar en producción
 */
export const initSentry = () => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;
  const isProduction = environment === 'production';
  const release = import.meta.env.VITE_APP_VERSION || 'dev';

  // Solo inicializar Sentry si hay DSN configurado y no estamos en desarrollo
  if (!SENTRY_DSN) {
    logger.warn('Sentry DSN no configurado. Los errores no se enviarán a Sentry.');
    return;
  }

  if (import.meta.env.DEV) {
    logger.info('Sentry no se inicializa en desarrollo');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Entorno (development, staging, production)
    environment,

    // Release tracking para source maps
    release: `agendaweb@${release}`,
    
    // Dist para separar builds
    dist: `${Date.now()}`,

    // Tasa de muestreo de errores (1.0 = 100%)
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Tasa de muestreo de sesiones para replay
    replaysSessionSampleRate: 0.1,
    
    // Tasa de muestreo cuando hay error
    replaysOnErrorSampleRate: 1.0,
    
    // Performance monitoring sample rate
    profilesSampleRate: isProduction ? 0.1 : 1.0,

    // Integrations avanzadas
    integrations: [
      // Browser tracing con configuración avanzada
      Sentry.browserTracingIntegration({
        // Sin tracingOrigins ni routingInstrumentation deprecated
      }),
      
      // Session replay para debugging visual
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
      
      // Breadcrumbs avanzados
      Sentry.breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        sentry: true,
        xhr: true,
      }),
      
      // HTTP client errors
      Sentry.httpClientIntegration(),
    ],
    
    // Configuración de transacciones
    beforeSendTransaction(transaction) {
      // Filtrar transacciones de desarrollo
      if (transaction.transaction?.includes('localhost')) {
        return null;
      }
      return transaction;
    },

    // Filtrar eventos sensibles
    beforeSend(event, hint) {
      // Agregar información adicional del error original
      if (hint && hint.originalException) {
        const error = hint.originalException as any;
        if (error.response) {
          event.contexts = event.contexts || {};
          event.contexts.response = {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          };
        }
      }
      
      // Filtrar información sensible de URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/([?&])(password|token|key|email)=[^&]*/gi, '$1$2=***');
      }

      // Filtrar breadcrumbs sensibles
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.message) {
            breadcrumb.message = breadcrumb.message.replace(/(password|token|key|email):\s*\S+/gi, '$1: ***');
          }
          if (breadcrumb.data) {
            const filteredData = { ...breadcrumb.data };
            ['password', 'token', 'key', 'email', 'authorization'].forEach(key => {
              if (filteredData[key]) {
                filteredData[key] = '***';
              }
            });
            breadcrumb.data = filteredData;
          }
          return breadcrumb;
        });
      }
      
      // Filtrar extra data sensible
      if (event.extra) {
        const filtered = { ...event.extra };
        Object.keys(filtered).forEach(key => {
          if (/password|token|key|secret|auth/i.test(key)) {
            filtered[key] = '***';
          }
        });
        event.extra = filtered;
      }

      return event;
    },

    // Ignorar ciertos errores
    ignoreErrors: [
      // Errores del navegador que no podemos controlar
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Non-Error exception captured',
      // Errores de extensiones del navegador
      'chrome-extension://',
      'moz-extension://',
      // Errores de red timeout normales
      'NetworkError',
      'Failed to fetch',
      // Errores de Firebase esperados
      'auth/user-cancelled',
      'auth/popup-closed-by-user',
    ],

    // Rutas a ignorar en tracking
    denyUrls: [
      // Extensiones del navegador
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      // Scripts de third-party
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
    ],
    
    // Máximo de breadcrumbs a guardar
    maxBreadcrumbs: 50,
    
    // Adjuntar stack traces
    attachStacktrace: true,
    
    // Enviar client reports
    sendClientReports: true,
  });

  // Configurar user context si hay un usuario autenticado
  const setupUserContext = (userId: string, email?: string, username?: string, extra?: Record<string, any>) => {
    Sentry.setUser({
      id: userId,
      email,
      username,
      ...extra,
    });
    
    logger.debug('Sentry user context configurado:', userId);
  };

  // Limpiar user context al logout
  const clearUserContext = () => {
    Sentry.setUser(null);
    logger.debug('Sentry user context limpiado');
  };
  
  // Configurar tags globales
  Sentry.setTag('app.version', release);
  Sentry.setTag('app.environment', environment);

  logger.success('Sentry inicializado correctamente - Release:', release);

  return {
    setupUserContext,
    clearUserContext,
  };
};

/**
 * Capturar excepción manualmente
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.DEV) {
    console.error('Error que se enviaría a Sentry:', error, context);
    return;
  }

  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
};

/**
 * Capturar mensaje personalizado
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (import.meta.env.DEV) {
    console.log(`Mensaje que se enviaría a Sentry (${level}):`, message);
    return;
  }

  Sentry.captureMessage(message, level);
};

/**
 * Agregar breadcrumb personalizado
 */
export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

/**
 * Configurar tag personalizado
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Configurar contexto adicional
 */
export const setContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

export default {
  initSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setTag,
  setContext,
};
