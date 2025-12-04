import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getScheduleSlots,
  createScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
  getCompany,
} from '../../../services/firestore';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getPlanLabel, getSubscriptionLimit, TIME_INPUT_STEP_SECONDS } from '../../../utils/constants';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_NAMES: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export default function ServicesSchedules() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [slots, setSlots] = useState<any[]>([]);
  const [company, setCompany] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [formData, setFormData] = useState({
    days_of_week: [] as string[],
    start_time: '',
    end_time: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const [companyData, data] = await Promise.all([
        getCompany(firestoreUser.company_id),
        getScheduleSlots(firestoreUser.company_id),
      ]);
      setCompany(companyData);
      setSlots(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const getSlotLimit = () => getSubscriptionLimit('serviceSchedules', company?.subscription_plan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.days_of_week.length === 0) {
      toast.error('Selecciona al menos un día');
      return;
    }

    if (!firestoreUser?.company_id) return;

    if (slots.length >= getSlotLimit() && !editingSlot) {
      const planLabel = getPlanLabel(company?.subscription_plan);
      toast.error(`Tu plan ${planLabel} no permite más horarios`);
      return;
    }

    try {
      if (editingSlot) {
        await updateScheduleSlot(editingSlot.id, {
          ...formData,
          company_id: firestoreUser.company_id,
        });
        toast.success('Horario actualizado');
      } else {
        await createScheduleSlot({
          ...formData,
          company_id: firestoreUser.company_id,
        });
        toast.success('Horario creado');
      }
      
      setShowForm(false);
      setEditingSlot(null);
      setFormData({
        days_of_week: [],
        start_time: '',
        end_time: '',
        status: 'ACTIVE',
      });
      await loadSlots();
    } catch (error) {
      toast.error('Error al guardar');
      handleError(error);
    }
  };

  const handleEdit = (slot: any) => {
    setEditingSlot(slot);
    setFormData({
      days_of_week: slot.days_of_week || [],
      start_time: slot.start_time || '',
      end_time: slot.end_time || '',
      status: slot.status || 'ACTIVE',
    });
    setShowForm(true);
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return;

    try {
      await deleteScheduleSlot(slotId);
      toast.success('Horario eliminado');
      await loadSlots();
    } catch (error) {
      toast.error('Error al eliminar');
      handleError(error);
    }
  };

  const toggleDay = (day: string) => {
    if (formData.days_of_week.includes(day)) {
      setFormData({
        ...formData,
        days_of_week: formData.days_of_week.filter(d => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        days_of_week: [...formData.days_of_week, day],
      });
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
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label="Volver"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Horarios</h1>
          </div>
          {!showForm && slots.length < getSlotLimit() && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Nuevo horario
            </button>
          )}
        </div>
        {slots.length >= getSlotLimit() && getSlotLimit() !== Infinity && (
          <div className="mb-4 text-sm text-red-600">
            Alcanzaste el máximo de horarios para tu plan {company?.subscription_plan || 'actual'}.
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana *</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-md ${
                      formData.days_of_week.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-blue-800 hover:bg-gray-300'
                    }`}
                  >
                    {DAY_NAMES[day]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio *</label>
                <input
                  type="time"
                  required
                  step={TIME_INPUT_STEP_SECONDS}
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin *</label>
                <input
                  type="time"
                  required
                  step={TIME_INPUT_STEP_SECONDS}
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSlot(null);
                  setFormData({
                    days_of_week: [],
                    start_time: '',
                    end_time: '',
                    status: 'ACTIVE',
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingSlot ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {slots.length} / {getSlotLimit() === Infinity ? '∞' : getSlotLimit()} horarios creados
            </p>
          </div>
          <div className="divide-y">
            {slots.map(slot => (
              <div key={slot.id} className="p-6 flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {slot.days_of_week?.map((d: string) => DAY_NAMES[d]).join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {slot.start_time} - {slot.end_time}
                  </div>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded badge-light ${
                    slot.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {slot.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(slot)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {slots.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No hay horarios configurados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
