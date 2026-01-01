import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export default function SetupCompanyInfo() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [formData, setFormData] = useState({
    description: '',
    show_description: true,
    mission: '',
    vision: '',
    show_mission_vision: true,
    booking_message: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    if (!firestoreUser?.company_id) {
      setLoading(false);
      return;
    }

    try {
      const company = await getCompany(firestoreUser.company_id);
      if (company) {
        setFormData({
          description: company.description || '',
          show_description: company.show_description ?? true,
          mission: company.mission || '',
          vision: company.vision || '',
          show_mission_vision: company.show_mission_vision ?? true,
          booking_message: company.booking_message || '',
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (firestoreUser?.company_id) {
        await updateCompany(firestoreUser.company_id, {
          description: formData.description,
          show_description: formData.show_description,
          mission: formData.mission,
          vision: formData.vision,
          show_mission_vision: formData.show_mission_vision,
          booking_message: formData.booking_message,
        });
        toast.success('Información guardada');
        navigate('/setup/business-type');
      }
    } catch (error) {
      toast.error('Error al guardar');
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Paso 3: Información corporativa</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📋 Descripción de la empresa
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe tu empresa, qué hace, qué ofrece, su historia, valores, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">Esta descripción aparecerá en tu página pública antes de la misión y visión</p>
          </div>

          <div className="flex items-center">
            <input
              id="show-description"
              type="checkbox"
              checked={formData.show_description}
              onChange={(e) => setFormData({ ...formData, show_description: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show-description" className="ml-2 block text-sm text-gray-700">
              Mostrar descripción en la página pública
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Misión
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visión
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.vision}
              onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <input
              id="show-mission-vision"
              type="checkbox"
              checked={formData.show_mission_vision}
              onChange={(e) => setFormData({ ...formData, show_mission_vision: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show-mission-vision" className="ml-2 block text-sm text-gray-700">
              Mostrar misión y visión en la página pública
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje para agendar/comprar
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: ¡Hola! Quiero agendar un servicio..."
              value={formData.booking_message}
              onChange={(e) => setFormData({ ...formData, booking_message: e.target.value })}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/setup/company-location')}
              className="px-6 py-2 bg-gray-200 text-blue-900 rounded-md hover:bg-gray-300"
            >
              Anterior
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Siguiente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
