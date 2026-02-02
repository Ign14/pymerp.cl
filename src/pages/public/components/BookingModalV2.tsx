import { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import AnimatedModal from '../../../components/animations/AnimatedModal';
import { ScheduleSlot, Professional } from '../../../types';
import { DAY_OF_WEEK_KEYS } from '../constants';
import { AppearanceTheme, BookingForm } from '../types';
import { 
  getOccupiedSlotsForDate, 
  getOccupiedSlotsForDateRange, 
  isSlotOccupied, 
  hasAvailableSlotsForProfessional, 
  CalendarInventoryEntry 
} from '../../../services/calendarInventory';
import 'react-datepicker/dist/react-datepicker.css';

// Registrar locale español
registerLocale('es', es);

interface BookingModalV2Props {
  isOpen: boolean;
  theme: AppearanceTheme;
  serviceName?: string;
  servicePrice?: number;
  serviceDuration?: number;
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
  companyId?: string;
  companyAddress?: string;
  companyName?: string;
}

export function BookingModalV2({
  isOpen,
  theme,
  serviceName,
  servicePrice,
  serviceDuration,
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
  companyId,
  companyAddress,
}: BookingModalV2Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOccupiedSlots([]);
    }
  }, [isOpen]);

  // Cargar slots ocupados para todo el rango
  useEffect(() => {
    const loadOccupiedSlotsForRange = async () => {
      if (!isOpen || !companyId) {
        setOccupiedSlots([]);
        return;
      }

      try {
        const occupied = await getOccupiedSlotsForDateRange(companyId, minDate, maxDate);
        setOccupiedSlots(occupied);
      } catch (error) {
        console.error('Error loading occupied slots:', error);
        setOccupiedSlots([]);
      }
    };

    loadOccupiedSlotsForRange();
  }, [isOpen, companyId, minDate, maxDate]);

  // Actualizar slots cuando cambia la fecha
  useEffect(() => {
    const loadOccupiedSlots = async () => {
      if (!selectedDate || !companyId) return;

      try {
        const occupied = await getOccupiedSlotsForDate(companyId, selectedDate);
        setOccupiedSlots(prev => {
          const selectedDateStr = selectedDate.toISOString().split('T')[0];
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

  // Filtrar horarios pasados (más de 15 min de atraso)
  const filterPastSchedules = (schedules: ScheduleSlot[]): ScheduleSlot[] => {
    if (!selectedDate) return schedules;

    const now = new Date();
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Si la fecha seleccionada no es hoy, retornar todos los horarios
    if (selectedDateStr !== todayStr) {
      return schedules;
    }

    // Si es hoy, filtrar horarios que ya pasaron + 15 minutos
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return schedules.filter(schedule => {
      const [hours, minutes] = schedule.start_time.split(':').map(Number);
      const scheduleTime = hours * 60 + minutes;
      // Filtrar horarios con más de 15 min de atraso
      return scheduleTime >= currentTime - 15;
    });
  };

  // Obtener horarios disponibles ordenados
  const getAvailableSchedulesForDate = (): ScheduleSlot[] => {
    if (!selectedDate) return [];
    
    const dayKey = DAY_OF_WEEK_KEYS[selectedDate.getDay()];
    let schedulesForDay = availableSchedules.filter((s: ScheduleSlot) => 
      s.days_of_week?.includes(dayKey)
    );

    // Filtrar horarios pasados
    schedulesForDay = filterPastSchedules(schedulesForDay);

    // Filtrar horarios ocupados
    if (occupiedSlots.length > 0) {
      schedulesForDay = schedulesForDay.filter((schedule) => {
        if (selectedProfessionalId) {
          const professionalOccupiedSlots = occupiedSlots.filter(
            (slot) => slot.professional_id === selectedProfessionalId || slot.professional_id === 'unassigned'
          );
          return !isSlotOccupied(schedule, professionalOccupiedSlots);
        }
        return !isSlotOccupied(schedule, occupiedSlots);
      });
    }

    // Ordenar de más temprano a más tarde
    return schedulesForDay.sort((a, b) => {
      const [aHours, aMinutes] = a.start_time.split(':').map(Number);
      const [bHours, bMinutes] = b.start_time.split(':').map(Number);
      const aTime = aHours * 60 + aMinutes;
      const bTime = bHours * 60 + bMinutes;
      return aTime - bTime;
    });
  };

  // Contar slots disponibles para colores del calendario
  const getAvailableSlotsCount = (date: Date): number => {
    const dayKey = DAY_OF_WEEK_KEYS[date.getDay()];
    let schedulesForDay = availableSchedules.filter((s: ScheduleSlot) => 
      s.days_of_week?.includes(dayKey)
    );

    if (schedulesForDay.length === 0) return 0;

    // Filtrar horarios pasados si es hoy
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (dateStr === todayStr) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      schedulesForDay = schedulesForDay.filter(schedule => {
        const [hours, minutes] = schedule.start_time.split(':').map(Number);
        const scheduleTime = hours * 60 + minutes;
        return scheduleTime >= currentTime - 15;
      });
    }

    // Filtrar ocupados
    if (occupiedSlots.length > 0) {
      const slotsForThisDate = occupiedSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate.toISOString().split('T')[0] === dateStr;
      });

      if (slotsForThisDate.length > 0) {
        return schedulesForDay.filter((schedule) => {
          if (selectedProfessionalId) {
            const professionalOccupiedSlots = slotsForThisDate.filter(
              (slot) => slot.professional_id === selectedProfessionalId || slot.professional_id === 'unassigned'
            );
            return !isSlotOccupied(schedule, professionalOccupiedSlots);
          }
          return !isSlotOccupied(schedule, slotsForThisDate);
        }).length;
      }
    }

    return schedulesForDay.length;
  };

  // Clase CSS según disponibilidad
  const getDayAvailabilityClass = (date: Date): string => {
    if (!isDateAvailable(date)) {
      return 'booking-day-blocked';
    }
    
    const count = getAvailableSlotsCount(date);
    
    if (count === 0) {
      return 'booking-day-no-slots';
    } else if (count >= 1 && count <= 3) {
      return 'booking-day-low-slots';
    } else {
      return 'booking-day-available';
    }
  };

  // Profesionales disponibles
  const getAvailableProfessionals = (): Professional[] => {
    if (!selectedDate || professionals.length === 0) return professionals;
    if (occupiedSlots.length === 0) return professionals;

    const schedulesForDay = getAvailableSchedulesForDate();

    return professionals.filter((pro) => {
      return hasAvailableSlotsForProfessional(pro.id, schedulesForDay, occupiedSlots);
    });
  };

  // Navegación rápida de fechas
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

  const handleFinalSubmit = () => {
    onSubmit();
    setStep(4);
  };

  const handleOpenMaps = () => {
    if (!companyAddress) return;
    const encodedAddress = encodeURIComponent(companyAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const canProceedToStep2 = Boolean(selectedDate);
  const canProceedToStep3 = Boolean(selectedDate && selectedSchedule);
  const canProceedToStep4 = Boolean(
    bookingForm.client_name &&
    bookingForm.client_whatsapp &&
    bookingForm.client_rut &&
    (!requireProfessional || selectedProfessionalId)
  );

  const selectedScheduleData = useMemo(() => {
    return availableSchedules.find(s => s.id === selectedSchedule);
  }, [availableSchedules, selectedSchedule]);

  const selectedProfessionalData = useMemo(() => {
    return professionals.find(p => p.id === selectedProfessionalId);
  }, [professionals, selectedProfessionalId]);

  // Detectar tema oscuro basado en el color de fondo
  const isDarkTheme = useMemo(() => {
    const bgColor = theme.calendarCardColor || theme.bgColor || '#ffffff';
    // Convertir hex a RGB y calcular luminosidad
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }, [theme.calendarCardColor, theme.bgColor]);

  // Paleta de colores según tema
  const colorPalette = useMemo(() => {
    const primaryColor = theme.calendarButtonColor || theme.buttonColor || '#0078d4';
    
    if (isDarkTheme) {
      // Tema oscuro: blancos y azules oscuros
      return {
        surface: '#1e293b',           // Azul oscuro principal
        surfaceLight: '#334155',      // Azul oscuro claro
        surfaceDark: '#0f172a',       // Azul muy oscuro
        text: '#f8fafc',              // Blanco suave
        textSecondary: '#cbd5e1',     // Gris claro
        textMuted: '#94a3b8',         // Gris medio
        primary: primaryColor,
        primaryLight: primaryColor + '30',
        primaryDark: primaryColor + 'cc',
        border: '#475569',            // Borde visible
        borderLight: '#334155',       // Borde sutil
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        overlay: 'rgba(15, 23, 42, 0.95)',
      };
    } else {
      // Tema claro: celestes, blancos y negros
      return {
        surface: '#ffffff',           // Blanco
        surfaceLight: '#f8fafc',      // Blanco azulado
        surfaceDark: '#e2e8f0',       // Gris muy claro
        text: '#1e293b',              // Negro azulado
        textSecondary: '#475569',     // Gris oscuro
        textMuted: '#64748b',         // Gris medio
        primary: '#0ea5e9',           // Celeste vibrante
        primaryLight: '#e0f2fe',      // Celeste muy claro
        primaryDark: '#0284c7',       // Celeste oscuro
        border: '#cbd5e1',            // Borde suave
        borderLight: '#e2e8f0',       // Borde muy suave
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        overlay: 'rgba(15, 23, 42, 0.85)',
      };
    }
  }, [isDarkTheme, theme.calendarButtonColor, theme.buttonColor]);

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="p-0 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col booking-modal-container"
      ariaLabel={`Agendar servicio: ${serviceName}`}
    >
      <style>{`
        /* CSS Variables para el modal */
        .booking-modal-container {
          --surface: ${colorPalette.surface};
          --surface-light: ${colorPalette.surfaceLight};
          --surface-dark: ${colorPalette.surfaceDark};
          --text: ${colorPalette.text};
          --text-secondary: ${colorPalette.textSecondary};
          --text-muted: ${colorPalette.textMuted};
          --primary: ${colorPalette.primary};
          --primary-light: ${colorPalette.primaryLight};
          --primary-dark: ${colorPalette.primaryDark};
          --border: ${colorPalette.border};
          --border-light: ${colorPalette.borderLight};
          --success: ${colorPalette.success};
          --warning: ${colorPalette.warning};
          --error: ${colorPalette.error};
          background: ${colorPalette.surface};
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px ${colorPalette.overlay};
        }

        /* Scrollbar personalizado */
        .booking-modal-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .booking-modal-content::-webkit-scrollbar-track {
          background: var(--surface-light);
          border-radius: 4px;
        }
        
        .booking-modal-content::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        
        .booking-modal-content::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
        
        .booking-modal-content {
          scrollbar-width: thin;
          scrollbar-color: var(--border) var(--surface-light);
        }

        .booking-step-panel {
          animation: bookingStepFade 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes bookingStepFade {
          from { 
            opacity: 0; 
            transform: translateY(12px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }

        /* Estilos del calendario - Diseño moderno y profesional */
        .react-datepicker {
          font-family: inherit !important;
          border: 2px solid #0ea5e9 !important;
          background: #ffffff !important;
          box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.3), 0 8px 10px -6px rgba(14, 165, 233, 0.2) !important;
          border-radius: 1rem !important;
          color: #000000 !important;
          padding: 0.5rem !important;
        }

        .react-datepicker__header {
          background: transparent !important;
          border: none !important;
          padding: 0.25rem 0.25rem 0.5rem !important;
          border-bottom: 2px solid #0ea5e9 !important;
        }

        .react-datepicker__current-month {
          color: #000000 !important;
          font-weight: 700 !important;
          font-size: 0.9rem !important;
          margin-bottom: 0.5rem !important;
        }

        .react-datepicker__month-container {
          background: #ffffff !important;
        }

        .react-datepicker__month {
          background: #ffffff !important;
          color: #000000 !important;
        }

        .react-datepicker__day-names {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          gap: 0.25rem !important;
          margin-top: 0.25rem !important;
        }

        .react-datepicker__day-name {
          color: #6b7280 !important;
          font-weight: 700 !important;
          font-size: 0.65rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          background: transparent !important;
          border-radius: 0.375rem !important;
          padding: 0.25rem 0 !important;
          text-align: center !important;
        }

        .react-datepicker__week {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          gap: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }

        .react-datepicker__day {
          width: 100% !important;
          aspect-ratio: 1 !important;
          height: auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 0.5rem !important;
          font-weight: 600 !important;
          font-size: 0.8rem !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: 2px solid #bfdbfe !important;
          color: #000000 !important;
          background: #ffffff !important;
          cursor: pointer !important;
          position: relative !important;
        }

        .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
          background: #dbeafe !important;
          border-color: #0ea5e9 !important;
          transform: scale(1.05) !important;
          box-shadow: 0 4px 12px -2px rgba(14, 165, 233, 0.3) !important;
        }

        .react-datepicker__day--selected {
          background: #0ea5e9 !important;
          color: #ffffff !important;
          border-color: #0ea5e9 !important;
          box-shadow: 0 4px 16px -4px rgba(14, 165, 233, 0.5), 0 0 0 3px rgba(14, 165, 233, 0.2) !important;
          font-weight: 700 !important;
          transform: scale(1.05) !important;
        }

        .react-datepicker__day--today:not(.react-datepicker__day--selected) {
          border-color: #0ea5e9 !important;
          border-width: 2px !important;
          font-weight: 700 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2) !important;
          background: #ffffff !important;
          color: #000000 !important;
        }

        .react-datepicker__day--disabled {
          color: #9ca3af !important;
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          background: #f9fafb !important;
          border-style: dashed !important;
          border-color: #e5e7eb !important;
        }

        .react-datepicker__day--disabled:hover {
          transform: none !important;
          box-shadow: none !important;
          background: #f9fafb !important;
          border-color: #e5e7eb !important;
        }

        /* Estados de disponibilidad con mejor contraste */
        .react-datepicker__day.booking-day-available {
          border-color: #10b981 !important;
          border-width: 2px !important;
          background: #ffffff !important;
          color: #000000 !important;
        }

        .react-datepicker__day.booking-day-available::after {
          content: '';
          position: absolute;
          top: 4px;
          right: 4px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 4px rgba(16, 185, 129, 0.5);
        }

        .react-datepicker__day.booking-day-low-slots {
          border-color: #f59e0b !important;
          border-width: 2px !important;
          background: #ffffff !important;
          color: #000000 !important;
        }

        .react-datepicker__day.booking-day-low-slots::after {
          content: '';
          position: absolute;
          top: 4px;
          right: 4px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 4px rgba(245, 158, 11, 0.5);
        }

        .react-datepicker__day.booking-day-no-slots {
          border-color: #ef4444 !important;
          border-width: 2px !important;
          background: #ffffff !important;
          color: #6b7280 !important;
          opacity: 0.6 !important;
        }

        .react-datepicker__day.booking-day-blocked {
          color: #9ca3af !important;
          opacity: 0.4 !important;
          border-style: dashed !important;
          border-color: #e5e7eb !important;
          cursor: not-allowed !important;
          background: #f9fafb !important;
        }
      `}</style>

      {/* Header */}
      <div 
        className="px-4 sm:px-5 py-3 border-b-2"
        style={{ 
          borderColor: colorPalette.border,
          background: `linear-gradient(to bottom, ${colorPalette.surface}, ${colorPalette.surfaceLight})`
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p 
              className="text-xs uppercase tracking-wider font-semibold mb-1" 
              style={{ color: '#000000' }}
            >
              Agendar servicio
            </p>
            <h3 
              id="booking-modal-title"
              className="text-lg sm:text-xl font-bold truncate leading-tight"
              style={{ color: colorPalette.text }}
            >
              {serviceName}
            </h3>
            
            {/* Metadatos del servicio */}
            <div 
              className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mt-2"
              style={{ color: colorPalette.textSecondary }}
            >
              {serviceDuration && (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
                  style={{ 
                    background: colorPalette.surfaceLight,
                    border: `1px solid ${colorPalette.borderLight}`,
                    color: '#000000'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {serviceDuration} min
                </span>
              )}
              {servicePrice !== undefined && servicePrice > 0 && (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold"
                  style={{ 
                    background: colorPalette.primaryLight,
                    color: colorPalette.primary,
                    border: `1px solid ${colorPalette.primary}`
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ${servicePrice.toLocaleString()}
                </span>
              )}
              {selectedProfessionalData && step >= 3 && (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
                  style={{ 
                    background: colorPalette.surfaceLight,
                    border: `1px solid ${colorPalette.borderLight}`,
                    color: '#000000'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {selectedProfessionalData.name}
                </span>
              )}
            </div>
          </div>
          
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="text-xl leading-none flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 min-w-[36px] min-h-[36px] flex items-center justify-center font-light"
            style={{ 
              color: '#000000',
              background: colorPalette.surfaceLight,
              border: `2px solid ${colorPalette.borderLight}`
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Progress indicator con 4 pasos */}
        <div className="mt-3 px-1">
          <div className="flex items-center justify-center gap-0.5 sm:gap-1" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
            {[
              { num: 1, label: 'Fecha' },
              { num: 2, label: 'Hora' },
              { num: 3, label: 'Datos' },
              { num: 4, label: 'Confirmar' },
            ].map((stepData, index) => (
              <div key={stepData.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 border-2 ${
                      step >= stepData.num ? 'scale-110' : 'scale-100'
                    }`}
                    style={{
                      backgroundColor: step >= stepData.num ? colorPalette.primary : colorPalette.surfaceLight,
                      borderColor: step >= stepData.num ? colorPalette.primary : colorPalette.border,
                      color: step >= stepData.num ? '#ffffff' : colorPalette.textMuted,
                      boxShadow: step >= stepData.num 
                        ? `0 4px 12px -2px ${colorPalette.primary}, 0 0 0 3px ${colorPalette.primaryLight}` 
                        : 'none'
                    }}
                    aria-current={step === stepData.num ? 'step' : undefined}
                  >
                    {step > stepData.num ? '✓' : stepData.num}
                  </div>
                  <span 
                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide"
                    style={{ 
                      color: step >= stepData.num ? colorPalette.text : colorPalette.textMuted
                    }}
                  >
                    {stepData.label}
                  </span>
                </div>
                {index < 3 && (
                  <div 
                    className="w-4 sm:w-8 h-0.5 mx-0.5 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: step > stepData.num ? colorPalette.primary : colorPalette.borderLight
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        className="px-4 sm:px-5 py-3 sm:py-4 flex-1 min-h-0 overflow-y-auto booking-modal-content"
        style={{ 
          backgroundColor: colorPalette.surfaceLight,
          color: colorPalette.text
        }}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="booking-step-panel space-y-3"
            >
              {/* Paso 1: Selección de fecha */}
              <div className="space-y-3 max-w-xl mx-auto">
                <label 
                  id="booking-date-picker-label"
                  className="block text-sm sm:text-base font-bold"
                  style={{ color: '#000000' }}
                >
                  <span className="mr-1.5 text-lg" aria-hidden="true">📆</span>
                  Selecciona una fecha
                </label>

                {/* Botones de navegación rápida */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold" style={{ color: '#000000' }}>
                    Ir a:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Hoy', action: () => selectNearestAvailable(new Date()) },
                      { label: 'Mañana', action: () => { const d = new Date(); d.setDate(d.getDate() + 1); selectNearestAvailable(d); } },
                      { label: 'Próxima semana', action: () => { const d = new Date(); d.setDate(d.getDate() + 7); selectNearestAvailable(d); } },
                    ].map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.action}
                        className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ 
                          borderColor: colorPalette.border,
                          backgroundColor: colorPalette.surface,
                          color: '#000000',
                          boxShadow: `0 2px 8px -2px ${colorPalette.overlay}`
                        }}
                        aria-label={`Ir a ${action.label}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendario */}
                <div className="w-full flex justify-center">
                  <div 
                    className="border-2 rounded-xl p-2 sm:p-3 shadow-lg transition-all w-full max-w-full sm:max-w-sm mx-auto flex flex-col items-center"
                    style={{ 
                      backgroundColor: '#ffffff',
                      borderColor: '#0ea5e9',
                      boxShadow: `0 10px 30px -5px rgba(14, 165, 233, 0.3)`
                    }}
                  >
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      minDate={minDate}
                      maxDate={maxDate}
                      filterDate={isDateAvailable}
                      inline
                      locale="es"
                      dateFormat="dd/MM/yyyy"
                      dayClassName={getDayAvailabilityClass}
                      monthsShown={1}
                      fixedHeight
                    />
                  </div>
                </div>

                {/* Leyenda de disponibilidad */}
                <div 
                  className="flex flex-wrap items-center justify-center gap-2 mt-3 p-2 rounded-lg border"
                  style={{
                    backgroundColor: colorPalette.surfaceDark,
                    borderColor: colorPalette.borderLight
                  }}
                  role="list" 
                  aria-label="Leyenda de disponibilidad"
                >
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold" role="listitem" style={{ color: '#000000' }}>
                    <span className="w-2.5 h-2.5 rounded-full border" aria-hidden="true" style={{ backgroundColor: colorPalette.success, borderColor: colorPalette.success }}></span>
                    <span>Disponible</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold" role="listitem" style={{ color: '#000000' }}>
                    <span className="w-2.5 h-2.5 rounded-full border" aria-hidden="true" style={{ backgroundColor: colorPalette.warning, borderColor: colorPalette.warning }}></span>
                    <span>Pocos cupos</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold" role="listitem" style={{ color: '#000000' }}>
                    <span className="w-2.5 h-2.5 rounded-full border" aria-hidden="true" style={{ backgroundColor: colorPalette.error, borderColor: colorPalette.error }}></span>
                    <span>Sin horas</span>
                  </div>
                </div>

                {/* Fecha seleccionada */}
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-3 rounded-lg border-2"
                    style={{ 
                      backgroundColor: colorPalette.primaryLight,
                      borderColor: colorPalette.primary,
                      boxShadow: `0 4px 12px -2px ${colorPalette.primary}`
                    }}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5" 
                      style={{ color: '#000000' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="booking-step-panel space-y-3 max-w-2xl mx-auto"
            >
              {/* Paso 2: Selección de horario */}
              {selectedDate && (
                <div 
                  className="p-3 rounded-lg border-2"
                  style={{ 
                    backgroundColor: colorPalette.primaryLight,
                    borderColor: colorPalette.primary,
                    boxShadow: `0 4px 12px -2px ${colorPalette.primary}`
                  }}
                >
                  <p className="text-xs font-bold flex items-center gap-1.5" 
                    style={{ color: colorPalette.text }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedDate.toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm sm:text-base font-bold mb-3 flex items-center gap-1.5"
                  style={{ color: '#000000' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selecciona un horario
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {getAvailableSchedulesForDate().map((schedule: ScheduleSlot) => (
                    <motion.button
                      key={schedule.id}
                      type="button"
                      onClick={() => onScheduleChange(schedule.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 rounded-lg border-2 transition-all text-center"
                      style={{
                        borderColor: selectedSchedule === schedule.id ? colorPalette.primary : colorPalette.border,
                        backgroundColor: selectedSchedule === schedule.id 
                          ? colorPalette.primary 
                          : colorPalette.surface,
                        boxShadow: selectedSchedule === schedule.id 
                          ? `0 4px 16px -4px ${colorPalette.primary}, 0 0 0 3px ${colorPalette.primaryLight}`
                          : `0 2px 8px -2px ${colorPalette.overlay}`
                      }}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-base"
                          style={{ color: selectedSchedule === schedule.id ? '#ffffff' : colorPalette.text }}
                        >
                          {schedule.start_time}
                        </p>
                        <p className="text-xs font-medium"
                          style={{ color: selectedSchedule === schedule.id ? '#ffffff' : '#000000', opacity: selectedSchedule === schedule.id ? 0.9 : 1 }}
                        >
                          {schedule.end_time}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {getAvailableSchedulesForDate().length === 0 && (
                  <div 
                    className="text-center py-6 px-3 rounded-lg border-2 border-dashed"
                    style={{ 
                      borderColor: colorPalette.borderLight,
                      backgroundColor: colorPalette.surfaceDark,
                      color: colorPalette.textMuted
                    }}
                  >
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ opacity: 0.4, color: '#6b7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>No hay horarios disponibles</p>
                    <p className="text-xs mt-1" style={{ color: '#000000' }}>Por favor selecciona otro día</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="booking-step-panel space-y-3 max-w-xl mx-auto"
            >
              {/* Paso 3: Datos personales y profesional */}
              
              {/* Resumen de la reserva hasta ahora */}
              <div 
                className="p-3 rounded-lg border-2"
                style={{ 
                  backgroundColor: colorPalette.primaryLight,
                  borderColor: colorPalette.primary,
                  boxShadow: `0 4px 12px -2px ${colorPalette.primary}`
                }}
              >
                <h4 className="font-bold mb-2 flex items-center gap-1.5 text-sm" style={{ color: colorPalette.text }}>
                  <span className="text-base">📋</span>
                  Resumen de tu reserva
                </h4>
                <div className="space-y-1.5 text-xs font-medium" style={{ color: colorPalette.text }}>
                  <p><strong>Fecha:</strong> {selectedDate?.toLocaleDateString('es-CL', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}</p>
                  {selectedScheduleData && (
                    <p><strong>Horario:</strong> {selectedScheduleData.start_time} - {selectedScheduleData.end_time}</p>
                  )}
                </div>
              </div>

              {/* Selección de profesional */}
              {getAvailableProfessionals().length > 0 && (
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#000000' }}>
                    <span className="mr-1.5">👤</span>
                    Selecciona un profesional {requireProfessional && <span style={{ color: colorPalette.error }}>*</span>}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getAvailableProfessionals().map((pro) => (
                      <button
                        key={pro.id}
                        type="button"
                        onClick={() => onProfessionalChange?.(pro.id)}
                        className="w-full text-left px-3 py-2 rounded-lg border-2 transition-all hover:scale-[1.02] active:scale-95"
                        style={{ 
                          borderColor: selectedProfessionalId === pro.id ? colorPalette.primary : colorPalette.border,
                          backgroundColor: selectedProfessionalId === pro.id 
                            ? colorPalette.primaryLight
                            : colorPalette.surface,
                          boxShadow: selectedProfessionalId === pro.id 
                            ? `0 4px 12px -2px ${colorPalette.primary}`
                            : `0 2px 6px -2px ${colorPalette.overlay}`
                        }}
                      >
                        <div className="font-bold" style={{ color: colorPalette.text }}>{pro.name}</div>
                        {(pro.email || pro.phone) && (
                          <div className="text-xs mt-1 font-medium" style={{ color: '#000000' }}>
                            {[pro.email, pro.phone].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario de datos personales */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-1.5" style={{ color: colorPalette.text }}>
                  <span className="text-base">📝</span>
                  Tus datos de contacto
                </h4>

                {/* Nombre */}
                <div>
                  <label htmlFor="client-name" className="block text-xs font-bold mb-1.5" style={{ color: '#000000' }}>
                    Nombre completo *
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all font-medium"
                    style={{ 
                      borderColor: colorPalette.border,
                      backgroundColor: colorPalette.surface,
                      color: colorPalette.text,
                      '--tw-ring-color': colorPalette.primary
                    } as React.CSSProperties}
                    value={bookingForm.client_name}
                    onChange={(e) => onFormChange('client_name', e.target.value)}
                  />
                </div>

                {/* RUT */}
                <div>
                  <label htmlFor="client-rut" className="block text-xs font-bold mb-1.5" style={{ color: '#000000' }}>
                    RUT *
                  </label>
                  <input
                    id="client-rut"
                    type="text"
                    required
                    placeholder="Ej: 12.345.678-9"
                    className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all font-medium"
                    style={{ 
                      borderColor: colorPalette.border,
                      backgroundColor: colorPalette.surface,
                      color: colorPalette.text,
                      '--tw-ring-color': colorPalette.primary
                    } as React.CSSProperties}
                    value={bookingForm.client_rut || ''}
                    onChange={(e) => onFormChange('client_rut', e.target.value)}
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label htmlFor="client-whatsapp" className="block text-xs font-bold mb-1.5" style={{ color: '#000000' }}>
                    WhatsApp *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-sm" style={{ color: '#000000' }}>+56</span>
                    <input
                      id="client-whatsapp"
                      type="tel"
                      required
                      placeholder="912345678"
                      maxLength={9}
                      className="w-full pl-12 pr-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all font-medium"
                      style={{ 
                        borderColor: colorPalette.border,
                        backgroundColor: colorPalette.surface,
                        color: colorPalette.text,
                        '--tw-ring-color': colorPalette.primary
                      } as React.CSSProperties}
                      value={bookingForm.client_whatsapp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        onFormChange('client_whatsapp', value);
                      }}
                    />
                  </div>
                </div>

                {/* Comentarios */}
                <div>
                  <label htmlFor="client-comment" className="block text-xs font-bold mb-1.5" style={{ color: '#000000' }}>
                    Comentarios o solicitudes especiales (opcional)
                  </label>
                  <textarea
                    id="client-comment"
                    rows={3}
                    placeholder="Ej: Prefiero atención en la mañana..."
                    className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all resize-none font-medium"
                    style={{ 
                      borderColor: colorPalette.border,
                      backgroundColor: colorPalette.surface,
                      color: colorPalette.text,
                      '--tw-ring-color': colorPalette.primary
                    } as React.CSSProperties}
                    value={bookingForm.client_comment}
                    onChange={(e) => onFormChange('client_comment', e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="booking-step-panel max-w-lg mx-auto"
            >
              {/* Paso 4: Confirmación */}
              <div className="text-center py-4 space-y-4">
                {/* Icono de éxito */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border-4"
                  style={{ 
                    backgroundColor: colorPalette.primaryLight,
                    borderColor: colorPalette.success,
                    boxShadow: `0 8px 24px -6px ${colorPalette.success}`
                  }}
                >
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colorPalette.success }} strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#000000' }}>
                    ¡Reserva agendada!
                  </h3>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: '#000000' }}>
                    Se le enviará una confirmación para verificar su cita
                  </p>
                </div>

                {/* Resumen completo */}
                <div 
                  className="p-4 rounded-xl border-2 text-left shadow-lg"
                  style={{ 
                    backgroundColor: colorPalette.surface,
                    borderColor: colorPalette.border,
                    boxShadow: `0 10px 30px -10px ${colorPalette.overlay}`
                  }}
                >
                  <h4 className="font-bold mb-3 text-center text-sm" style={{ color: '#000000' }}>
                    📋 Resumen de tu reserva
                  </h4>
                  <div className="space-y-2 text-xs font-medium" style={{ color: '#000000' }}>
                    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: colorPalette.borderLight }}>
                      <span style={{ color: '#374151' }}>Servicio:</span>
                      <span className="font-bold">{serviceName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: colorPalette.borderLight }}>
                      <span style={{ color: '#374151' }}>Fecha:</span>
                      <span className="font-bold">
                        {selectedDate?.toLocaleDateString('es-CL', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {selectedScheduleData && (
                      <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: colorPalette.borderLight }}>
                        <span style={{ color: '#374151' }}>Horario:</span>
                        <span className="font-bold">{selectedScheduleData.start_time} - {selectedScheduleData.end_time}</span>
                      </div>
                    )}
                    {selectedProfessionalData && (
                      <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: colorPalette.borderLight }}>
                        <span style={{ color: '#374151' }}>Profesional:</span>
                        <span className="font-bold">{selectedProfessionalData.name}</span>
                      </div>
                    )}
                    {servicePrice !== undefined && servicePrice > 0 && (
                      <div 
                        className="flex justify-between items-center pt-2 mt-1.5"
                        style={{ 
                          borderTop: `2px solid ${colorPalette.border}`,
                        }}
                      >
                        <span className="font-bold" style={{ color: '#374151' }}>Precio:</span>
                        <span className="font-bold text-lg" style={{ color: colorPalette.primary }}>
                          ${servicePrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón "Cómo llegar" */}
                {companyAddress && (
                  <button
                    type="button"
                    onClick={handleOpenMaps}
                    className="px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 mx-auto transition-all hover:scale-105 active:scale-95"
                    style={{ 
                      backgroundColor: colorPalette.primary,
                      color: '#ffffff',
                      boxShadow: `0 6px 20px -6px ${colorPalette.primary}`
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Cómo llegar
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {step < 4 && (
        <div 
          className="px-4 sm:px-5 py-3 border-t-2 flex flex-col sm:flex-row justify-between gap-2 sm:gap-3"
          style={{ 
            borderColor: colorPalette.border,
            background: `linear-gradient(to top, ${colorPalette.surface}, ${colorPalette.surfaceLight})`
          }}
        >
          {step === 1 ? (
            <>
              <AnimatedButton
                onClick={onClose}
                className="px-4 py-2 border-2 rounded-lg font-semibold text-sm order-2 sm:order-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:scale-[1.02] active:scale-95 transition-all"
                style={{
                  backgroundColor: colorPalette.surface,
                  borderColor: colorPalette.border,
                  color: '#374151'
                }}
              >
                Cancelar
              </AnimatedButton>
              <div className="flex flex-col items-end gap-2 order-1 sm:order-2">
                <AnimatedButton
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  style={{ 
                    backgroundColor: colorPalette.primary,
                    color: '#ffffff',
                    boxShadow: canProceedToStep2 
                      ? `0 4px 16px -4px ${colorPalette.primary}` 
                      : 'none'
                  }}
                  className="px-5 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm min-w-[140px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Ver horarios →
                </AnimatedButton>
                {!selectedDate && (
                  <p className="text-xs font-medium text-right max-w-[200px]" style={{ color: '#000000' }}>
                    Selecciona una fecha para continuar
                  </p>
                )}
              </div>
            </>
          ) : step === 2 ? (
            <>
              <AnimatedButton
                onClick={() => setStep(1)}
                className="px-4 py-2 border-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:scale-[1.02] active:scale-95 transition-all"
                style={{
                  backgroundColor: colorPalette.surface,
                  borderColor: colorPalette.border,
                  color: '#374151'
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </AnimatedButton>
              <div className="flex flex-col items-end gap-2">
                <AnimatedButton
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  style={{ 
                    backgroundColor: colorPalette.primary,
                    color: '#ffffff',
                    boxShadow: canProceedToStep3 
                      ? `0 4px 16px -4px ${colorPalette.primary}` 
                      : 'none'
                  }}
                  className="px-5 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm min-w-[140px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Continuar →
                </AnimatedButton>
                {!selectedSchedule && (
                  <p className="text-xs font-medium text-right max-w-[200px]" style={{ color: '#000000' }}>
                    Selecciona un horario para continuar
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <AnimatedButton
                onClick={() => setStep(2)}
                className="px-4 py-2 border-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:scale-[1.02] active:scale-95 transition-all"
                style={{
                  backgroundColor: colorPalette.surface,
                  borderColor: colorPalette.border,
                  color: '#374151'
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </AnimatedButton>
              <AnimatedButton
                onClick={handleFinalSubmit}
                disabled={!canProceedToStep4}
                style={{ 
                  backgroundColor: canProceedToStep4 ? colorPalette.success : colorPalette.textMuted,
                  color: '#ffffff',
                  boxShadow: canProceedToStep4 
                    ? `0 6px 20px -6px ${colorPalette.success}` 
                    : 'none'
                }}
                className="px-5 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:scale-[1.02] active:scale-95 transition-all min-w-[140px]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Agendar
              </AnimatedButton>
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div 
          className="px-4 sm:px-5 py-3 border-t-2 flex justify-center"
          style={{ 
            borderColor: colorPalette.border,
            background: `linear-gradient(to top, ${colorPalette.surface}, ${colorPalette.surfaceLight})`
          }}
        >
          <AnimatedButton
            onClick={onClose}
            className="px-6 py-2.5 border-2 rounded-lg font-bold text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:scale-[1.02] active:scale-95 transition-all"
            style={{
              backgroundColor: colorPalette.primary,
              borderColor: colorPalette.primary,
              color: '#ffffff',
              boxShadow: `0 4px 16px -4px ${colorPalette.primary}`
            }}
          >
            Cerrar
          </AnimatedButton>
        </div>
      )}
    </AnimatedModal>
  );
}
