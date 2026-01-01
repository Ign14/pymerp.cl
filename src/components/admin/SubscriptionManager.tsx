import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, AlertCircle } from 'lucide-react';
import { updateCompanySubscriptionPlan } from '../../services/subscriptions';
import { SUBSCRIPTION_PLANS_DETAILS } from '../../utils/constants';
import type { SubscriptionPlan } from '../../utils/constants';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import toast from 'react-hot-toast';

interface SubscriptionManagerProps {
  companyId: string;
  companyName: string;
  currentPlan: SubscriptionPlan;
  onPlanUpdated?: () => void;
}

export default function SubscriptionManager({
  companyId,
  companyName,
  currentPlan,
  onPlanUpdated,
}: SubscriptionManagerProps) {
  const { handleError } = useErrorHandler();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(currentPlan);
  const [updating, setUpdating] = useState(false);

  const handleUpdatePlan = async () => {
    if (selectedPlan === currentPlan) {
      toast.error('Selecciona un plan diferente al actual');
      return;
    }

    try {
      setUpdating(true);
      await updateCompanySubscriptionPlan(companyId, selectedPlan);
      toast.success(`Plan actualizado a ${SUBSCRIPTION_PLANS_DETAILS[selectedPlan].name}`);
      onPlanUpdated?.();
    } catch (error) {
      handleError(error);
    } finally {
      setUpdating(false);
    }
  };

  const plans: SubscriptionPlan[] = ['BASIC', 'STANDARD', 'PRO', 'APPROVED25'];

  const getPlanColor = (plan: SubscriptionPlan) => {
    const colors = {
      BASIC: 'border-gray-300 bg-gray-50',
      STANDARD: 'border-blue-300 bg-blue-50',
      PRO: 'border-purple-300 bg-purple-50',
      APPROVED25: 'border-green-300 bg-green-50',
    };
    return colors[plan];
  };

  const getPlanBadgeColor = (plan: SubscriptionPlan) => {
    const colors = {
      BASIC: 'bg-gray-100 text-gray-800',
      STANDARD: 'bg-blue-100 text-blue-800',
      PRO: 'bg-purple-100 text-purple-800',
      APPROVED25: 'bg-green-100 text-green-800',
    };
    return colors[plan];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Gestionar Suscripción
        </h3>
        <p className="text-sm text-gray-600">
          Empresa: <span className="font-medium">{companyName}</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-600">Plan actual:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeColor(currentPlan)}`}>
            {SUBSCRIPTION_PLANS_DETAILS[currentPlan].name}
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {plans.map((plan) => {
          const details = SUBSCRIPTION_PLANS_DETAILS[plan];
          const isSelected = selectedPlan === plan;
          const isCurrent = currentPlan === plan;

          return (
            <motion.button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
                ${getPlanColor(plan)}
                hover:shadow-md
              `}
            >
              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute top-2 right-2">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    Actual
                  </span>
                </div>
              )}

              {/* Plan Icon */}
              <div className="flex items-start gap-3 mb-3">
                {plan === 'PRO' ? (
                  <Crown className="w-6 h-6 text-purple-600 flex-shrink-0" />
                ) : (
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{details.name}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{details.description}</p>
                </div>
              </div>

              {/* Price */}
              <p className="text-lg font-bold text-gray-900 mb-3">{details.price}</p>

              {/* Key Limits */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Profesionales:</span>
                  <span className="font-semibold text-gray-900">
                    {details.limits.professionals === Infinity ? '∞' : details.limits.professionals}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Servicios:</span>
                  <span className="font-semibold text-gray-900">
                    {details.limits.services === Infinity ? '∞' : details.limits.services}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Productos:</span>
                  <span className="font-semibold text-gray-900">
                    {details.limits.products === Infinity ? '∞' : details.limits.products}
                  </span>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Warning if downgrading */}
      {selectedPlan !== currentPlan && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-900">
              Atención: Cambio de plan
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Al cambiar el plan, los límites se actualizarán inmediatamente. 
              Si la empresa tiene más recursos activos que el nuevo límite, 
              no podrá agregar nuevos hasta reducir la cantidad.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleUpdatePlan}
          disabled={updating || selectedPlan === currentPlan}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {updating ? 'Actualizando...' : 'Actualizar Plan'}
        </button>
      </div>
    </div>
  );
}

