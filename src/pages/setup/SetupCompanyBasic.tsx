import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { generateSlug } from '../../utils/slug';
import { env } from '../../config/env';
import {
  validateRequired,
  validateRut,
  validatePhone,
  validateFields,
} from '../../services/errorHelpers';

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
    externalWebsiteUrl: '',
    externalWebsiteEnabled: false,
    slug: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          externalWebsiteUrl: company.externalWebsiteUrl || '',
          externalWebsiteEnabled:
            company.externalWebsiteEnabled ?? Boolean(company.externalWebsiteUrl),
          slug: company.slug || '',
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
    setErrors({});

    // Validación con helpers
    const validationErrors = validateFields({
      name: {
        value: formData.name,
        validators: [validateRequired],
      },
      rut: {
        value: formData.rut,
        validators: [(v) => validateRut(v, true)],
      },
      industry: {
        value: formData.industry,
        validators: [validateRequired],
      },
      whatsapp: {
        value: formData.whatsapp,
        validators: [(v) => validatePhone(v, true)],
      },
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

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
          externalWebsiteUrl: formData.externalWebsiteUrl.trim() || '',
          externalWebsiteEnabled:
            formData.externalWebsiteEnabled && Boolean(formData.externalWebsiteUrl.trim()),
          slug: formData.slug,
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

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo al editar
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.name
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                Campo requerido
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.rut
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              value={formData.rut}
              onChange={(e) => handleFieldChange('rut', e.target.value)}
              placeholder="12.345.678-9"
              aria-invalid={!!errors.rut}
              aria-describedby={errors.rut ? 'rut-error' : undefined}
            />
            {errors.rut && (
              <p id="rut-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.rut === 'required-field' ? 'Campo requerido' : 'RUT inválido (formato: 12.345.678-9)'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rubro *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.industry
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              value={formData.industry}
              onChange={(e) => handleFieldChange('industry', e.target.value)}
              placeholder="Ej: Belleza, Restaurante, Consultoría"
              aria-invalid={!!errors.industry}
              aria-describedby={errors.industry ? 'industry-error' : undefined}
            />
            {errors.industry && (
              <p id="industry-error" className="mt-1 text-sm text-red-600" role="alert">
                Campo requerido
              </p>
            )}
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                errors.whatsapp
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="+56912345678"
            value={formData.whatsapp}
            onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
              aria-invalid={!!errors.whatsapp}
              aria-describedby={errors.whatsapp ? 'whatsapp-error' : undefined}
          />
            {errors.whatsapp && (
              <p id="whatsapp-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.whatsapp === 'required-field' ? 'Campo requerido' : 'Teléfono inválido'}
              </p>
            )}
        </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center">
              <input
                id="external-website-enabled"
                type="checkbox"
                checked={formData.externalWebsiteEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, externalWebsiteEnabled: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="external-website-enabled" className="ml-2 block text-sm text-gray-700">
                Usar sitio web personal en mi ficha pública
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link de tu sitio web personal
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="https://tusitio.com"
                value={formData.externalWebsiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, externalWebsiteUrl: e.target.value })
                }
                disabled={!formData.externalWebsiteEnabled}
              />
              <p className="mt-1 text-xs text-gray-500">
                Si lo activas, en el mapa de PYMEs se abrirá tu sitio externo en lugar de la página pública.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug de tu URL pública *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Así se verá tu enlace público: {env.publicBaseUrl}/<strong>{formData.slug || 'tu-slug'}</strong>
            </p>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="ej: mi-negocio-unico"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: generateSlug(e.target.value) })
              }
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
