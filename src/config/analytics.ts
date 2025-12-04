/**
 * Google Analytics 4 Configuration
 * 
 * Inicializa y configura Google Analytics 4 con:
 * - Pageview tracking automático
 * - Event tracking personalizado
 * - User properties
 * - E-commerce tracking
 * - Configuración de privacidad
 */

import ReactGA from 'react-ga4';
import { logger } from '../utils/logger';
import { env } from './env';

// Tipos de eventos personalizados
export enum GAEventCategory {
  USER = 'user',
  NAVIGATION = 'navigation',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  ERROR = 'error',
  BUSINESS = 'business',
}

export enum GAEventAction {
  // User events
  SIGN_UP = 'sign_up',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_UPDATE = 'profile_update',
  
  // Navigation events
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  SEARCH = 'search',
  
  // Engagement events
  SCROLL = 'scroll',
  VIDEO_PLAY = 'video_play',
  FILE_DOWNLOAD = 'file_download',
  
  // Conversion events
  WHATSAPP_CLICK = 'whatsapp_click',
  SERVICE_BOOKING = 'service_booking',
  PRODUCT_ORDER = 'product_order',
  CONTACT_SUBMIT = 'contact_submit',
  
  // Business events
  SERVICE_CREATE = 'service_create',
  PRODUCT_CREATE = 'product_create',
  COMPANY_SETUP = 'company_setup',
  
  // Error events
  ERROR_OCCURRED = 'error_occurred',
}

interface GAEventParams {
  category?: GAEventCategory;
  label?: string;
  value?: number;
  [key: string]: any;
}

// Custom Dimensions
export interface GACustomDimensions {
  user_id?: string;
  user_role?: string;
  company_id?: string;
  company_name?: string;
  business_type?: string;
  app_version?: string;
  environment?: string;
  session_id?: string;
  [key: string]: any;
}

// Estado global de custom dimensions
let globalCustomDimensions: GACustomDimensions = {
  app_version: env.app.version,
  environment: env.app.environment,
  session_id: generateSessionId(),
};

/**
 * Generar Session ID único
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Inicializar Google Analytics 4
 */
export function initGA(measurementId?: string): void {
  const gaId = measurementId || env.analytics.measurementId;
  
  if (!gaId || !env.analytics.enabled) {
    logger.warn('GA4 deshabilitado o Measurement ID no configurado');
    return;
  }

  try {
    ReactGA.initialize(gaId, {
      gaOptions: {
        // Configuración de privacidad
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
        cookie_expires: 63072000, // 2 años
        
        // Custom dimensions globales
        ...globalCustomDimensions,
      },
      gtagOptions: {
        // Debug mode
        debug_mode: env.analytics.debug,
        send_page_view: true,
        
        // Custom dimensions adicionales
        custom_map: {
          dimension1: 'user_role',
          dimension2: 'company_id',
          dimension3: 'business_type',
          dimension4: 'app_version',
          dimension5: 'environment',
        },
      },
    });

    logger.success('Google Analytics 4 inicializado:', gaId);
    logger.debug('Custom dimensions:', globalCustomDimensions);
    
    // Inicializar debugger si está habilitado
    if (env.analytics.debug) {
      initAnalyticsDebugger();
    }
  } catch (error) {
    logger.error('Error inicializando GA4:', error);
  }
}

/**
 * Setear custom dimensions globales
 */
export function setCustomDimensions(dimensions: Partial<GACustomDimensions>): void {
  globalCustomDimensions = {
    ...globalCustomDimensions,
    ...dimensions,
  };
  
  try {
    ReactGA.set(dimensions);
    logger.debug('Custom dimensions actualizadas:', dimensions);
  } catch (error) {
    logger.error('Error seteando custom dimensions:', error);
  }
}

/**
 * Obtener custom dimensions actuales
 */
export function getCustomDimensions(): GACustomDimensions {
  return { ...globalCustomDimensions };
}

/**
 * Trackear pageview manualmente
 */
export function trackPageView(path?: string, title?: string): void {
  try {
    const page = path || window.location.pathname + window.location.search;
    
    ReactGA.send({ 
      hitType: 'pageview', 
      page,
      title: title || document.title,
    });

    logger.debug('GA4 Pageview:', page);
  } catch (error) {
    logger.error('Error tracking pageview:', error);
  }
}

/**
 * Trackear evento personalizado
 */
export function trackEvent(
  action: GAEventAction | string,
  params?: GAEventParams
): void {
  if (!env.analytics.enabled) return;
  
  try {
    const eventData = {
      ...globalCustomDimensions,
      ...params,
      timestamp: Date.now(),
    };
    
    ReactGA.event(action, eventData);

    logger.debug('GA4 Event:', action, eventData);
    
    // Actualizar debugger
    if (env.analytics.debug) {
      updateAnalyticsDebugger(action, eventData);
    }
  } catch (error) {
    logger.error('Error tracking event:', error);
  }
}

/**
 * Setear user properties
 */
export function setUserProperties(userId: string, properties: Record<string, any>): void {
  try {
    ReactGA.set({ userId, ...properties });
    logger.debug('GA4 User properties set:', userId);
  } catch (error) {
    logger.error('Error setting user properties:', error);
  }
}

/**
 * Trackear conversión
 */
export function trackConversion(
  action: GAEventAction,
  value?: number,
  currency: string = 'CLP'
): void {
  trackEvent(action, {
    category: GAEventCategory.CONVERSION,
    value,
    currency,
  });
}

/**
 * Trackear error
 */
export function trackError(
  errorMessage: string,
  errorStack?: string,
  fatal: boolean = false
): void {
  trackEvent(GAEventAction.ERROR_OCCURRED, {
    category: GAEventCategory.ERROR,
    description: errorMessage,
    fatal,
    stack: errorStack,
  });
}

/**
 * Trackear timing (performance)
 */
export function trackTiming(
  name: string,
  value: number,
  category?: string
): void {
  try {
    ReactGA.event('timing_complete', {
      name,
      value: Math.round(value),
      event_category: category || 'performance',
    });

    logger.debug('GA4 Timing:', name, value);
  } catch (error) {
    logger.error('Error tracking timing:', error);
  }
}

/**
 * Trackear búsqueda
 */
export function trackSearch(searchTerm: string, resultsCount?: number): void {
  trackEvent(GAEventAction.SEARCH, {
    category: GAEventCategory.NAVIGATION,
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

/**
 * Trackear click en elemento específico
 */
export function trackClick(
  elementName: string,
  elementType?: string,
  additionalData?: Record<string, any>
): void {
  trackEvent(GAEventAction.CLICK, {
    category: GAEventCategory.ENGAGEMENT,
    element_name: elementName,
    element_type: elementType,
    ...additionalData,
  });
}

/**
 * Trackear scroll depth
 */
export function trackScrollDepth(percentage: number, page?: string): void {
  trackEvent(GAEventAction.SCROLL, {
    category: GAEventCategory.ENGAGEMENT,
    scroll_depth: percentage,
    page: page || window.location.pathname,
  });
}

/**
 * Trackear tiempo en página
 */
export function trackTimeOnPage(seconds: number, page?: string): void {
  trackEvent('time_on_page', {
    category: GAEventCategory.ENGAGEMENT,
    time_seconds: Math.round(seconds),
    page: page || window.location.pathname,
  });
}

/**
 * E-commerce: Add to cart
 */
export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}): void {
  try {
    ReactGA.event('add_to_cart', {
      currency: 'CLP',
      value: item.price * item.quantity,
      items: [{
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category,
      }],
    });

    logger.debug('GA4 Add to cart:', item);
  } catch (error) {
    logger.error('Error tracking add to cart:', error);
  }
}

/**
 * E-commerce: Purchase
 */
export function trackPurchase(transaction: {
  transactionId: string;
  value: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}): void {
  try {
    ReactGA.event('purchase', {
      currency: 'CLP',
      transaction_id: transaction.transactionId,
      value: transaction.value,
      items: transaction.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    logger.debug('GA4 Purchase:', transaction);
  } catch (error) {
    logger.error('Error tracking purchase:', error);
  }
}

/**
 * Analytics Debugger
 */
interface DebugEvent {
  timestamp: number;
  action: string;
  params: any;
}

let debugEvents: DebugEvent[] = [];
const MAX_DEBUG_EVENTS = 50;

function initAnalyticsDebugger(): void {
  if (typeof window === 'undefined') return;
  
  // Crear panel de debug
  const debugPanel = document.createElement('div');
  debugPanel.id = 'ga4-debugger';
  debugPanel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    max-height: 500px;
    background: rgba(0, 0, 0, 0.95);
    color: #00ff00;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    padding: 15px;
    border-radius: 8px;
    z-index: 99999;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
    display: none;
  `;
  
  debugPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #00ff00; padding-bottom: 10px;">
      <strong style="font-size: 14px;">📊 GA4 Debugger</strong>
      <div>
        <button id="ga4-clear" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Clear</button>
        <button id="ga4-close" style="background: #444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Hide</button>
      </div>
    </div>
    <div id="ga4-events" style="max-height: 400px; overflow-y: auto;"></div>
  `;
  
  document.body.appendChild(debugPanel);
  
  // Botón flotante para mostrar/ocultar
  const toggleButton = document.createElement('button');
  toggleButton.id = 'ga4-toggle';
  toggleButton.textContent = '📊 GA4';
  toggleButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 255, 0, 0.9);
    color: black;
    border: none;
    padding: 10px 15px;
    border-radius: 50px;
    cursor: pointer;
    z-index: 99998;
    font-weight: bold;
    box-shadow: 0 2px 10px rgba(0, 255, 0, 0.5);
    transition: all 0.3s;
  `;
  
  toggleButton.addEventListener('mouseenter', () => {
    toggleButton.style.transform = 'scale(1.1)';
  });
  
  toggleButton.addEventListener('mouseleave', () => {
    toggleButton.style.transform = 'scale(1)';
  });
  
  toggleButton.addEventListener('click', () => {
    const panel = document.getElementById('ga4-debugger');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  document.body.appendChild(toggleButton);
  
  // Event listeners
  document.getElementById('ga4-clear')?.addEventListener('click', () => {
    debugEvents = [];
    const eventsContainer = document.getElementById('ga4-events');
    if (eventsContainer) eventsContainer.innerHTML = '<p style="color: #888;">No events tracked yet...</p>';
  });
  
  document.getElementById('ga4-close')?.addEventListener('click', () => {
    const panel = document.getElementById('ga4-debugger');
    if (panel) panel.style.display = 'none';
  });
  
  logger.success('GA4 Debugger inicializado - Click en el botón flotante para ver eventos');
}

function updateAnalyticsDebugger(action: string, params: any): void {
  if (typeof window === 'undefined') return;
  
  const event: DebugEvent = {
    timestamp: Date.now(),
    action,
    params,
  };
  
  debugEvents.unshift(event);
  if (debugEvents.length > MAX_DEBUG_EVENTS) {
    debugEvents = debugEvents.slice(0, MAX_DEBUG_EVENTS);
  }
  
  const eventsContainer = document.getElementById('ga4-events');
  if (!eventsContainer) return;
  
  eventsContainer.innerHTML = debugEvents.map((evt) => {
    const time = new Date(evt.timestamp).toLocaleTimeString();
    const paramsStr = JSON.stringify(evt.params, null, 2);
    
    return `
      <div style="margin-bottom: 15px; padding: 10px; background: rgba(0, 255, 0, 0.1); border-left: 3px solid #00ff00; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <strong style="color: #00ffff;">${evt.action}</strong>
          <span style="color: #888; font-size: 10px;">${time}</span>
        </div>
        <details>
          <summary style="cursor: pointer; color: #ffff00; margin-bottom: 5px;">Params</summary>
          <pre style="margin: 5px 0 0 0; padding: 8px; background: rgba(0, 0, 0, 0.5); border-radius: 4px; overflow-x: auto; font-size: 10px;">${paramsStr}</pre>
        </details>
      </div>
    `;
  }).join('');
}

/**
 * Hook personalizado para tracking automático
 */
export function useGA4() {
  return {
    trackEvent,
    trackPageView,
    trackConversion,
    trackError,
    trackClick,
    trackSearch,
    trackScrollDepth,
    trackTimeOnPage,
    trackAddToCart,
    trackPurchase,
    setCustomDimensions,
    getCustomDimensions,
  };
}
