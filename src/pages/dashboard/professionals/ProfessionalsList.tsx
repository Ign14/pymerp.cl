import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { deleteProfessional, getSubscriptionLimits } from '../../../services/appointments';
import { listenProfessionals } from '../../../services/professionals';
import { getCompanySubscription, getRecommendedUpgrade } from '../../../services/subscriptions';
import { Professional } from '../../../types';
import type { SubscriptionPlan } from '../../../utils/constants';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import UpgradePrompt from '../../../components/subscription/UpgradePrompt';
import { motion } from 'framer-motion';

export default function ProfessionalsList() {
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [subscriptionLimits, setSubscriptionLimits] = useState<{
    maxProfessionals: number;
    currentProfessionals: number;
    canAddMore: boolean;
  } | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('BASIC');
  const [recommendedPlan, setRecommendedPlan] = useState<SubscriptionPlan | null>(null);

  // Cargar datos iniciales y configurar listener en tiempo real
  useEffect(() => {
    const companyId = firestoreUser?.company_id;
    if (!companyId) return;

    let unsubscribe: (() => void) | undefined;

    const loadData = async () => {
      try {
        // Cargar límites y suscripción una sola vez
        const [limits, subscription] = await Promise.all([
          getSubscriptionLimits(companyId),
          getCompanySubscription(companyId),
        ]);
        setSubscriptionLimits(limits);
        setCurrentPlan(subscription.currentPlan);
        setRecommendedPlan(getRecommendedUpgrade(subscription.currentPlan));

        // Configurar listener en tiempo real para profesionales
        // Esto actualizará automáticamente cuando se cree/modifique/elimine un profesional
        unsubscribe = listenProfessionals(companyId, (data) => {
          setProfessionals(data);
          setLoading(false);
        });
      } catch (error) {
        handleError(error);
        setLoading(false);
      }
    };

    loadData();

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firestoreUser?.company_id]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteProfessional(id);
      toast.success('Profesional eliminado');
      // No necesitamos llamar loadProfessionals() porque el listener en tiempo real
      // actualizará automáticamente la lista
    } catch (error) {
      handleError(error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
                aria-label="Volver"
              >
                ←
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profesionales</h1>
                {subscriptionLimits && (
                  <p className="text-sm text-gray-600 mt-1">
                    {subscriptionLimits.currentProfessionals} de {subscriptionLimits.maxProfessionals} profesionales activos
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (subscriptionLimits && !subscriptionLimits.canAddMore) {
                  setShowUpgradePrompt(true);
                  return;
                }
                navigate('/dashboard/professionals/new');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              aria-label="Agregar nuevo profesional"
            >
              + Nuevo profesional
            </button>
          </div>

          {/* Limit Warning */}
          {subscriptionLimits && !subscriptionLimits.canAddMore && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-label="Warning">
                  ⚠️
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    Límite de profesionales alcanzado
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Has alcanzado el límite de {subscriptionLimits.maxProfessionals} profesionales activos de tu plan actual.
                    Para agregar más profesionales, actualiza tu suscripción.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/features')}
                    className="mt-2 text-sm text-yellow-900 hover:text-yellow-700 underline font-medium"
                  >
                    Ver planes disponibles →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl" role="img" aria-label="Info">
                💡
              </span>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Gestiona tu equipo de trabajo
                </h3>
                <p className="text-sm text-blue-800">
                  Agrega profesionales para que puedan recibir citas. Cada profesional puede tener
                  horarios y especialidades específicas.
                </p>
              </div>
            </div>
          </div>

          {/* List */}
          {professionals.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No hay profesionales registrados
              </h2>
              <p className="text-gray-600 mb-6">
                Comienza agregando tu primer profesional para poder gestionar citas.
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/professionals/new')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Agregar profesional
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionals.map((professional) => (
                <motion.div
                  key={professional.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Avatar */}
                  <div className="flex items-start gap-4 mb-4">
                    {professional.avatar_url ? (
                      <img
                        src={professional.avatar_url}
                        alt={professional.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {professional.name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          professional.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {professional.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {professional.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📧</span>
                        <span className="truncate">{professional.email}</span>
                      </div>
                    )}
                    {professional.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📱</span>
                        <span>{professional.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Specialties */}
                  {professional.specialties && professional.specialties.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Especialidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {professional.specialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/professionals/edit/${professional.id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(professional.id, professional.name)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && recommendedPlan && (
        <UpgradePrompt
          currentPlan={currentPlan}
          recommendedPlan={recommendedPlan}
          reason="Has alcanzado el límite de profesionales de tu plan actual."
          onClose={() => setShowUpgradePrompt(false)}
          onContactSupport={() => {
            setShowUpgradePrompt(false);
            toast.success('Redirigiendo a soporte...');
          }}
        />
      )}
    </div>
  );
}
