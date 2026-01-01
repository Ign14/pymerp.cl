import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAnalytics } from '../../hooks/useAnalytics';
import { createProfessional } from '../../services/professionals';
import { isServiceError, ServiceErrorCode } from '../../services/errorHelpers';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface ProfessionalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProfessionalForm({ onSuccess, onCancel }: ProfessionalFormProps) {
  const { firestoreUser } = useAuth();
  const { handleAsyncError } = useErrorHandler();
  const { trackEvent } = useAnalytics();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!firestoreUser?.company_id) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !firestoreUser?.company_id) return;

    setLoading(true);

    try {
      await handleAsyncError(async () => {
        const specialtiesArray = formData.specialties
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        await createProfessional({
          companyId: firestoreUser.company_id!,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          specialties: specialtiesArray.length > 0 ? specialtiesArray : undefined,
        });

        trackEvent('professional_created', {
          company_id: firestoreUser.company_id,
          has_email: !!formData.email,
          has_phone: !!formData.phone,
          specialties_count: specialtiesArray.length,
        });

        toast.success('Profesional creado exitosamente');
        onSuccess?.();
      });
    } catch (error: any) {
      if (isServiceError(error, ServiceErrorCode.PRO_LIMIT_REACHED)) {
        toast.error('Has alcanzado el límite de profesionales de tu plan. Actualiza para agregar más.', {
          duration: 5000,
        });
      } else {
        toast.error('Error al crear profesional. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Profesional</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Dr. Juan Pérez"
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email (opcional)
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="juan@ejemplo.cl"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+56912345678"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.phone
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="specialties" className="block text-sm font-medium text-gray-700">
              Especialidades (opcional)
            </label>
            <input
              type="text"
              id="specialties"
              value={formData.specialties}
              onChange={(e) => handleChange('specialties', e.target.value)}
              placeholder="Corte, Peinado, Manicure (separadas por comas)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Separa múltiples especialidades con comas
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : 'hidden'}`} />
          <span>{loading ? 'Creando...' : 'Crear Profesional'}</span>
        </button>
      </div>
    </form>
  );
}
