/**
 * Configuración de i18next para internacionalización
 * 
 * Features:
 * - Detección automática de idioma del navegador
 * - Persistencia en localStorage
 * - Carga de traducciones desde archivos JSON
 * - Fallback a español si no hay idioma detectado
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Idiomas soportados
export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Configuración del detector de idioma
const languageDetectorOptions = {
  // Orden de detección: localStorage -> querystring -> navigator
  order: ['localStorage', 'querystring', 'navigator'],
  
  // Keys para localStorage y querystring
  lookupLocalStorage: 'i18nextLng',
  lookupQuerystring: 'lng',
  
  // Cache en localStorage
  caches: ['localStorage'],
  
  // Excluir cache para ciertos idiomas
  excludeCacheFor: ['cimode'],
};

// Configuración del backend para cargar traducciones
const backendOptions = {
  // Ruta a los archivos de traducción
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  
  // Namespace por defecto
  defaultNS: 'translation',
  
  // Permitir cross-origin
  crossDomain: false,
};

// Inicializar i18next
i18n
  // Pasar la instancia de i18n a react-i18next
  .use(initReactI18next)
  
  // Detectar idioma automáticamente
  .use(LanguageDetector)
  
  // Cargar traducciones desde backend
  .use(HttpBackend)
  
  // Inicializar con opciones
  .init({
    // Idioma por defecto si no se detecta ninguno
    fallbackLng: 'es',
    
    // Idiomas soportados
    supportedLngs: SUPPORTED_LANGUAGES,
    
    // No cargar idiomas no soportados
    load: 'languageOnly', // 'es' en lugar de 'es-ES'
    
    // Namespace por defecto
    defaultNS: 'translation',
    
    // Debug en desarrollo
    debug: import.meta.env.DEV,
    
    // Interpolación
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
    
    // Opciones del detector
    detection: languageDetectorOptions,
    
    // Opciones del backend
    backend: backendOptions,
    
    // Comportamiento de caché
    cache: {
      enabled: true,
    },
    
    // React options
    react: {
      useSuspense: false, // Evitar suspense para mejor experiencia
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },
  });

// Listener para cambios de idioma (útil para analytics)
i18n.on('languageChanged', (lng) => {
  console.log(`[i18n] Language changed to: ${lng}`);
  
  // Actualizar atributo lang del HTML
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
  
  // Analytics: trackear cambio de idioma
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'language_change', {
      language: lng,
    });
  }
});

// Listener para errores de carga
i18n.on('failedLoading', (lng, ns, msg) => {
  console.error(`[i18n] Failed loading ${lng}/${ns}:`, msg);
});

// Función helper para cambiar idioma
export const changeLanguage = async (lng: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
  }
};

// Función helper para obtener idioma actual
export const getCurrentLanguage = (): SupportedLanguage => {
  const current = i18n.language;
  // Extraer solo el código de idioma (es de es-ES)
  const code = current.split('-')[0] as SupportedLanguage;
  return SUPPORTED_LANGUAGES.includes(code) ? code : 'es';
};

// Función helper para detectar si el idioma es RTL
export const isRTL = (lng?: string): boolean => {
  const language = lng || getCurrentLanguage();
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
};

// Exportar instancia de i18n
export default i18n;

// Tipos para TypeScript
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}
