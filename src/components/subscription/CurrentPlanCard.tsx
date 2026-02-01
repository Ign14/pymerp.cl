import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowUpCircle, Crown } from 'lucide-react';
import { getCompanySubscription, getRecommendedUpgrade } from '../../services/subscriptions';
import { SUBSCRIPTION_PLANS_DETAILS } from '../../utils/constants';
import type { SubscriptionPlan } from '../../utils/constants';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import LoadingSpinner from '../animations/LoadingSpinner';

interface CurrentPlanCardProps {
  companyId: string;
  onUpgradeClick?: () => void;
}

export default function CurrentPlanCard({ companyId, onUpgradeClick }: CurrentPlanCardProps) {
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('BASIC');
  const [limits, setLimits] = useState<any>(null);

  useEffect(() => {
    loadSubscription();
  }, [companyId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const subscription = await getCompanySubscription(companyId);
      setCurrentPlan(subscription.currentPlan);
      setLimits(subscription.limits);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  const planDetails = SUBSCRIPTION_PLANS_DETAILS[currentPlan];
  const recommendedUpgrade = getRecommendedUpgrade(currentPlan);

  const getPlanColor = (plan: SubscriptionPlan) => {
    const colors = {
      BASIC: 'bg-gray-100 text-gray-800 border-gray-300',
      STARTER: 'bg-blue-100 text-blue-800 border-blue-300',
      PRO: 'bg-purple-100 text-purple-800 border-purple-300',
      BUSINESS: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      ENTERPRISE: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[plan];
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    if (plan === 'PRO' || plan === 'BUSINESS' || plan === 'ENTERPRISE') {
      return <Crown className="w-5 h-5" />;
    }
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-200 ${getPlanColor(currentPlan)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getPlanIcon(currentPlan)}
            <div>
              <h3 className="text-lg font-semibold">{planDetails.name}</h3>
              <p className="text-sm opacity-80">{planDetails.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{planDetails.price}</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Características incluidas:</h4>
        <ul className="space-y-2">
          {planDetails.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Limits Summary */}
      {limits && (
        <div className="px-6 pb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Límites de tu plan:</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Profesionales</p>
              <p className="text-lg font-semibold text-gray-900">
                {limits.professionals === Infinity ? '∞' : limits.professionals}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Servicios</p>
              <p className="text-lg font-semibold text-gray-900">
                {limits.services === Infinity ? '∞' : limits.services}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Productos</p>
              <p className="text-lg font-semibold text-gray-900">
                {limits.products === Infinity ? '∞' : limits.products}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Horarios</p>
              <p className="text-lg font-semibold text-gray-900">
                {limits.serviceSchedules === Infinity ? '∞' : limits.serviceSchedules}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {recommendedUpgrade && onUpgradeClick && (
        <div className="px-6 pb-6">
          <button
            onClick={onUpgradeClick}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <ArrowUpCircle className="w-5 h-5" />
            Actualizar a {SUBSCRIPTION_PLANS_DETAILS[recommendedUpgrade].name}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Desbloquea más funciones y límites superiores
          </p>
        </div>
      )}

      {/* Already on highest plan */}
      {!recommendedUpgrade && currentPlan === 'ENTERPRISE' && (
        <div className="px-6 pb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <Crown className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-900">
                ¡Tienes el plan más completo!
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Disfrutas de todas las funciones sin límites.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
