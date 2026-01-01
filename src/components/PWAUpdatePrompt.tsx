import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../hooks/usePWA';
import AnimatedButton from './animations/AnimatedButton';

export default function PWAUpdatePrompt() {
  // No mostrar en tests automáticos
  if (typeof navigator !== 'undefined' && 
      (navigator.userAgent.includes('Headless') || navigator.userAgent.includes('PWA-Test'))) {
    return null;
  }
  
  const { needRefresh, offlineReady, updateServiceWorker } = usePWA();
  const [needRefreshValue, setNeedRefresh] = needRefresh;
  const [offlineReadyValue, setOfflineReady] = offlineReady;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <AnimatePresence>
      {(offlineReadyValue || needRefreshValue) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-[9999] w-[calc(100%-1rem)] sm:w-full max-w-md px-2 sm:px-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 sm:gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 pt-0.5">
                {needRefreshValue ? (
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                ) : (
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-1 sm:pr-0">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1 leading-tight">
                  {needRefreshValue ? '✨ Nueva versión disponible' : '✅ Listo para usar sin conexión'}
                </h4>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {needRefreshValue 
                    ? 'Hay una actualización de pymerp.cl. Actualiza ahora para obtener las últimas mejoras y correcciones.' 
                    : 'pymerp.cl ya está disponible sin conexión a internet. Puedes usarla en cualquier momento.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-start gap-1.5 sm:gap-2 flex-shrink-0">
                {needRefreshValue && (
                  <AnimatedButton
                    onClick={handleUpdate}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded text-[10px] sm:text-xs font-medium hover:bg-blue-700 whitespace-nowrap"
                  >
                    Actualizar
                  </AnimatedButton>
                )}
                <button
                  onClick={close}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 sm:p-1"
                  aria-label="Cerrar"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

