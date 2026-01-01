import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getCompany } from '../../services/firestore';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import SubscriptionManager from '../../components/admin/SubscriptionManager';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import type { Company } from '../../types';
import type { SubscriptionPlan } from '../../utils/constants';

export default function ManageSubscriptions() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const companyData = await getCompany(companyId);
      setCompany(companyData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpdated = () => {
    // Reload company data to get updated plan
    loadCompany();
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Empresa no encontrada</h2>
          <button
            onClick={() => navigate('/admin')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Volver al panel de administración
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al panel
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestionar Suscripción
          </h1>
        </div>

        {/* Subscription Manager */}
        <SubscriptionManager
          companyId={company.id}
          companyName={company.name}
          currentPlan={(company.subscription_plan || 'BASIC') as SubscriptionPlan}
          onPlanUpdated={handlePlanUpdated}
        />
      </div>
    </div>
  );
}

