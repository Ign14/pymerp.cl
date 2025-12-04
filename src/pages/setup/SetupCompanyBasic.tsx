import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export default function SetupCompanyBasic() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [formData, setFormData] = useState({
    name: '',
    rut: '',
    industry: '',
    sector: '',
    seo_keyword: '',
    whatsapp: '',
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
          name: company.name || '',
          rut: company.rut || '',
          industry: company.industry || '',
          sector: company.sector || '',
          seo_keyword: company.seo_keyword || '',
          whatsapp: company.whatsapp || '',
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
          name: formData.name,
          rut: formData.rut,
          industry: formData.industry,
          sector: formData.sector,
          seo_keyword: formData.seo_keyword,
          whatsapp: formData.whatsapp.replace(/\D/g, ''),
        });
      } else {
        // Should not happen, but handle it
        toast.error('Error: No hay empresa asociada');
        return;
      }

      toast.success('Datos guardados');
      navigate('/setup/company-location');
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
          <h2 className="text-3xl font-bold text-gray-900">Paso 1: Datos básicos de la empresa</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la empresa *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rubro *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Salud, Educación, Tecnología"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Palabra o frase clave (SEO) *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: dentista en Santiago, clases de yoga online"
              value={formData.seo_keyword}
              onChange={(e) => setFormData({ ...formData, seo_keyword: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono WhatsApp principal *
            </label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="+56912345678"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />
          </div>

          <div className="flex justify-end">
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
