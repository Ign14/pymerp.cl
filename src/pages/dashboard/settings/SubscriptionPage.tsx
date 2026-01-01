import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CurrentPlanCard from '../../../components/subscription/CurrentPlanCard';

export default function SubscriptionPage() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    // Open contact via WhatsApp
    const message = encodeURIComponent(
      'Hola, me gustaría actualizar mi plan de suscripción.'
    );
    window.open(`https://wa.me/56912345678?text=${message}`, '_blank');
  };

  if (!firestoreUser?.company_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No se encontró información de la empresa</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Volver al dashboard
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
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mi Suscripción
          </h1>
          <p className="text-gray-600">
            Gestiona tu plan y límites de recursos
          </p>
        </div>

        {/* Current Plan Card */}
        <CurrentPlanCard
          companyId={firestoreUser.company_id}
          onUpgradeClick={handleUpgradeClick}
        />

        {/* Additional Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ¿Necesitas más recursos?
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            Si has alcanzado los límites de tu plan actual, puedes actualizar a un plan superior 
            para obtener más profesionales, servicios y productos.
          </p>
          <button
            onClick={handleUpgradeClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ver opciones de actualización
          </button>
        </div>

        {/* Contact Support */}
        <div className="mt-6 bg-gray-100 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Tienes preguntas?
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Nuestro equipo está disponible para ayudarte con cualquier consulta sobre planes y facturación.
          </p>
          <a
            href="https://wa.me/56912345678?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20plan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

