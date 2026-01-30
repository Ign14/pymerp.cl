import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import { BusinessType } from '../../types';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export default function SetupSocialLinks() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
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
      } else {
        // Si no hay business_type, redirigir al paso anterior
        navigate('/setup/business-type');
        return;
      }
      
      // Cargar redes sociales existentes
      const socialLinks = company?.social_links || company?.socialLinks;
      if (socialLinks) {
        setFacebookUrl(socialLinks.facebook || '');
        setInstagramUrl(socialLinks.instagram || '');
      }
    } catch (error) {
      handleError(error, { context: { action: 'loadCompany' } });
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true; // URL vacía es válida (opcional)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar URLs
    if (facebookUrl.trim() && !validateUrl(facebookUrl)) {
      toast.error('La URL de Facebook no es válida. Debe comenzar con http:// o https://');
      return;
    }

    if (instagramUrl.trim() && !validateUrl(instagramUrl)) {
      toast.error('La URL de Instagram no es válida. Debe comenzar con http:// o https://');
      return;
    }

    setSaving(true);

    try {
      if (firestoreUser?.company_id) {
        // Construir objeto socialLinks solo con valores definidos (sin undefined)
        const socialLinks: { facebook?: string; instagram?: string } = {};
        const trimmedFacebook = facebookUrl.trim();
        const trimmedInstagram = instagramUrl.trim();
        
        if (trimmedFacebook) {
          socialLinks.facebook = trimmedFacebook;
        }
        if (trimmedInstagram) {
          socialLinks.instagram = trimmedInstagram;
        }

        // Actualizar en companies (la sincronización a companies_public se hace automáticamente)
        await updateCompany(firestoreUser.company_id, {
          social_links: socialLinks,
          setup_completed: true,
        });

        toast.success('Redes sociales guardadas');

        // Navegar al dashboard según el tipo de negocio
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

  if (!businessType) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => navigate('/setup/category')}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Paso 6: Redes sociales (opcional)</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Agrega tus redes sociales para que los clientes puedan encontrarte. Este paso es opcional.
            </p>
          </div>

          <div>
            <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              id="facebook"
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://www.facebook.com/tu-pagina"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">URL completa de tu página de Facebook</p>
          </div>

          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              id="instagram"
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/tu-cuenta"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">URL completa de tu perfil de Instagram</p>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/setup/category')}
              className="px-6 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300"
            >
              Anterior
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Finalizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
