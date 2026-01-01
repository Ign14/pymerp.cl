import { useNavigate } from 'react-router-dom';
import ProfessionalForm from '../../../components/professionals/ProfessionalForm';
import { ArrowLeft } from 'lucide-react';

export default function ProfessionalsNewPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard/professionals');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <ProfessionalForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}
