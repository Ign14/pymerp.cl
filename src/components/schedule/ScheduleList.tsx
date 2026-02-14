import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { format, startOfWeek, endOfWeek, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AnimatedModal from '../animations/AnimatedModal';
import { Appointment, Professional, AppointmentStatus } from '../../types';
import { useServiceName } from '../../hooks/useServiceName';

// Registrar locale español para el calendario
registerLocale('es', es);

// Ref persistente fuera del componente para mantener el estado entre remontajes
const dateRangePersistRef = { current: 'week' as 'week' | 'month' | 'custom' };
const customRangePersistRef = { current: { start: '', end: '' } as { start: string; end: string } };

interface ScheduleListProps {
  appointments: Appointment[];
  professional?: Professional;
  onSelectAppointment: (appointment: Appointment) => void;
  emptyLabel: string;
  selectedDate?: Date;
  onDateRangeChange?: (start: Date, end: Date) => void;
}

export function ScheduleList({
  appointments,
  professional,
  onSelectAppointment,
  emptyLabel,
  selectedDate = new Date(),
  onDateRangeChange,
}: ScheduleListProps) {
  // Estado para el rango de fechas seleccionado
  // Usar el ref persistente fuera del componente para mantener el estado entre remontajes
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>(() => {
    console.log('ScheduleList: Initializing dateRange from persistent ref:', dateRangePersistRef.current);
    return dateRangePersistRef.current;
  });
  
  // Sincronizar el ref con el estado cada vez que cambia
  useEffect(() => {
    if (dateRangePersistRef.current !== dateRange) {
      console.log('dateRange changed to:', dateRange, 'ref updated from', dateRangePersistRef.current);
      dateRangePersistRef.current = dateRange;
    }
  }, [dateRange]);
  
  // Log cuando el componente se monta o remonta
  useEffect(() => {
    console.log('ScheduleList: Component mounted/remounted, dateRange:', dateRange, 'ref:', dateRangePersistRef.current);
    // Si el ref tiene un valor diferente al estado, restaurar el estado desde el ref
    if (dateRangePersistRef.current !== dateRange) {
      console.log('ScheduleList: Restoring dateRange from ref:', dateRangePersistRef.current);
      setDateRange(dateRangePersistRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar
  
  // Proteger el estado dateRange de ser reseteado por efectos externos
  // Si el estado cambia a 'week' pero el ref tiene otro valor, restaurar desde el ref
  useEffect(() => {
    if (dateRange === 'week' && dateRangePersistRef.current !== 'week') {
      console.log('ScheduleList: Detected unexpected reset to week, restoring from ref:', dateRangePersistRef.current);
      setDateRange(dateRangePersistRef.current);
    }
  }, [dateRange]);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    if (dateRangePersistRef.current === 'custom' && customRangePersistRef.current.start && customRangePersistRef.current.end) {
      return customRangePersistRef.current.start;
    }
    return format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    if (dateRangePersistRef.current === 'custom' && customRangePersistRef.current.start && customRangePersistRef.current.end) {
      return customRangePersistRef.current.end;
    }
    return format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const onDateRangeChangeRef = useRef(onDateRangeChange);
  
  // Mantener la referencia actualizada
  useEffect(() => {
    onDateRangeChangeRef.current = onDateRangeChange;
  }, [onDateRangeChange]);

  // Sincronizar fechas personalizadas cuando cambia selectedDate (solo para semana)
  // IMPORTANTE: No resetear dateRange aquí, solo actualizar fechas si es semana
  useEffect(() => {
    if (dateRange === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      setCustomStartDate(format(weekStart, 'yyyy-MM-dd'));
      setCustomEndDate(format(weekEnd, 'yyyy-MM-dd'));
    }
  }, [selectedDate, dateRange]);

  const dateRangeDates = useMemo(() => {
    const now = new Date();
    // Crear una fecha normalizada para hoy (sin hora)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setDateError(null);

    try {
      switch (dateRange) {
        case 'week':
          const weekStart = startOfWeek(today, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
          weekEnd.setHours(23, 59, 59, 999);
          return { start: weekStart, end: weekEnd };
        case 'month':
          // Para "Mes", usar el primer y último día del mes actual
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          monthStart.setHours(0, 0, 0, 0);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          return { start: monthStart, end: monthEnd };
        case 'custom':
          const startDate = parseISO(customStartDate);
          const endDate = parseISO(customEndDate);
          
          if (!isValid(startDate) || !isValid(endDate)) {
            setDateError('Fechas inválidas');
            return { start: today, end: today };
          }
          
          if (startDate > endDate) {
            setDateError('La fecha de inicio debe ser anterior a la fecha de fin');
            return { start: today, end: today };
          }
          
          const startNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
          const endNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
          return { start: startNorm, end: endNorm };
        default:
          return { start: today, end: today };
      }
    } catch (error) {
      setDateError('Error al procesar las fechas');
      return { start: today, end: today };
    }
  }, [dateRange, customStartDate, customEndDate]);

  // Notificar cambios de rango de fechas de forma estable
  // Usar un ref para evitar cambios innecesarios que puedan afectar el modo
  const lastNotifiedRange = useRef<{ start: Date; end: Date } | null>(null);
  const isUpdatingFromButton = useRef(false);
  
  useEffect(() => {
    // Si estamos actualizando desde un botón, no notificar aquí (ya se notificó en handleDateRangeChange)
    if (isUpdatingFromButton.current) {
      isUpdatingFromButton.current = false;
      return;
    }
    
    if (onDateRangeChangeRef.current && !dateError) {
      const currentRange = { start: dateRangeDates.start, end: dateRangeDates.end };
      
      // Solo notificar si el rango realmente cambió
      if (
        !lastNotifiedRange.current ||
        lastNotifiedRange.current.start.getTime() !== currentRange.start.getTime() ||
        lastNotifiedRange.current.end.getTime() !== currentRange.end.getTime()
      ) {
        lastNotifiedRange.current = currentRange;
        onDateRangeChangeRef.current(currentRange.start, currentRange.end);
      }
    }
  }, [dateRangeDates.start, dateRangeDates.end, dateError]);

  const filteredAppointments = useMemo(() => {
    if (dateError) {
      return [];
    }

    // Filtrar por profesional si está especificado
    let appointmentsToFilter = appointments;
    if (professional) {
      appointmentsToFilter = appointments.filter((apt) => apt.professional_id === professional.id);
    }

    let filtered = appointmentsToFilter.filter((apt) => {
      try {
        // Parsear la fecha de la cita - puede venir como Date, string o Timestamp
        let aptDate: Date;
        if (apt.appointment_date instanceof Date) {
          aptDate = new Date(apt.appointment_date);
        } else if (typeof apt.appointment_date === 'string') {
          aptDate = new Date(apt.appointment_date);
        } else if (apt.appointment_date && typeof apt.appointment_date === 'object' && 'toDate' in apt.appointment_date) {
          // Firestore Timestamp
          aptDate = (apt.appointment_date as any).toDate();
        } else {
          return false;
        }

        if (!isValid(aptDate)) return false;
        
        // Normalizar la fecha de la cita (solo día, sin hora)
        const aptYear = aptDate.getFullYear();
        const aptMonth = aptDate.getMonth();
        const aptDay = aptDate.getDate();
        const aptDateNormalized = new Date(aptYear, aptMonth, aptDay, 0, 0, 0, 0);
        
        // Normalizar las fechas del rango
        const rangeStart = new Date(dateRangeDates.start);
        const rangeStartYear = rangeStart.getFullYear();
        const rangeStartMonth = rangeStart.getMonth();
        const rangeStartDay = rangeStart.getDate();
        const rangeStartNormalized = new Date(rangeStartYear, rangeStartMonth, rangeStartDay, 0, 0, 0, 0);
        
        const rangeEnd = new Date(dateRangeDates.end);
        const rangeEndYear = rangeEnd.getFullYear();
        const rangeEndMonth = rangeEnd.getMonth();
        const rangeEndDay = rangeEnd.getDate();
        const rangeEndNormalized = new Date(rangeEndYear, rangeEndMonth, rangeEndDay, 23, 59, 59, 999);
        
        // Verificar si la fecha de la cita está dentro del rango
        const isInRange = aptDateNormalized.getTime() >= rangeStartNormalized.getTime() && aptDateNormalized.getTime() <= rangeEndNormalized.getTime();
        
        return isInRange;
      } catch (error) {
        console.error('Error al filtrar cita por fecha:', error, apt);
        return false;
      }
    });

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((apt) => selectedStatuses.includes(apt.status));
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.appointment_date).getTime();
      const dateB = new Date(b.appointment_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  }, [appointments, professional, dateRangeDates, selectedStatuses, dateError]);

  const toggleStatus = useCallback((status: AppointmentStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  // Manejar cambios de rango de fechas con actualización inmediata
  const handleDateRangeChange = useCallback((range: 'week' | 'month' | 'custom') => {
    console.log('handleDateRangeChange called with:', range, 'current dateRange:', dateRangePersistRef.current);
    // Marcar que estamos actualizando desde un botón
    isUpdatingFromButton.current = true;
    
    // Actualizar el estado primero - usar función de actualización para asegurar que se actualice
    setDateRange((prevRange) => {
      console.log('setDateRange: prevRange =', prevRange, 'newRange =', range);
      dateRangePersistRef.current = range;
      return range;
    });
    setDateError(null);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (range) {
      case 'week':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        weekEnd.setHours(23, 59, 59, 999);
        setCustomStartDate(format(weekStart, 'yyyy-MM-dd'));
        setCustomEndDate(format(weekEnd, 'yyyy-MM-dd'));
        // Notificar cambio inmediatamente para "Semana"
        if (onDateRangeChangeRef.current) {
          lastNotifiedRange.current = { start: weekStart, end: weekEnd };
          onDateRangeChangeRef.current(weekStart, weekEnd);
        }
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        setCustomStartDate(format(monthStart, 'yyyy-MM-dd'));
        setCustomEndDate(format(monthEnd, 'yyyy-MM-dd'));
        // Notificar cambio inmediatamente para "Mes"
        if (onDateRangeChangeRef.current) {
          lastNotifiedRange.current = { start: monthStart, end: monthEnd };
          onDateRangeChangeRef.current(monthStart, monthEnd);
        }
        break;
      case 'custom':
        // Abrir modal para seleccionar fechas personalizadas
        const currentStart = parseISO(customStartDate);
        const currentEnd = parseISO(customEndDate);
        setTempStartDate(isValid(currentStart) ? currentStart : today);
        setTempEndDate(isValid(currentEnd) ? currentEnd : today);
        setShowCustomDateModal(true);
        break;
    }
  }, [customStartDate, customEndDate]);

  // Aplicar fechas personalizadas desde el modal
  const handleApplyCustomDates = useCallback(() => {
    if (!tempStartDate || !tempEndDate) {
      setDateError('Por favor selecciona ambas fechas');
      return;
    }

    if (tempStartDate > tempEndDate) {
      setDateError('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    const startNorm = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth(), tempStartDate.getDate(), 0, 0, 0, 0);
    const endNorm = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), tempEndDate.getDate(), 23, 59, 59, 999);

    const startStr = format(startNorm, 'yyyy-MM-dd');
    const endStr = format(endNorm, 'yyyy-MM-dd');
    customRangePersistRef.current = { start: startStr, end: endStr };
    setCustomStartDate(startStr);
    setCustomEndDate(endStr);
    setDateError(null);
    setShowCustomDateModal(false);
    dateRangePersistRef.current = 'custom';
    setDateRange('custom');
    lastNotifiedRange.current = { start: startNorm, end: endNorm };
    if (onDateRangeChangeRef.current) {
      onDateRangeChangeRef.current(startNorm, endNorm);
    }
  }, [tempStartDate, tempEndDate]);

  // Cancelar selección de fechas personalizadas
  const handleCancelCustomDates = useCallback(() => {
    setShowCustomDateModal(false);
    setDateError(null);
  }, []);

  const statusOptions: { value: AppointmentStatus; label: string; color: string }[] = [
    { value: AppointmentStatus.REQUESTED, label: 'Solicitada', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmada', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: AppointmentStatus.COMPLETED, label: 'Completada', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelada', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { value: AppointmentStatus.NO_SHOW, label: 'No asistió', color: 'bg-red-100 text-red-700 border-red-300' },
  ];

  // Renderizar siempre los filtros y el modal, independientemente de si hay citas o no
  const renderFiltersAndModal = () => (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-indigo-600">{filteredAppointments.length}</span> cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
          </div>
        </div>
        <FiltersSection
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            console.log('FiltersSection onDateRangeChange called with:', range, 'current dateRange:', dateRange);
            handleDateRangeChange(range);
          }}
          activeRangeStart={dateRangeDates.start}
          activeRangeEnd={dateRangeDates.end}
          selectedStatuses={selectedStatuses}
          onToggleStatus={toggleStatus}
          onClearStatuses={() => setSelectedStatuses([])}
          statusOptions={statusOptions}
          dateError={dateError}
        />
      </div>

      {/* Modal para selección de fechas personalizadas - MEJORADO */}
      <AnimatedModal
        isOpen={showCustomDateModal}
        onClose={handleCancelCustomDates}
        ariaLabel="Seleccionar rango de fechas personalizado"
        className="max-w-2xl"
      >
        <div className="p-6 sm:p-8">
          {/* Header del modal */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Rango Personalizado
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">Selecciona cualquier período de fechas</p>
              </div>
            </div>
            <button
              onClick={handleCancelCustomDates}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido del modal */}
          <div className="space-y-6">
            {/* Grid de calendarios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Fecha de inicio */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Fecha de inicio
                </label>
                <div className="border-2 border-indigo-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <DatePicker
                    selected={tempStartDate}
                    onChange={(date: Date | null) => setTempStartDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    inline
                    maxDate={tempEndDate || undefined}
                    calendarClassName="custom-datepicker"
                  />
                </div>
                {tempStartDate && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-indigo-700">
                      {format(tempStartDate, "dd 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}
              </div>

              {/* Fecha de fin */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Fecha de fin
                </label>
                <div className="border-2 border-indigo-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <DatePicker
                    selected={tempEndDate}
                    onChange={(date: Date | null) => setTempEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    inline
                    minDate={tempStartDate || undefined}
                    calendarClassName="custom-datepicker"
                  />
                </div>
                {tempEndDate && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-indigo-700">
                      {format(tempEndDate, "dd 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen del rango seleccionado */}
            {tempStartDate && tempEndDate && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-indigo-900">Período seleccionado:</p>
                    <p className="text-base font-semibold text-indigo-700">
                      {format(tempStartDate, "dd 'de' MMMM", { locale: es })} → {format(tempEndDate, "dd 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    <p className="text-xs text-indigo-600">
                      {Math.ceil((tempEndDate.getTime() - tempStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} días en total
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {dateError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-0.5">Error de validación</p>
                    <p className="text-sm text-red-700">{dateError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción mejorados */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancelCustomDates}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
              <button
                onClick={handleApplyCustomDates}
                disabled={!tempStartDate || !tempEndDate}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aplicar Rango
              </button>
            </div>
          </div>
        </div>

        {/* Estilos para los calendarios inline */}
        <style>{`
          .custom-datepicker {
            width: 100% !important;
            font-family: inherit !important;
          }
          .custom-datepicker .react-datepicker__header {
            background-color: #eef2ff !important;
            border-bottom: 2px solid #c7d2fe !important;
            padding-top: 0.75rem !important;
            padding-bottom: 0.75rem !important;
          }
          .custom-datepicker .react-datepicker__current-month {
            color: #1e293b !important;
            font-weight: 700 !important;
            font-size: 0.95rem !important;
          }
          .custom-datepicker .react-datepicker__day-name {
            color: #475569 !important;
            font-weight: 600 !important;
            font-size: 0.75rem !important;
          }
          .custom-datepicker .react-datepicker__day {
            color: #1e293b !important;
            font-weight: 500 !important;
            border-radius: 0.5rem !important;
            margin: 0.15rem !important;
          }
          .custom-datepicker .react-datepicker__day:hover {
            background-color: #e0e7ff !important;
            transform: scale(1.1) !important;
          }
          .custom-datepicker .react-datepicker__day--selected {
            background-color: #4f46e5 !important;
            color: white !important;
            font-weight: 700 !important;
            box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.5) !important;
          }
          .custom-datepicker .react-datepicker__day--keyboard-selected {
            background-color: #c7d2fe !important;
            color: #1e293b !important;
          }
          .custom-datepicker .react-datepicker__day--today {
            font-weight: 700 !important;
            color: #4f46e5 !important;
            border: 2px solid #4f46e5 !important;
          }
          .custom-datepicker .react-datepicker__day--disabled {
            color: #cbd5e1 !important;
            cursor: not-allowed !important;
          }
          .custom-datepicker .react-datepicker__navigation {
            top: 0.75rem !important;
          }
          .custom-datepicker .react-datepicker__navigation-icon::before {
            border-color: #4f46e5 !important;
            border-width: 2px 2px 0 0 !important;
          }
        `}</style>
      </AnimatedModal>
    </>
  );

  const statusColors: Record<string, string> = {
    REQUESTED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
    CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
    NO_SHOW: 'bg-red-50 text-red-700 border-red-200',
  };

  // Siempre retornar la misma estructura, independientemente de si hay citas o no
  const shouldShowEmptyMessage = 
    filteredAppointments.length === 0;

  return (
    <div className="space-y-4">
      {renderFiltersAndModal()}

      {/* Appointments List o mensaje vacío */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => {
            const status = appointment.status || 'REQUESTED';
            return (
              <AppointmentListItem
                key={appointment.id}
                appointment={appointment}
                professional={professional}
                status={status}
                statusColors={statusColors}
                onSelectAppointment={onSelectAppointment}
              />
            );
          })}
        </div>
      ) : shouldShowEmptyMessage ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
          {appointments.length > 0 ? (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-lg font-semibold text-gray-900 mb-1">No hay citas en el rango seleccionado</p>
              <p className="text-sm text-gray-600">Intenta ajustar los filtros de fecha o estado</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">📅</div>
              <p className="text-lg font-semibold text-gray-900 mb-1">{emptyLabel}</p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FiltersSection({
  dateRange,
  onDateRangeChange,
  activeRangeStart,
  activeRangeEnd,
  selectedStatuses,
  onToggleStatus,
  onClearStatuses,
  statusOptions,
  dateError,
}: {
  dateRange: 'week' | 'month' | 'custom';
  onDateRangeChange: (range: 'week' | 'month' | 'custom') => void;
  activeRangeStart: Date;
  activeRangeEnd: Date;
  selectedStatuses: AppointmentStatus[];
  onToggleStatus: (status: AppointmentStatus) => void;
  onClearStatuses: () => void;
  statusOptions: { value: AppointmentStatus; label: string; color: string }[];
  dateError?: string | null;
}) {
  // Mostrar en la tarjeta el rango real usado para filtrar (misma fuente que la lista)
  const displayStart = format(activeRangeStart, 'dd/MM/yyyy', { locale: es });
  const displayEnd = format(activeRangeEnd, 'dd/MM/yyyy', { locale: es });
  
  console.log('FiltersSection render - dateRange:', dateRange);
  
  return (
    <div className="space-y-5">
      {/* Date Range Filter */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-3">Rango de fechas</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              console.log('Week button clicked');
              onDateRangeChange('week');
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              dateRange === 'week'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-300 ring-offset-2 scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 hover:border-indigo-300 hover:scale-105 active:scale-95'
            }`}
            aria-pressed={dateRange === 'week'}
            aria-label="Ver citas de esta semana"
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Semana
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              console.log('Month button clicked, current dateRange:', dateRange);
              onDateRangeChange('month');
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              dateRange === 'month'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-300 ring-offset-2 scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 hover:border-indigo-300 hover:scale-105 active:scale-95'
            }`}
            aria-pressed={dateRange === 'month'}
            aria-label="Ver citas de este mes"
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Mes
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDateRangeChange('custom')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              dateRange === 'custom'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-300 ring-offset-2 scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 hover:border-indigo-300 hover:scale-105 active:scale-95'
            }`}
            aria-pressed={dateRange === 'custom'}
            aria-label="Seleccionar rango personalizado"
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Personalizado
            </span>
          </button>
        </div>
        {dateRange === 'custom' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Rango personalizado activo</p>
                <p className="text-sm font-semibold text-indigo-700">
                  {displayStart} → {displayEnd}
                </p>
                <button
                  type="button"
                  onClick={() => onDateRangeChange('custom')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline mt-1 inline-flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Cambiar fechas
                </button>
              </div>
            </div>
          </div>
        )}
        {dateError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{dateError}</p>
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-bold text-gray-800">Filtrar por estado</label>
          {selectedStatuses.length > 0 && (
            <button
              type="button"
              onClick={onClearStatuses}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
            >
              Limpiar ({selectedStatuses.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const isSelected = selectedStatuses.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggleStatus(option.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all duration-200 ${
                  isSelected
                    ? `${option.color} ring-2 ring-offset-2 ring-indigo-300 shadow-md scale-105`
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AppointmentListItem({
  appointment,
  professional,
  status,
  statusColors,
  onSelectAppointment,
}: {
  appointment: Appointment;
  professional?: Professional;
  status: string;
  statusColors: Record<string, string>;
  onSelectAppointment: (appointment: Appointment) => void;
}) {
  const serviceName = useServiceName(appointment);
  const appointmentDate = new Date(appointment.appointment_date);
  const isToday = appointmentDate.toDateString() === new Date().toDateString();
  const isPast = appointmentDate < new Date() && !isToday;

  const statusLabels: Record<string, string> = {
    REQUESTED: 'Solicitada',
    CONFIRMED: 'Confirmada',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
  };

  return (
    <button
      type="button"
      onClick={() => onSelectAppointment(appointment)}
      className="w-full text-left bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 group"
    >
      <div className="px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Time and Date Section */}
        <div className="flex-shrink-0 flex items-start gap-3">
          <div className={`text-xs sm:text-sm font-bold rounded-lg px-3 py-2.5 min-w-[100px] text-center border-2 ${
            isToday 
              ? 'text-indigo-700 bg-indigo-50 border-indigo-300' 
              : isPast
              ? 'text-gray-600 bg-gray-50 border-gray-300'
              : 'text-indigo-700 bg-indigo-50 border-indigo-200'
          }`}>
            <div className="font-semibold">{appointment.start_time}</div>
            <div className="text-xs font-normal opacity-75">- {appointment.end_time}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className={`text-xs font-semibold px-2 py-1 rounded-md ${
              isToday 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {format(appointmentDate, 'EEE', { locale: es })}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {format(appointmentDate, 'd MMM', { locale: es })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                {appointment.client_name}
              </h3>
              {appointment.client_rut && (
                <p className="text-xs text-gray-500 mt-0.5">RUT: {appointment.client_rut}</p>
              )}
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${statusColors[status] || statusColors.REQUESTED}`}>
              {statusLabels[status] || status}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate font-medium">{serviceName}</span>
            </div>

            {professional && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate">{professional.name}</span>
              </div>
            )}

            {appointment.client_phone && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{appointment.client_phone}</span>
              </div>
            )}

            {appointment.notes && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 line-clamp-2">{appointment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

export default ScheduleList;
