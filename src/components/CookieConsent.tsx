import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './animations/AnimatedButton';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_KEY = 'cookie-consent';
const CONSENT_VERSION = '1.0';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,  // Siempre true
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Verificar si ya dio consentimiento
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    
    if (!savedConsent) {
      // Mostrar banner después de 2 segundos
      setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    } else {
      // Cargar preferencias guardadas
      try {
        const parsed = JSON.parse(savedConsent);
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed.preferences);
          applyConsent(parsed.preferences);
        } else {
          // Nueva versión, pedir consentimiento de nuevo
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const applyConsent = (prefs: ConsentPreferences) => {
    // Google Consent Mode v2
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.marketing ? 'granted' : 'denied',
        'personalization_storage': prefs.marketing ? 'granted' : 'denied',
      });
    }
    
    // Deshabilitar GA4 si no hay consentimiento
    if (!prefs.analytics && (window as any).gtag) {
      (window as any)['ga-disable-' + import.meta.env.VITE_GA_MEASUREMENT_ID] = true;
    }
  };

  const saveConsent = (prefs: ConsentPreferences) => {
    const consent = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      preferences: prefs,
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    applyConsent(prefs);
    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyEssential);
    saveConsent(onlyEssential);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowCustomize(false);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[10000] bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 shadow-2xl"
        role="dialog"
        aria-label="Consentimiento de cookies"
        aria-describedby="cookie-description"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {!showCustomize ? (
            <>
              {/* Banner Principal */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🍪 Este sitio usa cookies
                  </h3>
                  <p id="cookie-description" className="text-sm text-gray-600 dark:text-gray-400">
                    Usamos cookies esenciales para el funcionamiento de AgendaWeb y cookies de análisis para mejorar tu experiencia. 
                    Puedes personalizar tus preferencias o aceptar todo.
                    {' '}
                    <a 
                      href="/privacidad" 
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      rel="noopener noreferrer"
                    >
                      Ver Política de Privacidad
                    </a>
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowCustomize(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Personalizar
                  </button>
                  <AnimatedButton
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Rechazar Todo
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleAcceptAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Aceptar Todo
                  </AnimatedButton>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Panel de Personalización */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Preferencias de Cookies
                  </h3>
                  <button
                    onClick={() => setShowCustomize(false)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Volver"
                  >
                    ←
                  </button>
                </div>

                {/* Cookies Esenciales */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Cookies Esenciales
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Necesarias para el funcionamiento de AgendaWeb: autenticación, sesión de usuario y seguridad.
                        No se pueden desactivar porque son indispensables.
                      </p>
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Siempre activas</span>
                    </div>
                  </div>
                </div>

                {/* Cookies de Analytics */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Cookies de Análisis
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nos ayudan a entender cómo usas AgendaWeb para mejorar continuamente.
                        Utilizamos Google Analytics 4. Tus datos son anónimos y agregados.
                      </p>
                    </div>
                    <div className="flex items-center ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cookies de Marketing */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 opacity-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Cookies de Publicidad
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Actualmente no utilizamos cookies de publicidad o marketing.
                        AgendaWeb no muestra anuncios de terceros.
                      </p>
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Desactivadas</span>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-2 pt-4">
                  <AnimatedButton
                    onClick={handleRejectAll}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Rechazar Todo
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleSavePreferences}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Guardar Preferencias
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleAcceptAll}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Aceptar Todo
                  </AnimatedButton>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook para verificar consentimiento
 */
export function useConsent() {
  const getConsent = (): ConsentPreferences | null => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      return parsed.preferences;
    } catch {
      return null;
    }
  };

  const hasConsent = (type: keyof ConsentPreferences): boolean => {
    const consent = getConsent();
    return consent ? consent[type] : false;
  };

  const revokeConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    window.location.reload();
  };

  return {
    getConsent,
    hasConsent,
    revokeConsent,
  };
}

