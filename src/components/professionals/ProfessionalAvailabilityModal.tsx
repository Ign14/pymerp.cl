import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  getAllProfessionalAvailability,
  setProfessionalAvailability,
  deleteAllProfessionalAvailability,
} from '../../services/appointments';
import type { Professional } from '../../types';
import toast from 'react-hot-toast';
import { X, Clock, Calendar } from 'lucide-react';
import LoadingSpinner from '../animations/LoadingSpinner';

interface ProfessionalAvailabilityModalProps {
  professional: Professional;
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

interface DayAvailability {
  day_of_week: number;
  enabled: boolean;
  start_time: string;
  end_time: string;
}

export default function ProfessionalAvailabilityModal({
  professional,
  isOpen,
  onClose,
}: ProfessionalAvailabilityModalProps) {
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availabilities, setAvailabilities] = useState<DayAvailability[]>([]);

  useEffect(() => {
    if (isOpen && professional.id) {
      // Inicializar con valores por defecto primero
      const initialAvailabilities: DayAvailability[] = DAYS_OF_WEEK.map(day => ({
        day_of_week: day.value,
        enabled: false,
        start_time: '09:00',
        end_time: '18:00',
      }));
      setAvailabilities(initialAvailabilities);
      loadAvailabilities();
    } else {
      // Resetear cuando se cierra
      setAvailabilities([]);
    }
  }, [isOpen, professional.id]);

  const loadAvailabilities = async () => {
    if (!professional.id) return;
    
    setLoading(true);
    try {
      // Usar getAllProfessionalAvailability que no requiere filtro is_available
      // y filtra solo los activos manualmente
      const allAvailabilities = await getAllProfessionalAvailability(professional.id);
      const existing = allAvailabilities.filter(av => av.is_available);
      
      // Inicializar todos los días con los datos existentes
      const initialAvailabilities: DayAvailability[] = DAYS_OF_WEEK.map(day => {
        const existingDay = existing.find(av => av.day_of_week === day.value);
        return {
          day_of_week: day.value,
          enabled: !!existingDay,
          start_time: existingDay?.start_time || '09:00',
          end_time: existingDay?.end_time || '18:00',
        };
      });
      
      setAvailabilities(initialAvailabilities);
    } catch (error: any) {
      // Si hay error de permisos, mostrar mensaje más amigable
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        console.warn('No se pudieron cargar los horarios existentes. Continuando con valores por defecto.');
        // Continuar con valores por defecto en lugar de mostrar error
      } else {
        handleError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (index: number) => {
    if (index < 0 || index >= availabilities.length) {
      console.error('Invalid index:', index, 'availabilities length:', availabilities.length);
      return;
    }
    const updated = [...availabilities];
    if (updated[index]) {
      updated[index].enabled = !updated[index].enabled;
      setAvailabilities(updated);
    }
  };

  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    if (index < 0 || index >= availabilities.length || !availabilities[index]) {
      console.error('Invalid index:', index, 'availabilities length:', availabilities.length);
      return;
    }
    const updated = [...availabilities];
    if (updated[index]) {
      updated[index][field] = value;
      
      // Validar que start_time < end_time
      if (field === 'start_time' && updated[index].end_time && value >= updated[index].end_time) {
        toast.error('La hora de inicio debe ser menor que la hora de fin');
        return;
      }
      if (field === 'end_time' && updated[index].start_time && value <= updated[index].start_time) {
        toast.error('La hora de fin debe ser mayor que la hora de inicio');
        return;
      }
      
      setAvailabilities(updated);
    }
  };

  const handleSave = async () => {
    if (!firestoreUser?.company_id) {
      toast.error('Error de autenticación');
      return;
    }

    const companyId = firestoreUser.company_id;
    if (!companyId) {
      toast.error('Error: No se encontró el ID de la empresa');
      return;
    }

    setSaving(true);
    try {
      // Eliminar todas las disponibilidades existentes
      await deleteAllProfessionalAvailability(professional.id);

      // Crear nuevas disponibilidades solo para los días habilitados
      const enabledDays = availabilities.filter(av => av.enabled);
      
      if (enabledDays.length === 0) {
        toast.success('Horarios actualizados (sin días disponibles)');
        onClose();
        return;
      }

      const createPromises = enabledDays.map(day =>
        setProfessionalAvailability({
          professional_id: professional.id,
          company_id: companyId,
          day_of_week: day.day_of_week,
          start_time: day.start_time,
          end_time: day.end_time,
          is_available: true,
        })
      );

      await Promise.all(createPromises);
      toast.success('Horarios disponibles guardados exitosamente');
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-5 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-white" />
              <h3 className="text-lg font-medium text-white">
                Horarios disponibles - {professional.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona los días y horarios en los que {professional.name} está disponible para recibir citas.
                </p>

                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const availability = availabilities[index] || {
                      day_of_week: day.value,
                      enabled: false,
                      start_time: '09:00',
                      end_time: '18:00',
                    };
                    return (
                      <div
                        key={day.value}
                        className={`border rounded-lg p-4 ${
                          availability.enabled
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={availability.enabled}
                              onChange={() => handleToggleDay(index)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="font-medium text-gray-900">{day.label}</span>
                          </label>
                        </div>

                        {availability.enabled && (
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Hora inicio
                              </label>
                              <input
                                type="time"
                                value={availability.start_time}
                                onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Hora fin
                              </label>
                              <input
                                type="time"
                                value={availability.end_time}
                                onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar horarios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

