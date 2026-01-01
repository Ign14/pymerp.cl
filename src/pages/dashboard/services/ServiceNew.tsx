import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createService,
  updateService,
  getService,
  getServiceSchedules,
  setServiceSchedules,
  getScheduleSlots,
} from '../../../services/firestore';
import { listProfessionals } from '../../../services/professionals';
import { uploadImage } from '../../../services/storage';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import {
  DEFAULT_IMAGE_UPLOAD_CONFIG,
  IMAGE_UPLOAD_RECOMMENDATION,
} from '../../../utils/constants';
import { Professional } from '../../../types';

export default function ServiceNew() {
  const { id } = useParams();
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const draftKey = useMemo(() => {
    if (!firestoreUser?.company_id || id) return null;
    return `service-form-draft-${firestoreUser.company_id}`;
  }, [firestoreUser?.company_id, id]);
  // TODO: Implement error handling - const { handleError, handleAuthError, handleFirestoreError } = useErrorHandler();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    estimated_duration_minutes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Variables comentadas (no necesarias sin validación de límites)
  // const [company, setCompany] = useState<any | null>(null);
  // const [serviceCount, setServiceCount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [id, firestoreUser?.company_id]);

  useEffect(() => {
    if (!draftKey) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) return;

    try {
      const { formData: savedForm, selectedSlots: savedSlots } = JSON.parse(savedDraft);
      if (savedForm) setFormData(savedForm);
      if (savedSlots) setSelectedSlots(savedSlots);
    } catch (error) {
      handleError(error, { customMessage: 'Error leyendo borrador de servicio' });
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    localStorage.setItem(draftKey, JSON.stringify({ formData, selectedSlots }));
  }, [draftKey, formData, selectedSlots]);

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;
    setLoading(true);

    try {
      const [slots, professionalsList] = await Promise.all([
        getScheduleSlots(firestoreUser.company_id),
        listProfessionals(firestoreUser.company_id),
      ]);
      // Carga simplificada (sin validación de límites)
      // const companyData = await getCompany(firestoreUser.company_id);
      // const servicesList = await getServices(firestoreUser.company_id);
      // setCompany(companyData);
      // setServiceCount(servicesList.length);
      setScheduleSlots(slots);
      setProfessionals(professionalsList);

      if (id) {
        const service = await getService(id);
        if (service) {
          setFormData({
            name: service.name,
            description: service.description,
            price: service.price.toString(),
            image_url: service.image_url,
            estimated_duration_minutes: service.estimated_duration_minutes.toString(),
            status: service.status,
          });

          const serviceSchedules = await getServiceSchedules(id);
          setSelectedSlots(serviceSchedules.map(ss => ss.schedule_slot_id));
          setSelectedProfessionals(service.professional_ids || []);
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!firestoreUser?.company_id) return;

    try {
      const path = `companies/${firestoreUser.company_id}/services/${Date.now()}`;
      const url = await uploadImage(file, path, DEFAULT_IMAGE_UPLOAD_CONFIG);
      setFormData({ ...formData, image_url: url });
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error('Error al subir imagen');
      handleError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firestoreUser?.company_id) return;

    if (selectedSlots.length === 0) {
      toast.error('Debes seleccionar al menos un horario');
      return;
    }

    if (selectedProfessionals.length === 0) {
      toast.error('Debes asignar al menos un profesional');
      return;
    }

    // LÍMITES DESHABILITADOS: Sin restricciones hasta implementar sistema de cobro
    /* VALIDACIÓN DE LÍMITES COMENTADA:
    const serviceLimit = getSubscriptionLimit('services', company?.subscription_plan);
    if (!id && serviceCount >= serviceLimit) {
      const planLabel = getPlanLabel(company?.subscription_plan);
      toast.error(`Tu plan ${planLabel} no permite más servicios`);
      return;
    }
    */

    setSaving(true);
    try {
      const serviceData = {
        company_id: firestoreUser.company_id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        estimated_duration_minutes: parseInt(formData.estimated_duration_minutes),
        status: formData.status,
        professional_ids: selectedProfessionals,
      };

      console.log('🔵 SERVICE DATA:', serviceData);
      console.log('🔵 FIRESTORE USER:', firestoreUser);

      let serviceId: string;
      if (id) {
        console.log('🔵 Updating service:', id);
        await updateService(id, serviceData);
        serviceId = id;
        toast.success('Servicio actualizado');
      } else {
        console.log('🔵 Creating new service...');
        serviceId = await createService(serviceData);
        console.log('✅ Service created with ID:', serviceId);
        toast.success('Servicio creado');
        if (draftKey) localStorage.removeItem(draftKey);
      }

      console.log('🔵 Setting schedules for service:', serviceId, selectedSlots);
      await setServiceSchedules(serviceId, selectedSlots);
      navigate('/dashboard/services');
    } catch (error) {
      console.error('❌ ERROR AL GUARDAR:', error);
      console.error('❌ ERROR CODE:', (error as any)?.code);
      console.error('❌ ERROR MESSAGE:', (error as any)?.message);
      toast.error('Error al guardar');
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSlot = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const toggleProfessionalSelection = (professionalId: string) => {
    if (selectedProfessionals.includes(professionalId)) {
      setSelectedProfessionals(selectedProfessionals.filter(id => id !== professionalId));
    } else {
      setSelectedProfessionals([...selectedProfessionals, professionalId]);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const DAY_NAMES: Record<string, string> = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Editar servicio' : 'Nuevo servicio'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="service-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              id="service-name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="service-description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              id="service-description"
              name="description"
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="service-price" className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>
              <input
                id="service-price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="service-duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duración estimada (minutos) *
              </label>
              <input
                id="service-duration"
                name="estimated_duration_minutes"
                type="number"
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="service-image" className="block text-sm font-medium text-gray-700 mb-1">
              Imagen *
            </label>
            <p className="text-xs text-gray-500 mb-1">{IMAGE_UPLOAD_RECOMMENDATION}</p>
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="h-48 mb-2 rounded" />
            )}
            <input
              id="service-image"
              name="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label htmlFor="service-status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="service-status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Profesionales asignados *
              </label>
              <button
                type="button"
                onClick={() => navigate('/dashboard/professionals/new')}
                className="text-sm text-blue-700 hover:underline"
              >
                Crear profesional
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
              {professionals.map((pro) => (
                <label key={pro.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProfessionals.includes(pro.id)}
                    onChange={() => toggleProfessionalSelection(pro.id)}
                    className="accent-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{pro.name}</div>
                    {(pro.email || pro.phone) && (
                      <div className="text-xs text-gray-600">
                        {[pro.email, pro.phone].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </label>
              ))}
              {professionals.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No hay profesionales registrados. Puedes crearlos aquí mismo.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horarios disponibles * (selecciona al menos uno)
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-4">
              {scheduleSlots.filter(slot => slot.status === 'ACTIVE').map(slot => (
                <label key={slot.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer schedule-slot">
                  <input
                    type="checkbox"
                    checked={selectedSlots.includes(slot.id)}
                    onChange={() => toggleSlot(slot.id)}
                    className="mr-2"
                  />
                  <div>
                    <div className="font-medium">
                      {slot.days_of_week?.map((d: string) => DAY_NAMES[d]).join(', ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {slot.start_time} - {slot.end_time}
                    </div>
                  </div>
                </label>
              ))}
              {scheduleSlots.filter(slot => slot.status === 'ACTIVE').length === 0 && (
                <p className="text-gray-500 text-sm">
                  No hay horarios activos.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/services/schedules')}
                    className="text-blue-600 hover:underline"
                  >
                    Crear horarios
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/services/schedules')}
              className="px-6 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-md hover:bg-blue-200 w-full sm:w-auto"
            >
              Nuevo horario
            </button>
            <button
              type="button"
              onClick={() => {
                if (draftKey) localStorage.removeItem(draftKey);
                navigate('/dashboard/services');
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
