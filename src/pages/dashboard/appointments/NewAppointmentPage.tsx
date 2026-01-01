import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getServices, getServiceSchedules, getScheduleSlots, getCompany } from '../../../services/firestore';
import { listProfessionals } from '../../../services/professionals';
import { createManualAppointment, isTimeSlotAvailable, getAppointment } from '../../../services/appointments';
import { createCalendarInventoryEntry, isInventorySlotAvailable } from '../../../services/calendarInventory';
import { BookingModal } from '../../public/components/BookingModal';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { AppointmentStatus, Professional, ScheduleSlot, Service } from '../../../types';
import { BookingForm } from '../../public/types';
import { sendAppointmentCreatedEmail, sendAppointmentConfirmedEmail, sendAppointmentReminderEmail } from '../../../services/appointmentEmails';

const dashboardTheme = {
  bgColor: '#ffffff',
  cardColor: '#ffffff',
  bgOpacity: 1,
  cardOpacity: 1,
  buttonColor: '#2563eb',
  buttonTextColor: '#ffffff',
  titleColor: '#111827',
  subtitleColor: '#4b5563',
  textColor: '#4b5563',
  fontTitle: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  fontBody: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  fontButton: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
};

export default function NewAppointmentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('appointments');
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [serviceProfessionals, setServiceProfessionals] = useState<Professional[]>([]);
  const [availableSchedules, setAvailableSchedules] = useState<ScheduleSlot[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    client_name: '',
    client_whatsapp: '',
    client_email: '',
    client_rut: '',
    client_comment: '',
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [firestoreUser]);

  // ✅ useMemo debe estar ANTES de cualquier return condicional (React Rules of Hooks)
  const serviceList = useMemo(
    () => services.filter((service) => service.status === 'ACTIVE'),
    [services]
  );

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;
    setLoading(true);

    try {
      const [servicesData, professionalsData] = await Promise.all([
        getServices(firestoreUser.company_id),
        listProfessionals(firestoreUser.company_id),
      ]);

      setServices(servicesData.filter((service) => service.status === 'ACTIVE'));
      setProfessionals(professionalsData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    setSelectedService(null);
    setSelectedProfessionalId(null);
    setServiceProfessionals([]);
    setAvailableSchedules([]);
    setSelectedDate(null);
    setSelectedSchedule(null);
    setBookingForm({ client_name: '', client_whatsapp: '', client_email: '', client_rut: '', client_comment: '' });
    setShowBookingModal(false);
  };

  const openBookingForService = async (service: Service) => {
    if (!firestoreUser?.company_id) return;

    setSelectedService(service);
    setShowBookingModal(true);
    setSelectedDate(null);
    setSelectedSchedule(null);

    const professionalsForService =
      service.professional_ids && service.professional_ids.length > 0
        ? professionals.filter((pro) => service.professional_ids?.includes(pro.id))
        : professionals;
    setServiceProfessionals(professionalsForService);
    setSelectedProfessionalId(professionalsForService[0]?.id || null);

    try {
      const [serviceSchedules, slots] = await Promise.all([
        getServiceSchedules(service.id),
        getScheduleSlots(firestoreUser.company_id),
      ]);

      const available = slots.filter(
        (slot) =>
          slot.status === 'ACTIVE' &&
          serviceSchedules.some((schedule) => schedule.schedule_slot_id === slot.id)
      );
      setAvailableSchedules(available);
    } catch (error) {
      toast.error('No pudimos cargar los horarios');
      handleError(error);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedSchedule || !selectedDate || !firestoreUser?.company_id) {
      toast.error('Completa todos los datos de la cita');
      return;
    }

    if (!bookingForm.client_name || !bookingForm.client_whatsapp || !bookingForm.client_rut) {
      toast.error('Completa el nombre, teléfono y RUT del cliente');
      return;
    }

    if (serviceProfessionals.length > 0 && !selectedProfessionalId) {
      toast.error('Selecciona un profesional');
      return;
    }

    const scheduleSlot = availableSchedules.find((slot) => slot.id === selectedSchedule);
    if (!scheduleSlot) {
      toast.error('Horario no encontrado');
      return;
    }

    const professionalId = selectedProfessionalId || serviceProfessionals[0]?.id;
    if (!professionalId) {
      toast.error('Debes asignar un profesional');
      return;
    }

    const slotAvailable = await isTimeSlotAvailable(
      professionalId,
      selectedDate,
      scheduleSlot.start_time,
      scheduleSlot.end_time
    );

    if (!slotAvailable) {
      toast.error('El horario seleccionado ya está ocupado');
      return;
    }

    const inventoryAvailable = await isInventorySlotAvailable(
      firestoreUser.company_id,
      professionalId,
      selectedDate,
      scheduleSlot.start_time,
      scheduleSlot.end_time
    );

    if (!inventoryAvailable) {
      toast.error('El profesional no tiene cupos disponibles en ese horario');
      return;
    }

    setSaving(true);
    try {
      // Preparar datos de la cita, omitiendo campos opcionales vacíos
      const appointmentData: any = {
        company_id: firestoreUser.company_id,
        service_id: selectedService.id,
        professional_id: professionalId,
        client_name: bookingForm.client_name,
        client_phone: bookingForm.client_whatsapp,
        appointment_date: selectedDate,
        start_time: scheduleSlot.start_time,
        end_time: scheduleSlot.end_time,
        status: AppointmentStatus.CONFIRMED,
      };

      // Solo agregar campos opcionales si tienen valor
      if (bookingForm.client_email?.trim()) {
        appointmentData.client_email = bookingForm.client_email.trim();
      }
      if (bookingForm.client_rut?.trim()) {
        appointmentData.client_rut = bookingForm.client_rut.trim();
      }
      if (bookingForm.client_comment?.trim()) {
        appointmentData.notes = bookingForm.client_comment.trim();
      }

      const appointmentId = await createManualAppointment(
        appointmentData,
        firestoreUser.id
      );

      await createCalendarInventoryEntry({
        company_id: firestoreUser.company_id,
        service_id: selectedService.id,
        professional_id: professionalId,
        schedule_slot_id: selectedSchedule,
        date: selectedDate.toISOString().split('T')[0],
        start_time: scheduleSlot.start_time,
        end_time: scheduleSlot.end_time,
        status: 'BOOKED',
      });

      try {
        const appointment = await getAppointment(appointmentId);
        const company = await getCompany(firestoreUser.company_id);
        const professionalName = serviceProfessionals.find((pro) => pro.id === professionalId)?.name || 'Profesional';
        const ownerEmail = (company as any)?.notifications?.toEmail || firestoreUser.email || '';

        if (appointment) {
          if (ownerEmail) {
            await sendAppointmentCreatedEmail(
              appointment,
              selectedService.name,
              professionalName,
              company?.name || 'Tu negocio',
              ownerEmail,
              company?.whatsapp
            );
          }

          if (bookingForm.client_email) {
            await sendAppointmentConfirmedEmail(
              appointment,
              selectedService.name,
              professionalName,
              company?.name || 'Tu negocio',
              bookingForm.client_email,
              company?.whatsapp
            );

            // Reminders 24h y 12h antes
            const appointmentTime = new Date(selectedDate);
            const reminder24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
            const reminder12h = new Date(appointmentTime.getTime() - 12 * 60 * 60 * 1000);
            const now = new Date();

            if (reminder24h <= now) {
              await sendAppointmentReminderEmail(
                appointment,
                selectedService.name,
                professionalName,
                company?.name || 'Tu negocio',
                bookingForm.client_email,
                company?.whatsapp
              );
            } else {
              setTimeout(async () => {
                try {
                  await sendAppointmentReminderEmail(
                    appointment,
                    selectedService.name,
                    professionalName,
                    company?.name || 'Tu negocio',
                    bookingForm.client_email!,
                    company?.whatsapp
                  );
                } catch (err) {
                  console.warn('No se pudo enviar recordatorio 24h:', err);
                }
              }, reminder24h.getTime() - now.getTime());
            }

            if (reminder12h <= now) {
              await sendAppointmentReminderEmail(
                appointment,
                selectedService.name,
                professionalName,
                company?.name || 'Tu negocio',
                bookingForm.client_email,
                company?.whatsapp
              );
            } else {
              setTimeout(async () => {
                try {
                  await sendAppointmentReminderEmail(
                    appointment,
                    selectedService.name,
                    professionalName,
                    company?.name || 'Tu negocio',
                    bookingForm.client_email!,
                    company?.whatsapp
                  );
                } catch (err) {
                  console.warn('No se pudo enviar recordatorio 12h:', err);
                }
              }, reminder12h.getTime() - now.getTime());
            }
          }
        }
      } catch (mailErr) {
        console.warn('No se pudieron enviar correos/recordatorios de cita:', mailErr);
      }

      toast.success('Cita creada exitosamente');
      resetModalState();
      navigate('/dashboard/schedule');
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (serviceList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('form.buttons.cancel')}
          </button>
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-700 mb-3">Primero debes crear un servicio.</p>
            <button
              type="button"
              onClick={() => navigate('/dashboard/services/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear servicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Agenda manual</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            Selecciona el servicio que quieres agendar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceList.map((service) => (
              <div
                key={service.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Duración: {service.estimated_duration_minutes} min
                    </p>
                    {service.professional_ids && service.professional_ids.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Profesionales asignados: {service.professional_ids.length}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openBookingForService(service)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Abrir calendario
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={showBookingModal}
        serviceName={selectedService?.name}
        availableSchedules={availableSchedules}
        selectedDate={selectedDate}
        selectedSchedule={selectedSchedule}
        bookingForm={bookingForm}
        onClose={resetModalState}
        onDateChange={(date, scheduleId) => {
          setSelectedDate(date);
          setSelectedSchedule(scheduleId);
        }}
        onScheduleChange={(scheduleId) => setSelectedSchedule(scheduleId)}
        onFormChange={(field, value) => setBookingForm({ ...bookingForm, [field]: value })}
        onSubmit={handleSubmitBooking}
        professionals={serviceProfessionals}
        selectedProfessionalId={selectedProfessionalId}
        onProfessionalChange={(id) => setSelectedProfessionalId(id)}
        requireProfessional={serviceProfessionals.length > 0}
        contactLabel="Teléfono / WhatsApp *"
        contactPlaceholder="Ej: +56912345678"
        contactPrefix=""
        submitLabel={saving ? 'Guardando...' : 'Crear cita'}
        enableEmailField
        requireEmail
        emailLabel="Correo del cliente *"
        emailPlaceholder="cliente@correo.com"
        showWhatsappIcon={false}
        theme={dashboardTheme}
      />
    </div>
  );
}
