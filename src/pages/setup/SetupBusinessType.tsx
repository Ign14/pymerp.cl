import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import { BusinessType } from '../../types';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export default function SetupBusinessType() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [businessType, setBusinessType] = useState<BusinessType | ''>('');
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
      if (company?.business_type) {
        setBusinessType(company.business_type);
      }
    } catch (error) {
      handleError(error, { context: { action: 'loadCompany' } });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessType) {
      toast.error('Debes seleccionar un tipo de negocio');
      return;
    }

    setSaving(true);

    try {
      if (firestoreUser?.company_id) {
        await updateCompany(firestoreUser.company_id, {
          business_type: businessType,
          setup_completed: true,
        });
        toast.success('Configuración completada');
        
        if (businessType === BusinessType.SERVICES) {
          navigate('/dashboard/services');
        } else {
          navigate('/dashboard/products');
        }
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
          <h2 className="text-3xl font-bold text-gray-900">Paso 4: Tipo de negocio</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Tipo de negocio *
            </label>
            <div className="space-y-4">
              <label
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  businessType === BusinessType.SERVICES
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="businessType"
                  value={BusinessType.SERVICES}
                  checked={businessType === BusinessType.SERVICES}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Servicios</div>
                  <div className={`text-sm ${businessType === BusinessType.SERVICES ? 'text-blue-900' : 'text-gray-600'}`}>
                    Ofreces servicios que se agendan por horarios
                  </div>
                </div>
              </label>
              
              <label
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  businessType === BusinessType.PRODUCTS
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="businessType"
                  value={BusinessType.PRODUCTS}
                  checked={businessType === BusinessType.PRODUCTS}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Productos</div>
                  <div className={`text-sm ${businessType === BusinessType.PRODUCTS ? 'text-blue-900' : 'text-gray-600'}`}>
                    Vendes productos físicos o digitales
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/setup/company-info')}
              className="px-6 py-2 bg-gray-200 text-blue-900 rounded-md hover:bg-gray-300"
            >
              Anterior
            </button>
            <button
              type="submit"
              disabled={saving || !businessType}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Finalizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
