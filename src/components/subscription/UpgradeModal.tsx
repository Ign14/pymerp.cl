import { motion } from 'framer-motion';
import { ArrowUpCircle, Crown, Check, X } from 'lucide-react';
import { getPlanConfig, getRecommendedUpgrade, type SubscriptionPlan } from '../../config/subscriptionPlans';

interface UpgradeModalProps {
  isOpen: boolean;
  currentPlan: SubscriptionPlan;
  requiredPlan?: SubscriptionPlan; // Plan requerido para la feature bloqueada
  reason?: string; // Razón por la que se muestra el modal
  onClose: () => void;
  onContactSupport?: () => void;
  onUpgrade?: (plan: SubscriptionPlan) => void;
}

export default function UpgradeModal({
  isOpen,
  currentPlan,
  requiredPlan,
  reason,
  onClose,
  onContactSupport,
  onUpgrade,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const recommendedPlan = requiredPlan || getRecommendedUpgrade(currentPlan);
  
  if (!recommendedPlan) {
    // Ya está en el plan más alto
    return null;
  }

  const currentDetails = getPlanConfig(currentPlan);
  const recommendedDetails = getPlanConfig(recommendedPlan);

  const handleContactSupport = () => {
    const message = encodeURIComponent(
      `Hola, me gustaría actualizar mi plan de ${currentDetails.label} a ${recommendedDetails.label}.${reason ? `\n\nRazón: ${reason}` : ''}`
    );
    window.open(`https://wa.me/56912345678?text=${message}`, '_blank');
    onContactSupport?.();
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(recommendedPlan);
    } else {
      handleContactSupport();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      aria-describedby="upgrade-modal-description"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar modal de actualización de plan"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpCircle className="w-8 h-8" aria-hidden="true" />
            <h2 id="upgrade-modal-title" className="text-2xl font-bold">Actualiza tu Plan</h2>
          </div>
          {reason && (
            <p id="upgrade-modal-description" className="text-blue-100 text-sm">{reason}</p>
          )}
          {!reason && (
            <p id="upgrade-modal-description" className="text-blue-100 text-sm sr-only">
              Compara tu plan actual con el plan recomendado y actualiza para obtener más funcionalidades
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current vs Recommended Comparison */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Current Plan */}
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">Tu plan actual</p>
                <h3 className="text-xl font-bold text-gray-900">{currentDetails.label}</h3>
                <p className="text-lg font-semibold text-gray-700 mt-1">{currentDetails.price}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profesionales:</span>
                  <span className="font-semibold">
                    {currentDetails.limits.professionals === Infinity ? '∞' : currentDetails.limits.professionals}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Servicios:</span>
                  <span className="font-semibold">
                    {currentDetails.limits.services === Infinity ? '∞' : currentDetails.limits.services}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Productos:</span>
                  <span className="font-semibold">
                    {currentDetails.limits.products === Infinity ? '∞' : currentDetails.limits.products}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommended Plan */}
            <div className={`border-2 ${recommendedDetails.recommended ? 'border-purple-500 bg-purple-50' : 'border-blue-500 bg-blue-50'} rounded-lg p-4 relative`}>
              {recommendedDetails.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Recomendado
                  </span>
                </div>
              )}
              <div className="text-center mb-4 mt-2">
                <p className={`text-sm ${recommendedDetails.recommended ? 'text-purple-600' : 'text-blue-600'} mb-1`}>
                  {requiredPlan ? 'Plan requerido' : 'Actualiza a'}
                </p>
                <h3 className={`text-xl font-bold ${recommendedDetails.recommended ? 'text-purple-900' : 'text-blue-900'}`}>
                  {recommendedDetails.label}
                </h3>
                <p className={`text-lg font-semibold ${recommendedDetails.recommended ? 'text-purple-700' : 'text-blue-700'} mt-1`}>
                  {recommendedDetails.price}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={recommendedDetails.recommended ? 'text-purple-700' : 'text-blue-700'}>Profesionales:</span>
                  <span className={`font-semibold ${recommendedDetails.recommended ? 'text-purple-900' : 'text-blue-900'}`}>
                    {recommendedDetails.limits.professionals === Infinity ? '∞' : recommendedDetails.limits.professionals}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={recommendedDetails.recommended ? 'text-purple-700' : 'text-blue-700'}>Servicios:</span>
                  <span className={`font-semibold ${recommendedDetails.limits.services === Infinity ? '∞' : recommendedDetails.limits.services}`}>
                    {recommendedDetails.limits.services === Infinity ? '∞' : recommendedDetails.limits.services}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={recommendedDetails.recommended ? 'text-purple-700' : 'text-blue-700'}>Productos:</span>
                  <span className={`font-semibold ${recommendedDetails.recommended ? 'text-purple-900' : 'text-blue-900'}`}>
                    {recommendedDetails.limits.products === Infinity ? '∞' : recommendedDetails.limits.products}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Lo que obtienes con {recommendedDetails.label}:
            </h4>
            <ul className="space-y-2">
              {recommendedDetails.features.automaticReminders && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Recordatorios automáticos</span>
                </li>
              )}
              {recommendedDetails.features.exportData && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Exportación de datos</span>
                </li>
              )}
              {recommendedDetails.features.integrations && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Integraciones</span>
                </li>
              )}
              {recommendedDetails.features.featuredInDirectory && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Destacado en directorio</span>
                </li>
              )}
              {recommendedDetails.features.customDomain && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Dominio personalizado</span>
                </li>
              )}
              {recommendedDetails.features.advancedAnalytics && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Analíticas avanzadas</span>
                </li>
              )}
              {recommendedDetails.features.prioritySupport && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Soporte prioritario</span>
                </li>
              )}
              {recommendedDetails.features.whiteLabel && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>White Label</span>
                </li>
              )}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ArrowUpCircle className="w-5 h-5" />
              {onUpgrade ? 'Actualizar Plan' : 'Contactar para Actualizar'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Más tarde
            </button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {onUpgrade
              ? 'Tu actualización se procesará inmediatamente.'
              : 'Nuestro equipo te contactará para procesar tu actualización de plan.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

