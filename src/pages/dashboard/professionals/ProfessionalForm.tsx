import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import {
  updateProfessional,
  getProfessional,
} from '../../../services/appointments';
import { createProfessional } from '../../../services/professionals';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { motion } from 'framer-motion';

export default function ProfessionalForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
    specialties: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    if (id) {
      loadProfessional();
    }
  }, [id]);

  const loadProfessional = async () => {
    if (!id) return;

    try {
      const data = await getProfessional(id);
      if (data) {
        setFormData({
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          specialties: data.specialties || [],
          status: data.status,
        });
      }
    } catch (error) {
      handleError(error);
      navigate('/dashboard/professionals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecialty = () => {
    const specialty = specialtyInput.trim();
    if (!specialty) return;
    if (formData.specialties.includes(specialty)) {
      toast.error('Esta especialidad ya está agregada');
      return;
    }
    setFormData({
      ...formData,
      specialties: [...formData.specialties, specialty],
    });
    setSpecialtyInput('');
  };

  const handleRemoveSpecialty = (index: number) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firestoreUser?.company_id) {
      toast.error('Error de autenticación');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);

    try {
      const professionalData = {
        company_id: firestoreUser.company_id,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        avatar_url: formData.avatar_url.trim() || undefined,
        specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
        status: formData.status,
      };

      if (id) {
        await updateProfessional(id, professionalData);
        toast.success('Profesional actualizado');
      } else {
        await createProfessional({
          companyId: firestoreUser.company_id,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          avatar_url: formData.avatar_url.trim() || undefined,
          specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
          status: formData.status,
        });
        toast.success('Profesional creado');
      }

      navigate('/dashboard/professionals');
    } catch (error: any) {
      const code = (error as any)?.code || '';
      const message = (error as any)?.message || '';

      if (message.startsWith('LIMIT_REACHED:')) {
        toast.error(message.replace('LIMIT_REACHED:', ''));
      } else if (code === 'PRO_LIMIT_REACHED') {
        toast.error('Alcanzaste el límite de profesionales de tu plan. Actualiza tu suscripción para agregar más.');
      } else {
        handleError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg p-6"
        >
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/professionals')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label="Volver"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Editar profesional' : 'Nuevo profesional'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Información básica</h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="+56912345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL de avatar (opcional)
                </label>
                <input
                  type="url"
                  id="avatar_url"
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                  }
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Los profesionales inactivos no aparecerán en el sistema de citas
                </p>
              </div>
            </div>

            {/* Specialties */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Especialidades</h2>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Ej: Corte de cabello, Manicure, etc."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpecialty();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSpecialty}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  Agregar
                </button>
              </div>

              {formData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(idx)}
                        className="hover:text-blue-900"
                        aria-label={`Eliminar ${specialty}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Guardando...' : id ? 'Actualizar' : 'Crear profesional'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/professionals')}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
          </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
