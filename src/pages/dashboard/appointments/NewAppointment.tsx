import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getServices } from '../../../services/firestore';
import {
  createManualAppointment,
  getProfessionals,
  isTimeSlotAvailable,
} from '../../../services/appointments';
import { Service, Professional, AppointmentStatus } from '../../../types';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { motion } from 'framer-motion';

export default function NewAppointment() {
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const { trackClick } = useAnalytics();
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    service_id: '',
    professional_id: '',
    appointment_date: '',
    start_time: '',
    end_time: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const [servicesData, professionalsData] = await Promise.all([
        getServices(firestoreUser.company_id),
        getProfessionals(firestoreUser.company_id),
      ]);

      setServices(servicesData);
      setProfessionals(professionalsData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData({ ...formData, service_id: serviceId });
    
    // Auto-calculate end time based on service duration
    if (formData.start_time && serviceId) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        const [hours, minutes] = formData.start_time.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + service.estimated_duration_minutes;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        setFormData((prev) => ({ ...prev, end_time: endTime }));
      }
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    setFormData({ ...formData, start_time: startTime });
    
    // Auto-calculate end time
    if (startTime && formData.service_id) {
      const service = services.find((s) => s.id === formData.service_id);
      if (service) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + service.estimated_duration_minutes;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        setFormData((prev) => ({ ...prev, end_time: endTime }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firestoreUser?.company_id || !firestoreUser?.id) {
      toast.error('Error de autenticación');
      return;
    }

    // Validations
    if (!formData.client_name.trim() || !formData.client_phone.trim()) {
      toast.error('Nombre y teléfono del cliente son obligatorios');
      return;
    }

    if (!formData.service_id || !formData.professional_id) {
      toast.error('Debes seleccionar un servicio y un profesional');
      return;
    }

    if (!formData.appointment_date || !formData.start_time || !formData.end_time) {
      toast.error('Debes seleccionar fecha y horarios');
      return;
    }

    setSubmitting(true);

    try {
      // Check slot availability
      const date = new Date(formData.appointment_date);
      const available = await isTimeSlotAvailable(
        formData.professional_id,
        date,
        formData.start_time,
        formData.end_time
      );

      if (!available) {
        toast.error('El horario seleccionado ya está ocupado. Por favor elige otro.');
        setSubmitting(false);
        return;
      }

      // Create appointment
      await createManualAppointment(
        {
          company_id: firestoreUser.company_id,
          service_id: formData.service_id,
          professional_id: formData.professional_id,
          client_name: formData.client_name.trim(),
          client_phone: formData.client_phone.trim(),
          client_email: formData.client_email.trim() || undefined,
          appointment_date: date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: AppointmentStatus.CONFIRMED,
          notes: formData.notes.trim() || undefined,
        },
        firestoreUser.id
      );

      trackClick('manual_appointment_created');
      toast.success('Cita creada exitosamente');
      navigate('/dashboard/appointments');
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              No hay servicios disponibles
            </h2>
            <p className="text-yellow-700 mb-4">
              Debes crear al menos un servicio antes de agendar citas.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard/services/new')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Crear servicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              No hay profesionales disponibles
            </h2>
            <p className="text-yellow-700 mb-4">
              Debes crear al menos un profesional antes de agendar citas.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard/professionals')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Gestionar profesionales
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label="Volver"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Nueva cita manual</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Info */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del cliente</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="client_name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    id="client_phone"
                    required
                    placeholder="+56912345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="client_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    id="client_email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la cita</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio *
                  </label>
                  <select
                    id="service_id"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.service_id}
                    onChange={(e) => handleServiceChange(e.target.value)}
                  >
                    <option value="">Seleccionar servicio</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.estimated_duration_minutes} min)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="professional_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Profesional *
                  </label>
                  <select
                    id="professional_id"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.professional_id}
                    onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                  >
                    <option value="">Seleccionar profesional</option>
                    {professionals.map((pro) => (
                      <option key={pro.id} value={pro.id}>
                        {pro.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    id="appointment_date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                      Hora inicio *
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.start_time}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                      Hora fin *
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Creando...' : 'Crear cita'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

