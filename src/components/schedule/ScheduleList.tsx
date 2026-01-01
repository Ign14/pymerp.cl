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
  const [customStartDate, setCustomStartDate] = useState<string>(() =>
    format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(() =>
    format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
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
          
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return { start: startDate, end: endDate };
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

    setCustomStartDate(format(tempStartDate, 'yyyy-MM-dd'));
    setCustomEndDate(format(tempEndDate, 'yyyy-MM-dd'));
    setDateError(null);
    setShowCustomDateModal(false);
    // Asegurar que el rango esté en 'custom' después de aplicar fechas personalizadas
    setDateRange('custom');
    // Notificar cambio inmediatamente
    if (onDateRangeChangeRef.current) {
      tempStartDate.setHours(0, 0, 0, 0);
      tempEndDate.setHours(23, 59, 59, 999);
      onDateRangeChangeRef.current(tempStartDate, tempEndDate);
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
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          selectedStatuses={selectedStatuses}
          onToggleStatus={toggleStatus}
          onClearStatuses={() => setSelectedStatuses([])}
          statusOptions={statusOptions}
          dateError={dateError}
        />
      </div>

      {/* Modal para selección de fechas personalizadas */}
      <AnimatedModal
        isOpen={showCustomDateModal}
        onClose={handleCancelCustomDates}
        ariaLabel="Seleccionar rango de fechas personalizado"
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Seleccionar Rango de Fechas
            </h2>
            <button
              onClick={handleCancelCustomDates}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Fecha de inicio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Fecha de inicio
              </label>
              <DatePicker
                selected={tempStartDate}
                onChange={(date: Date | null) => setTempStartDate(date)}
                dateFormat="dd/MM/yyyy"
                locale="es"
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white"
                maxDate={tempEndDate || undefined}
                placeholderText="dd/mm/aaaa"
              />
            </div>

            {/* Fecha de fin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Fecha de fin
              </label>
              <DatePicker
                selected={tempEndDate}
                onChange={(date: Date | null) => setTempEndDate(date)}
                dateFormat="dd/MM/yyyy"
                locale="es"
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white"
                minDate={tempStartDate || undefined}
                placeholderText="dd/mm/aaaa"
              />
            </div>

            {/* Mensaje de error */}
            {dateError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {dateError}
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCancelCustomDates}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCustomDates}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
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
  customStartDate,
  customEndDate,
  selectedStatuses,
  onToggleStatus,
  onClearStatuses,
  statusOptions,
  dateError,
}: {
  dateRange: 'week' | 'month' | 'custom';
  onDateRangeChange: (range: 'week' | 'month' | 'custom') => void;
  customStartDate: string;
  customEndDate: string;
  selectedStatuses: AppointmentStatus[];
  onToggleStatus: (status: AppointmentStatus) => void;
  onClearStatuses: () => void;
  statusOptions: { value: AppointmentStatus; label: string; color: string }[];
  dateError?: string | null;
}) {
  // Formatear fechas para mostrar en el botón personalizado
  const formatDateForDisplay = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy', { locale: es });
      }
    } catch {
      // Ignorar errores
    }
    return dateString;
  };
  
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
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              <span className="font-semibold">Rango seleccionado:</span>{' '}
              {formatDateForDisplay(customStartDate)} - {formatDateForDisplay(customEndDate)}
            </p>
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
