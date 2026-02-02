import { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import { motion } from 'framer-motion';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import AnimatedModal from '../../../components/animations/AnimatedModal';
import { ScheduleSlot, Professional } from '../../../types';
import { DAY_OF_WEEK_KEYS } from '../constants';
import { AppearanceTheme, BookingForm } from '../types';
import { getOccupiedSlotsForDate, getOccupiedSlotsForDateRange, isSlotOccupied, hasAvailableSlotsForProfessional, CalendarInventoryEntry } from '../../../services/calendarInventory';

// Registrar locale español para el calendario
registerLocale('es', es);

interface BookingModalProps {
  isOpen: boolean;
  theme: AppearanceTheme;
  serviceName?: string;
  availableSchedules: ScheduleSlot[];
  selectedDate: Date | null;
  selectedSchedule: string | null;
  bookingForm: BookingForm;
  onClose: () => void;
  onDateChange: (date: Date | null, matchingScheduleId: string | null) => void;
  onScheduleChange: (scheduleId: string) => void;
  onFormChange: (field: keyof BookingForm, value: string) => void;
  onSubmit: () => void;
  professionals?: Professional[];
  selectedProfessionalId?: string | null;
  onProfessionalChange?: (id: string) => void;
  requireProfessional?: boolean;
  contactLabel?: string;
  contactPlaceholder?: string;
  contactPrefix?: string;
  submitLabel?: string;
  showWhatsappIcon?: boolean;
  enableEmailField?: boolean;
  emailLabel?: string;
  emailPlaceholder?: string;
  requireEmail?: boolean;
  companyId?: string;
}

export function BookingModal({
  isOpen,
  theme,
  serviceName,
  availableSchedules,
  selectedDate,
  selectedSchedule,
  bookingForm,
  onClose,
  onDateChange,
  onScheduleChange,
  onFormChange,
  onSubmit,
  professionals = [],
  selectedProfessionalId = null,
  onProfessionalChange,
  requireProfessional = false,
  contactLabel = 'Tu WhatsApp *',
  contactPlaceholder = '912345678',
  contactPrefix = '+56',
  submitLabel = 'AGENDAR',
  showWhatsappIcon = true,
  enableEmailField = false,
  emailLabel = 'Correo (opcional)',
  emailPlaceholder = 'cliente@correo.com',
  requireEmail = false,
  companyId,
}: BookingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [occupiedSlots, setOccupiedSlots] = useState<CalendarInventoryEntry[]>([]);
  const minDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const maxDate = useMemo(() => {
    const date = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOccupiedSlots([]);
    }
  }, [isOpen]);

  // Cargar citas ocupadas para todo el rango del calendario cuando se abre el modal
  useEffect(() => {
    const loadOccupiedSlotsForRange = async () => {
      if (!isOpen || !companyId) {
        setOccupiedSlots([]);
        return;
      }

      try {
        // Cargar slots ocupados para todo el rango del calendario (35 días)
        const occupied = await getOccupiedSlotsForDateRange(companyId, minDate, maxDate);
        setOccupiedSlots(occupied);
      } catch (error) {
        console.error('Error loading occupied slots:', error);
        setOccupiedSlots([]);
      }
    };

    loadOccupiedSlotsForRange();
  }, [isOpen, companyId, minDate, maxDate]);

  // También cargar cuando cambia la fecha seleccionada (para actualizar en tiempo real)
  useEffect(() => {
    const loadOccupiedSlots = async () => {
      if (!selectedDate || !companyId) {
        return; // No limpiar, mantener los slots del rango
      }

      try {
        // Recargar solo para la fecha seleccionada para actualizar en tiempo real
        const occupied = await getOccupiedSlotsForDate(companyId, selectedDate);
        // Actualizar solo los slots de esta fecha en el array existente
        setOccupiedSlots(prev => {
          const selectedDateStr = selectedDate.toISOString().split('T')[0];
          // Filtrar slots de la fecha seleccionada y agregar los nuevos
          const filtered = prev.filter(slot => {
            const slotDate = new Date(slot.date);
            return slotDate.toISOString().split('T')[0] !== selectedDateStr;
          });
          return [...filtered, ...occupied];
        });
      } catch (error) {
        console.error('Error loading occupied slots:', error);
      }
    };

    if (selectedDate) {
      loadOccupiedSlots();
    }
  }, [selectedDate, companyId]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const dayKey = DAY_OF_WEEK_KEYS[date.getDay()];
      const matching = availableSchedules.filter((s: ScheduleSlot) => s.days_of_week?.includes(dayKey));
      onDateChange(date, matching[0]?.id || null);
    } else {
      onDateChange(null, null);
    }
  };

  const isDateAvailable = (date: Date) => {
    const dayKey = DAY_OF_WEEK_KEYS[date.getDay()];
    return availableSchedules.some((s: ScheduleSlot) => s.days_of_week?.includes(dayKey));
  };

  const getAvailableSchedulesForDate = () => {
    if (!selectedDate) return availableSchedules;
    const dayKey = DAY_OF_WEEK_KEYS[selectedDate.getDay()];
    const schedulesForDay = availableSchedules.filter((s: ScheduleSlot) => 
      s.days_of_week?.includes(dayKey)
    );

    // Si no hay citas ocupadas, retornar todos los horarios del día
    if (occupiedSlots.length === 0) return schedulesForDay;

    // Filtrar horarios ocupados
    return schedulesForDay.filter((schedule) => {
      // Si hay un profesional seleccionado, verificar ocupación para ese profesional
      if (selectedProfessionalId) {
        const professionalOccupiedSlots = occupiedSlots.filter(
          (slot) => slot.professional_id === selectedProfessionalId || slot.professional_id === 'unassigned'
        );
        return !isSlotOccupied(schedule, professionalOccupiedSlots);
      }

      // Si no hay profesional seleccionado, verificar si está ocupado por cualquier profesional
      return !isSlotOccupied(schedule, occupiedSlots);
    });
  };

  // Filtrar profesionales que tengan horarios disponibles
  const getAvailableProfessionals = () => {
    if (!selectedDate || professionals.length === 0) return professionals;
    if (occupiedSlots.length === 0) return professionals;

    const schedulesForDay = availableSchedules.filter((s: ScheduleSlot) => {
      const dayKey = DAY_OF_WEEK_KEYS[selectedDate.getDay()];
      return s.days_of_week?.includes(dayKey);
    });

    return professionals.filter((pro) => {
      return hasAvailableSlotsForProfessional(pro.id, schedulesForDay, occupiedSlots);
    });
  };

  // Contar horarios disponibles para una fecha específica (sin ocupados)
  const getAvailableSlotsCount = (date: Date): number => {
    const dayKey = DAY_OF_WEEK_KEYS[date.getDay()];
    const schedulesForDay = availableSchedules.filter((s: ScheduleSlot) => 
      s.days_of_week?.includes(dayKey)
    );

    // Si no hay horarios configurados para este día, retornar 0
    if (schedulesForDay.length === 0) {
      return 0;
    }

    // Si tenemos citas ocupadas, filtrarlas para esta fecha específica
    // Ahora occupiedSlots contiene todas las citas del rango del calendario
    if (occupiedSlots.length > 0) {
      // Filtrar slots ocupados que correspondan a esta fecha
      const dateStr = date.toISOString().split('T')[0];
      const slotsForThisDate = occupiedSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate.toISOString().split('T')[0] === dateStr;
      });

      if (slotsForThisDate.length > 0) {
        const availableCount = schedulesForDay.filter((schedule) => {
          if (selectedProfessionalId) {
            const professionalOccupiedSlots = slotsForThisDate.filter(
              (slot) => slot.professional_id === selectedProfessionalId || slot.professional_id === 'unassigned'
            );
            return !isSlotOccupied(schedule, professionalOccupiedSlots);
          }
          return !isSlotOccupied(schedule, slotsForThisDate);
        }).length;
        return availableCount;
      }
    }

    // Si no hay slots ocupados para esta fecha, retornar el total de horarios disponibles
    // IMPORTANTE: Esto significa que si no hay fecha seleccionada, siempre mostraremos
    // el número total de horarios configurados, no podemos saber si están ocupados o no
    // sin cargar los slots ocupados para todas las fechas (lo cual sería costoso)
    return schedulesForDay.length;
  };

  // Obtener clase CSS según disponibilidad
  const getDayAvailabilityClass = (date: Date): string => {
    // Primero verificar si hay horarios configurados para este día
    if (!isDateAvailable(date)) {
      return 'booking-day-blocked';
    }
    
    // Luego contar los slots realmente disponibles (después de filtrar ocupados)
    const count = getAvailableSlotsCount(date);
    
    // Si count es 0, significa que hay horarios configurados pero todos están ocupados
    if (count === 0) {
      return 'booking-day-no-slots';
    } else if (count >= 1 && count <= 3) {
      return 'booking-day-low-slots';
    } else {
      return 'booking-day-available';
    }
  };

  const selectNearestAvailable = (startDate: Date) => {
    const searchStart = new Date(startDate);
    searchStart.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 35; i += 1) {
      const candidate = new Date(searchStart);
      candidate.setDate(searchStart.getDate() + i);
      if (candidate > maxDate) break;
      if (isDateAvailable(candidate)) {
        handleDateChange(candidate);
        return;
      }
    }
  };

  const upcomingAvailableDates = () => {
    const results: Date[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (results.length < 3 && cursor <= maxDate) {
      if (isDateAvailable(cursor)) {
        results.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return results;
  };

  const canProceedToStep2 = Boolean(selectedDate && selectedSchedule);

  const handleSubmit = () => {
    if (!bookingForm.client_name || !bookingForm.client_whatsapp || !bookingForm.client_rut) {
      return;
    }
    if (requireEmail && !bookingForm.client_email) {
      return;
    }
    if (requireProfessional && !selectedProfessionalId) {
      return;
    }
    onSubmit();
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="p-0 w-full max-w-4xl"
      ariaLabel={`Agendar servicio: ${serviceName}`}
    >
      {/* Header */}
      <div 
        className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-600"
        style={{ backgroundColor: (theme.calendarButtonColor || theme.buttonColor) + '10' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold dark:text-white truncate"
              style={{ color: theme.calendarTitleColor || theme.titleColor }}
            >
              📅 Agendar: {serviceName}
            </h3>
            <p className="text-xs sm:text-sm dark:text-gray-300 mt-0.5"
              style={{ color: theme.calendarTextColor || theme.textColor }}
            >
              {step === 1 ? 'Paso 1 de 2: Selecciona fecha y horario' : 'Paso 2 de 2: Tus datos de contacto'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl leading-none flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Cerrar ventana de agendamiento"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex gap-1.5">
          <div 
            className={`flex-1 h-1 rounded-full transition-colors ${
              step >= 1 ? 'bg-current' : 'bg-gray-200'
            }`}
            style={{ color: theme.calendarButtonColor || theme.buttonColor }}
          />
          <div 
            className={`flex-1 h-1 rounded-full transition-colors ${
              step >= 2 ? 'bg-current' : 'bg-gray-200'
            }`}
            style={{ color: theme.calendarButtonColor || theme.buttonColor }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-5">
        {step === 1 ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4 sm:space-y-5"
          >
            {/* Calendario Interactivo */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="block text-base sm:text-lg font-bold dark:text-white"
                  style={{ color: theme.calendarTitleColor || theme.titleColor }}
                >
                  <span className="mr-2 text-xl">📆</span>
                  Selecciona una fecha
                </label>
                <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Hoy', offset: 0 },
                  { label: 'Mañana', offset: 1 },
                  { label: 'Próxima semana', offset: 7 },
                  { label: 'Próx. disponible', offset: null },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      if (action.offset === null) {
                        const [nextDate] = upcomingAvailableDates();
                        if (nextDate) handleDateChange(nextDate);
                        return;
                      }
                      const target = new Date();
                      target.setDate(target.getDate() + action.offset);
                      selectNearestAvailable(target);
                    }}
                    className="px-3 py-1.5 rounded-full border text-xs sm:text-sm font-medium transition-all hover:shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:border-gray-500"
                    style={{ 
                      borderColor: (theme.calendarButtonColor || theme.buttonColor) + '70', 
                      color: theme.calendarTitleColor || theme.titleColor,
                      backgroundColor: theme.calendarCardColor || theme.cardColor
                    }}
                  >
                    {action.label}
                  </button>
                ))}
                </div>
              </div>
              
              <div className="w-full flex justify-center">
                <div 
                  className="border rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 shadow-sm hover:shadow-md transition-all w-full max-w-full sm:max-w-md mx-auto flex flex-col items-center dark:border-gray-600"
                  style={{ 
                    backgroundColor: theme.calendarCardColor || theme.cardColor,
                    borderColor: theme.calendarButtonColor || theme.buttonColor + '35', 
                    boxShadow: '0 8px 20px rgba(0,0,0,0.05)' 
                  }}
                >
                <style>{`
                  .react-datepicker {
                    font-family: inherit !important;
                    border: 1px solid ${(theme.calendarButtonColor || theme.buttonColor) + '30'} !important;
                    background: ${theme.calendarCardColor || theme.cardColor || '#ffffff'} !important;
                    box-shadow: 0 16px 40px rgba(0,0,0,0.08) !important;
                    border-radius: 0.75rem !important;
                    color: ${theme.calendarTextColor || theme.textColor || '#111827'} !important;
                    margin: 0 auto !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    font-size: 0.875rem !important;
                  }
                  @media (max-width: 640px) {
                    .react-datepicker {
                      font-size: 0.75rem !important;
                    }
                  }
                  .react-datepicker__month-container {
                    width: 100% !important;
                    margin: 0 auto !important;
                  }
                  .react-datepicker__header {
                    background: ${theme.calendarCardColor || theme.cardColor} !important;
                    border: none !important;
                    padding: 0.5rem 0.75rem 0.25rem !important;
                    border-bottom: 1px solid ${(theme.calendarButtonColor || theme.buttonColor) + '30'} !important;
                  }
                  @media (max-width: 640px) {
                    .react-datepicker__header {
                      padding: 0.4rem 0.5rem 0.2rem !important;
                    }
                  }
                  .react-datepicker__month-container {
                    padding: 0 !important;
                  }
                  .react-datepicker__month {
                    border: none !important;
                    border-radius: 0.5rem !important;
                    padding: 0.25rem 0.5rem 0.5rem !important;
                    background: ${theme.calendarCardColor || theme.cardColor || 'transparent'} !important;
                  }
                  @media (max-width: 640px) {
                    .react-datepicker__month {
                      padding: 0.2rem 0.4rem 0.4rem !important;
                    }
                  }
                  .react-datepicker__current-month {
                    font-size: 1rem !important;
                    font-weight: 700 !important;
                    color: ${theme.calendarTitleColor || theme.titleColor} !important;
                    padding-bottom: 0.25rem !important;
                    letter-spacing: 0.01em !important;
                  }
                  @media (max-width: 640px) {
                    .react-datepicker__current-month {
                      font-size: 0.875rem !important;
                    }
                  }
                  .react-datepicker__day-names {
                    margin-top: 0.5rem !important;
                    display: grid !important;
                    grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
                    border-bottom: 1px solid ${(theme.calendarButtonColor || theme.buttonColor) + '20'} !important;
                    gap: 0.125rem !important;
                  }
                  .react-datepicker__day-name {
                    color: ${theme.calendarTextColor || theme.textColor} !important;
                    font-weight: 700 !important;
                    font-size: 0.75rem !important;
                    width: auto !important;
                    line-height: 1.5rem !important;
                    text-transform: uppercase !important;
                    padding: 0.25rem !important;
                  }
                  @media (max-width: 640px) {
                    .react-datepicker__day-name {
                      font-size: 0.625rem !important;
                      line-height: 1.25rem !important;
                      padding: 0.125rem !important;
                    }
                  }
                  .react-datepicker__day {
                    width: auto !important;
                    height: auto !important;
                    min-height: 2rem !important;
                    line-height: 2rem !important;
                    margin: 0.125rem !important;
                    border-radius: 0.5rem !important;
                    font-size: 0.875rem !important;
                    font-weight: 700 !important;
                    transition: all 0.2s !important;
                    position: relative !important;
                    border: 2px solid #e5e7eb !important;
                    color: ${theme.calendarTextColor || theme.textColor || '#0f172a'} !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 0.25rem !important;
                    background-color: ${theme.calendarCardColor || theme.cardColor || '#ffffff'} !important;
                  }
                  /* Asegurar que los bordes de disponibilidad siempre se muestren */
                  .react-datepicker__day.booking-day-available,
                  .react-datepicker__day.booking-day-low-slots,
                  .react-datepicker__day.booking-day-no-slots {
                    border-style: solid !important;
                  }
                  @media (max-width: 640px) {
                    .react-datepicker__day {
                      min-height: 1.75rem !important;
                      line-height: 1.75rem !important;
                      font-size: 0.75rem !important;
                      margin: 0.1rem !important;
                      padding: 0.125rem !important;
                    }
                  }
                  .react-datepicker__day:hover {
                    background-color: ${theme.calendarButtonColor || theme.buttonColor}25 !important;
                    transform: translateY(-1px) scale(1.02) !important;
                  }
                  .react-datepicker__day--selected {
                    background-color: ${theme.calendarSelectedDayColor || theme.calendarButtonColor || theme.buttonColor} !important;
                    color: ${theme.calendarButtonTextColor || theme.buttonTextColor || '#ffffff'} !important;
                    font-weight: 700 !important;
                    box-shadow: 0 2px 8px ${theme.calendarSelectedDayColor || theme.calendarButtonColor || theme.buttonColor}40 !important;
                    border-color: ${theme.calendarSelectedDayColor || theme.calendarButtonColor || theme.buttonColor} !important;
                  }
                  .react-datepicker__day--keyboard-selected {
                    background-color: ${theme.calendarButtonColor || theme.buttonColor}30 !important;
                    border-color: ${theme.calendarButtonColor || theme.buttonColor}50 !important;
                  }
                  .react-datepicker__day--disabled {
                    color: #94a3b8 !important;
                    cursor: not-allowed !important;
                    background: #f8fafc !important;
                    border-color: #e5e7eb !important;
                    border-style: dashed !important;
                  }
                  .react-datepicker__day--disabled:hover {
                    background-color: transparent !important;
                    transform: none !important;
                    border-color: #e5e7eb !important;
                  }
                  .react-datepicker__day--outside-month {
                    color: #e2e8f0 !important;
                  }
                  .react-datepicker__day--today {
                    font-weight: 700 !important;
                    border-color: ${theme.calendarButtonColor || theme.buttonColor} !important;
                    color: ${theme.calendarTextColor || theme.textColor || '#0f172a'} !important;
                  }
                  .react-datepicker__navigation {
                    top: 0.4rem !important;
                    padding: 0.25rem !important;
                    border-radius: 999px !important;
                    transition: all 0.15s !important;
                    color: ${theme.calendarTitleColor || theme.titleColor} !important;
                  }
                  @media (max-width: 640px) {
                    .react-datepicker__navigation {
                      top: 0.3rem !important;
                      padding: 0.2rem !important;
                    }
                  }
                  .react-datepicker__navigation-icon::before {
                    border-color: ${theme.calendarButtonColor || theme.buttonColor} !important;
                    border-width: 2px 2px 0 0 !important;
                  }
                  @media (max-width: 640px) {
                    .react-datepicker__navigation-icon::before {
                      border-width: 1.5px 1.5px 0 0 !important;
                    }
                  }
                  .react-datepicker__navigation:hover *::before {
                    border-color: ${theme.calendarTitleColor || theme.titleColor} !important;
                  }
                  .react-datepicker__navigation:hover {
                    background: ${theme.calendarButtonColor || theme.buttonColor}15 !important;
                  }
                  .react-datepicker__week {
                    display: grid !important;
                    grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
                    gap: 0.125rem !important;
                  }
                  /* Bordes de disponibilidad - Mayor especificidad para sobrescribir estilos por defecto */
                  .react-datepicker__day.booking-day-available {
                    border-color: ${theme.calendarAvailableDayColor || '#22c55e'} !important;
                    border-width: 2px !important;
                  }
                  .react-datepicker__day.booking-day-available:hover {
                    border-color: ${theme.calendarAvailableDayColor || '#22c55e'} !important;
                  }
                  .react-datepicker__day.booking-day-low-slots {
                    border-color: ${theme.calendarLowSlotsColor || '#eab308'} !important;
                    border-width: 2px !important;
                  }
                  .react-datepicker__day.booking-day-low-slots:hover {
                    border-color: ${theme.calendarLowSlotsColor || '#eab308'} !important;
                  }
                  .react-datepicker__day.booking-day-no-slots {
                    border-color: ${theme.calendarNoSlotsColor || '#ef4444'} !important;
                    border-width: 2px !important;
                    background-color: ${(theme.calendarNoSlotsColor || '#ef4444') + '15'} !important;
                  }
                  .react-datepicker__day.booking-day-no-slots:hover {
                    border-color: ${theme.calendarNoSlotsColor || '#ef4444'} !important;
                    background-color: ${(theme.calendarNoSlotsColor || '#ef4444') + '20'} !important;
                  }
                  /* Sobrescribir estilos cuando el día sin slots está seleccionado */
                  .react-datepicker__day.booking-day-no-slots.react-datepicker__day--selected {
                    border-color: ${theme.calendarNoSlotsColor || '#ef4444'} !important;
                    background-color: ${theme.calendarNoSlotsColor || '#ef4444'} !important;
                    color: ${theme.calendarButtonTextColor || theme.buttonTextColor || '#ffffff'} !important;
                  }
                  .react-datepicker__day.booking-day-no-slots.react-datepicker__day--keyboard-selected {
                    border-color: ${theme.calendarNoSlotsColor || '#ef4444'} !important;
                    background-color: ${(theme.calendarNoSlotsColor || '#ef4444') + '30'} !important;
                  }
                  .react-datepicker__day.booking-day-blocked {
                    color: #cbd5e0 !important;
                    border-color: #e5e7eb !important;
                    border-style: dashed !important;
                    cursor: not-allowed !important;
                  }
                  .react-datepicker__day.booking-day-blocked:hover {
                    background-color: transparent !important;
                    transform: none !important;
                  }
                `}</style>
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    filterDate={(date) => {
                      return isDateAvailable(date);
                    }}
                    inline
                    locale="es"
                    dateFormat="dd/MM/yyyy"
                    formatWeekDay={(name) => name.slice(0, 1).toUpperCase()}
                    renderCustomHeader={({
                      date,
                      decreaseMonth,
                      increaseMonth,
                      prevMonthButtonDisabled,
                      nextMonthButtonDisabled,
                    }) => (
                      <div className="flex items-center justify-between mb-2 sm:mb-3 px-1 gap-1">
                        <button
                          type="button"
                          onClick={decreaseMonth}
                          disabled={prevMonthButtonDisabled}
                          className="p-1 sm:p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 disabled:opacity-40 text-black dark:text-gray-200 dark:bg-gray-700 transition-colors text-sm sm:text-base flex-shrink-0"
                          aria-label="Mes anterior"
                        >
                          ‹
                        </button>
                        <div className="text-xs sm:text-sm md:text-base font-bold uppercase px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border-2 rounded-md text-center flex-1 mx-1 sm:mx-2 md:mx-3 dark:border-gray-600"
                          style={{ 
                            borderColor: theme.calendarButtonColor || theme.buttonColor,
                            backgroundColor: theme.calendarCardColor || theme.cardColor,
                            color: theme.calendarTitleColor || theme.titleColor
                          }}
                        >
                          {date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                        </div>
                        <button
                          type="button"
                          onClick={increaseMonth}
                          disabled={nextMonthButtonDisabled}
                          className="p-1 sm:p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 disabled:opacity-40 text-black dark:text-gray-200 dark:bg-gray-700 transition-colors text-sm sm:text-base flex-shrink-0"
                          aria-label="Mes siguiente"
                        >
                          ›
                        </button>
                      </div>
                    )}
                    dayClassName={(date) => getDayAvailabilityClass(date)}
                    monthsShown={1}
                    fixedHeight
                  />
                </div>
              </div>

              <div className="mt-2 sm:mt-3 flex flex-wrap gap-2 text-xs sm:text-sm dark:text-gray-300"
                style={{ color: theme.calendarTextColor || theme.textColor }}
              >
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg dark:bg-gray-700"
                  style={{ backgroundColor: (theme.calendarCardColor || theme.cardColor) + '80' }}
                >
                  <span className="w-3 h-3 rounded border-2 flex-shrink-0"
                    style={{ borderColor: theme.calendarAvailableDayColor || '#22c55e' }}
                  ></span>
                  <span className="hidden sm:inline">Disponible</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg dark:bg-gray-700"
                  style={{ backgroundColor: (theme.calendarCardColor || theme.cardColor) + '80' }}
                >
                  <span className="w-3 h-3 rounded border-2 flex-shrink-0"
                    style={{ borderColor: theme.calendarLowSlotsColor || '#eab308' }}
                  ></span>
                  <span className="hidden sm:inline">1-3 citas</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg dark:bg-gray-700"
                  style={{ backgroundColor: (theme.calendarCardColor || theme.cardColor) + '80' }}
                >
                  <span className="w-3 h-3 rounded border-2 flex-shrink-0"
                    style={{ borderColor: theme.calendarNoSlotsColor || '#ef4444' }}
                  ></span>
                  <span className="hidden sm:inline">Sin horas</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700">
                  {minDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} - {maxDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 sm:mt-3 p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm"
                  style={{ 
                    backgroundColor: (theme.calendarButtonColor || theme.buttonColor) + '10',
                    borderLeft: `3px solid ${theme.calendarButtonColor || theme.buttonColor}`
                  }}
                >
                  <p className="text-xs sm:text-sm font-semibold flex items-center gap-2" 
                    style={{ color: theme.calendarTitleColor || theme.titleColor }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {selectedDate.toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Horarios Disponibles */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 sm:mt-5"
              >
                <label className="block text-sm sm:text-base font-semibold dark:text-white mb-2.5 sm:mb-3 flex items-center gap-2"
                  style={{ color: theme.calendarTitleColor || theme.titleColor }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selecciona un horario
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                  {getAvailableSchedulesForDate().map((schedule: ScheduleSlot) => (
                    <motion.button
                      key={schedule.id}
                      type="button"
                      onClick={() => onScheduleChange(schedule.id)}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-left shadow-sm hover:shadow-md dark:bg-gray-800 ${
                        selectedSchedule === schedule.id
                          ? 'border-current'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      style={{
                        borderColor: selectedSchedule === schedule.id ? (theme.calendarButtonColor || theme.buttonColor) : undefined,
                        backgroundColor: selectedSchedule === schedule.id 
                          ? (theme.calendarButtonColor || theme.buttonColor) + '15' 
                          : (theme.calendarCardColor || theme.cardColor)
                      }}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div 
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold shadow-sm flex-shrink-0 ${
                            selectedSchedule === schedule.id ? 'text-white' : 'text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-700'
                          }`}
                          style={{ 
                            backgroundColor: selectedSchedule === schedule.id 
                              ? (theme.calendarButtonColor || theme.buttonColor) 
                              : undefined,
                            color: selectedSchedule === schedule.id 
                              ? (theme.calendarButtonTextColor || theme.buttonTextColor)
                              : undefined
                          }}
                        >
                          {selectedSchedule === schedule.id ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold dark:text-white text-base sm:text-lg truncate"
                            style={{ color: theme.calendarTextColor || theme.textColor }}
                          >
                            {schedule.start_time}
                          </p>
                          <p className="text-xs sm:text-sm dark:text-gray-300 font-medium"
                            style={{ color: theme.calendarTextColor || theme.textColor }}
                          >
                            Hasta {schedule.end_time}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {getAvailableSchedulesForDate().length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-xs sm:text-sm">No hay horarios disponibles para esta fecha</p>
                    <p className="text-xs mt-1">Por favor selecciona otro día</p>
                  </div>
                )}
              </motion.div>
            )}

            {!selectedDate && (
              <div className="text-center py-6 sm:py-8 text-gray-400 dark:text-gray-500">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs sm:text-sm px-4">Selecciona una fecha en el calendario para ver los horarios disponibles</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Resumen de selección */}
            <div className="bg-blue-600 dark:bg-blue-900/30 border border-blue-500 dark:border-blue-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-white mb-2">📋 Resumen de tu reserva</h4>
              <div className="space-y-1 text-sm text-white">
                <p><strong>Servicio:</strong> {serviceName}</p>
                <p><strong>Fecha:</strong> {selectedDate?.toLocaleDateString('es-CL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>Horario:</strong> {
                  availableSchedules.find(s => s.id === selectedSchedule)?.start_time
                } - {
                  availableSchedules.find(s => s.id === selectedSchedule)?.end_time
                }</p>
                {selectedProfessionalId && (
                  <p>
                    <strong>Profesional:</strong>{' '}
                    {professionals.find((pro) => pro.id === selectedProfessionalId)?.name}
                  </p>
                )}
              </div>
            </div>

            {getAvailableProfessionals().length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Selecciona un profesional {requireProfessional && <span className="text-red-500 dark:text-red-400">*</span>}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getAvailableProfessionals().map((pro) => (
                    <button
                      key={pro.id}
                      type="button"
                      onClick={() => onProfessionalChange?.(pro.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition dark:bg-gray-800 ${
                        selectedProfessionalId === pro.id
                          ? 'border-current bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      style={{ borderColor: selectedProfessionalId === pro.id ? theme.buttonColor : undefined }}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">{pro.name}</div>
                      {(pro.email || pro.phone) && (
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {[pro.email, pro.phone].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario de contacto */}
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Tu nombre completo *
              </label>
              <input
                id="client-name"
                type="text"
                required
                placeholder="Ej: Juan Pérez"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-current focus:border-transparent transition-all dark:placeholder-gray-500"
                style={{ 
                  '--tw-ring-color': theme.buttonColor 
                } as React.CSSProperties}
                value={bookingForm.client_name}
                onChange={(e) => onFormChange('client_name', e.target.value)}
              />
            </div>

            {enableEmailField && (
              <div>
                <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {emailLabel} {requireEmail && <span className="text-red-500 dark:text-red-400">*</span>}
                </label>
                <input
                  id="client-email"
                  type="email"
                  required={requireEmail}
                  placeholder={emailPlaceholder}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-current focus:border-transparent transition-all dark:placeholder-gray-500"
                  style={{ '--tw-ring-color': theme.buttonColor } as React.CSSProperties}
                  value={bookingForm.client_email || ''}
                  onChange={(e) => onFormChange('client_email', e.target.value)}
                />
              </div>
            )}

            <div>
              <label htmlFor="client-rut" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                RUT *
              </label>
              <input
                id="client-rut"
                type="text"
                required
                placeholder="Ej: 12.345.678-9"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-current focus:border-transparent transition-all dark:placeholder-gray-500"
                style={{ '--tw-ring-color': theme.buttonColor } as React.CSSProperties}
                value={bookingForm.client_rut || ''}
                onChange={(e) => onFormChange('client_rut', e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Requerido para generar tu ficha de paciente
              </p>
            </div>

            <div>
              <label htmlFor="client-whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {contactLabel}
              </label>
              <div className="relative">
                {contactPrefix && (
                  <span className="absolute left-4 top-3.5 text-gray-500 dark:text-gray-400">{contactPrefix}</span>
                )}
                <input
                  id="client-whatsapp"
                  type="tel"
                  required
                  placeholder={contactPlaceholder}
                  maxLength={contactPrefix ? 9 : 15}
                  className={`w-full ${contactPrefix ? 'pl-14' : 'pl-4'} pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-current focus:border-transparent transition-all dark:placeholder-gray-500`}
                  style={{ 
                    '--tw-ring-color': theme.buttonColor 
                  } as React.CSSProperties}
                  value={bookingForm.client_whatsapp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    onFormChange('client_whatsapp', value);
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ingresa tu dato de contacto para confirmar la cita
              </p>
            </div>

            <div>
              <label htmlFor="client-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Comentarios o solicitudes especiales (opcional)
              </label>
              <textarea
                id="client-comment"
                rows={4}
                placeholder="Ej: Prefiero atención en la mañana..."
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-current focus:border-transparent transition-all resize-none dark:placeholder-gray-500"
                style={{ 
                  '--tw-ring-color': theme.buttonColor 
                } as React.CSSProperties}
                value={bookingForm.client_comment}
                onChange={(e) => onFormChange('client_comment', e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {bookingForm.client_comment.length}/500 caracteres
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
        {step === 1 ? (
          <>
            <AnimatedButton
              onClick={onClose}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm sm:text-base order-2 sm:order-1"
            >
              Cancelar
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              style={{ 
                backgroundColor: theme.calendarButtonColor || theme.buttonColor,
                color: theme.calendarButtonTextColor || theme.buttonTextColor
              }}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
            >
              Continuar
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </AnimatedButton>
          </>
        ) : (
          <>
            <AnimatedButton
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </AnimatedButton>
            <AnimatedButton
              onClick={handleSubmit}
              disabled={
                !bookingForm.client_name ||
                !bookingForm.client_whatsapp ||
                !bookingForm.client_rut ||
                (requireEmail && !bookingForm.client_email) ||
                (requireProfessional && !selectedProfessionalId)
              }
              style={{ 
                backgroundColor: theme.calendarButtonColor || theme.buttonColor,
                color: theme.calendarButtonTextColor || theme.buttonTextColor
              }}
              className="px-6 py-2.5 rounded-lg hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {showWhatsappIcon && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              )}
              {submitLabel}
            </AnimatedButton>
          </>
        )}
      </div>
    </AnimatedModal>
  );
}
