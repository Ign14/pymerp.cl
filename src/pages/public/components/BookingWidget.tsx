import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Service, Professional } from '../../../types';
import {
  getAvailableTimeSlots,
  createAppointmentRequestPublic,
  CreateAppointmentRequestInput,
} from '../../../services/appointments';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';

interface BookingWidgetProps {
  companyId: string;
  companyName: string;
  services: Service[];
  professionals: Professional[];
  onClose: () => void;
}

export default function BookingWidget({
  companyId,
  companyName,
  services,
  professionals,
  onClose,
}: BookingWidgetProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(
    null
  );
  const [availableSlots, setAvailableSlots] = useState<Array<{ start: string; end: string }>>([]);
  const [showPreconfirm, setShowPreconfirm] = useState(false);
  const [preconfirmSummary, setPreconfirmSummary] = useState('');

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).filter(
    (date) => !isBefore(date, startOfDay(new Date()))
  );

  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedProfessional, selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedProfessional || !selectedDate || !selectedService) return;

    setLoading(true);
    try {
      const slots = await getAvailableTimeSlots(
        selectedProfessional.id,
        selectedDate,
        selectedService.estimated_duration_minutes
      );
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      toast.error('Error al cargar horarios disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
    setStep(3);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedTimeSlot(slot);
    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedService ||
      !selectedProfessional ||
      !selectedDate ||
      !selectedTimeSlot ||
      !clientName.trim() ||
      !clientPhone.trim()
    ) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setSubmitting(true);

    try {
      const input: CreateAppointmentRequestInput = {
        companyId,
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await createAppointmentRequestPublic(input);

      const prettyDate = format(selectedDate, "eeee dd 'de' MMMM", { locale: es });
      setPreconfirmSummary(
        `${selectedService.name} · ${prettyDate} · ${selectedTimeSlot.start} - ${selectedTimeSlot.end}`
      );
      setShowPreconfirm(true);
      toast.success('Solicitud recibida, te confirmaremos a la brevedad.');
    } catch (error: any) {
      if (error.code === 'SLOT_TAKEN') {
        toast.error('Este horario ya no está disponible. Por favor elige otro.');
        setStep(3);
        loadAvailableSlots();
      } else {
        toast.error('Error al enviar la solicitud. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
      >
        <AnimatePresence>
          {showPreconfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex items-center justify-center p-6"
            >
              <div className="bg-white border border-blue-200 shadow-xl rounded-2xl p-6 w-full max-w-md text-center space-y-4">
                <div className="text-4xl">✅</div>
                <h3 className="text-xl font-semibold text-gray-900">Solicitud enviada</h3>
                <p className="text-sm text-gray-700">
                  Recibimos tu solicitud. La empresa debe confirmar tu cita y te enviaremos la
                  confirmación por correo o WhatsApp.
                </p>
                {preconfirmSummary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                    {preconfirmSummary}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setShowPreconfirm(false)}
                    className="px-4 py-3 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 font-semibold"
                  >
                    Seguir en esta página
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreconfirm(false);
                      onClose();
                    }}
                    className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reservar cita</h2>
            <p className="text-sm text-gray-600">{companyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Servicio</span>
            <span>Profesional</span>
            <span>Fecha/Hora</span>
            <span>Datos</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Service */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona un servicio</h3>
                <div className="space-y-3">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceSelect(service)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-start gap-4">
                        {service.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                            <span>⏱️ {service.estimated_duration_minutes} min</span>
                            <span>
                              {service.hide_price ? (
                                <span className="flex items-center gap-1.5" style={{ color: '#25D366' }}>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                  </svg>
                                  Consulta precio
                                </span>
                              ) : (
                                `💰 $${service.price.toLocaleString()}`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Professional */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:underline text-sm mb-4"
                >
                  ← Cambiar servicio
                </button>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona un profesional</h3>
                <div className="space-y-3">
                  {professionals.map((professional) => (
                    <button
                      key={professional.id}
                      type="button"
                      onClick={() => handleProfessionalSelect(professional)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        {professional.avatar_url ? (
                          <img
                            src={professional.avatar_url}
                            alt={professional.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xl">👤</span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{professional.name}</h4>
                          {professional.specialties && professional.specialties.length > 0 && (
                            <p className="text-sm text-gray-600">{professional.specialties.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Select Date & Time */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-blue-600 hover:underline text-sm mb-4"
                >
                  ← Cambiar profesional
                </button>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona fecha y hora</h3>

                {/* Date Selection */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Fecha</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {availableDates.slice(0, 8).map((date) => (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => handleDateSelect(date)}
                        className={`p-3 rounded-lg border-2 text-center ${
                          selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-xs text-gray-600">{format(date, 'EEE', { locale: es })}</div>
                        <div className="text-lg font-semibold">{format(date, 'd')}</div>
                        <div className="text-xs text-gray-600">{format(date, 'MMM', { locale: es })}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Horario</h4>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner size="md" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No hay horarios disponibles para este día</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleTimeSlotSelect(slot)}
                            className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium"
                          >
                            {slot.start}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Client Info */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-blue-600 hover:underline text-sm mb-4"
                >
                  ← Cambiar fecha/hora
                </button>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tus datos</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="clientPhone"
                      required
                      placeholder="+56912345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      id="clientEmail"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notas adicionales
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <h4 className="font-medium text-gray-900">Resumen de tu cita</h4>
                    <div className="text-gray-700">
                      <p><strong>Servicio:</strong> {selectedService?.name}</p>
                      <p><strong>Profesional:</strong> {selectedProfessional?.name}</p>
                      <p><strong>Fecha:</strong> {selectedDate && format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
                      <p><strong>Hora:</strong> {selectedTimeSlot?.start} - {selectedTimeSlot?.end}</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? 'Enviando...' : 'Solicitar cita'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
