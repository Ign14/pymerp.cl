import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Appointment, AppointmentStatus, Professional } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  listenAppointmentsByRange, 
  updateAppointment,
  confirmAppointmentWithNotifications,
  cancelAppointmentWithNotifications,
} from '../../services/appointments';
import { listenProfessionals } from '../../services/professionals';
import { getNotificationSettings } from '../../services/notifications';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getServiceNameFromAppointment } from '../../utils/serviceHelpers';
import LogoutCorner from '../../components/LogoutCorner';
import ScheduleToolbar, { ScheduleMode } from '../../components/schedule/ScheduleToolbar';
import ScheduleGrid from '../../components/schedule/ScheduleGrid';
import AppointmentDetailsSheet from '../../components/schedule/AppointmentDetailsSheet';
import AppointmentDetailsModal from '../../components/schedule/AppointmentDetailsModal';
import ScheduleList from '../../components/schedule/ScheduleList';
import PatientRecordModal from '../../components/schedule/PatientRecordModal';
import LoadingSpinner from '../../components/animations/LoadingSpinner';

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 20;
const SLOT_INTERVAL_MINUTES = 30;
const SLOT_HEIGHT = 56;

const normalizePhone = (phone?: string | null) => (phone || '').replace(/[^0-9]/g, '');

const parseDateTimeRange = (appointment: Appointment) => {
  const base = new Date(appointment.appointment_date);
  const [startHour = 9, startMinute = 0] = (appointment.start_time || '09:00')
    .split(':')
    .map((v) => Number(v));
  const [endHour = startHour, endMinute = startMinute] = (appointment.end_time || appointment.start_time || '09:30')
    .split(':')
    .map((v) => Number(v));

  const start = new Date(base);
  start.setHours(startHour, startMinute, 0, 0);
  const end = new Date(base);
  end.setHours(endHour, endMinute, 0, 0);
  return { start, end };
};

const formatCalendarDate = (date: Date) =>
  date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const buildCalendarLink = async (appointment: Appointment) => {
  const { start, end } = parseDateTimeRange(appointment);
  const title = `Cita con ${appointment.client_name}`;
  const service = await getServiceNameFromAppointment(appointment);
  const details = `Servicio: ${service}\nCliente: ${appointment.client_name}\nTeléfono: ${appointment.client_phone || ''}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${formatCalendarDate(start)}/${formatCalendarDate(end)}&details=${encodeURIComponent(
    details
  )}`;
};

const buildWhatsAppUrl = async (appointment: Appointment, action: 'confirm' | 'cancel') => {
  if (!appointment.client_phone) return null;
  const phone = normalizePhone(appointment.client_phone);
  const { start } = parseDateTimeRange(appointment);
  const service = await getServiceNameFromAppointment(appointment);
  const dateLabel = start.toLocaleString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const intro =
    action === 'confirm'
      ? 'Tu cita ha sido confirmada'
      : 'Tu cita ha sido cancelada';
  const message = `${intro} para ${service} el ${dateLabel}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(
    `Hola ${appointment.client_name}, ${message}`
  )}`;
};

function generateTimeSlots(startHour: number, endHour: number, interval: number) {
  const slots: string[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  for (let minute = startMinutes; minute <= endMinutes; minute += interval) {
    const hours = Math.floor(minute / 60);
    const mins = minute % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  return slots;
}

const useScheduleBreakpoints = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const update = () => {
      setIsMobile(mobileQuery.matches);
      setIsDesktop(desktopQuery.matches);
    };

    update();
    mobileQuery.addEventListener('change', update);
    desktopQuery.addEventListener('change', update);

    return () => {
      mobileQuery.removeEventListener('change', update);
      desktopQuery.removeEventListener('change', update);
    };
  }, []);

  const isTablet = !isMobile && !isDesktop;

  return { isMobile, isTablet, isDesktop };
};

export default function SchedulePage() {
  const { t } = useTranslation(['schedule', 'appointments']);
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const { handleError, handleAsyncError } = useErrorHandler();
  const { trackEvent } = useAnalytics();
  const { isMobile, isTablet, isDesktop } = useScheduleBreakpoints();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Inicializar modo según el tamaño de pantalla, pero permitir cambios manuales
  const [mode, setMode] = useState<ScheduleMode>(() => {
    // Solo establecer el modo inicial basado en el tamaño de pantalla
    // El usuario podrá cambiarlo manualmente después
    if (typeof window !== 'undefined') {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      return isMobile ? 'list' : 'grid';
    }
    return 'list';
  });
  const [modeInitialized, setModeInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showPatientRecord, setShowPatientRecord] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [notificationEmail, setNotificationEmail] = useState<string | null>(null);
  const [dateRangeStart, setDateRangeStart] = useState<Date>(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });
  const [dateRangeEnd, setDateRangeEnd] = useState<Date>(() => {
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  });

  const dayStart = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedDate]);

  const dayEnd = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [selectedDate]);

  const timeSlots = useMemo(
    () => generateTimeSlots(DAY_START_HOUR, DAY_END_HOUR, SLOT_INTERVAL_MINUTES),
    []
  );

  useEffect(() => {
    trackEvent('view_schedule', {
      date: dayStart.toISOString(),
    });
  }, [dayStart, trackEvent]);

  // Solo establecer modo por defecto una vez al cargar, no forzar cambios posteriores
  useEffect(() => {
    // Solo establecer el modo inicial una vez, luego permitir cambios manuales
    if (!modeInitialized) {
      if (isDesktop || isTablet) {
        setMode('grid');
        setSelectedProfessionalId((prev) => (prev === '' ? 'all' : prev));
      } else if (isMobile) {
        setMode('list');
        setSelectedProfessionalId((prev) => (prev === '' ? (professionals[0]?.id || 'all') : prev));
      }
      setModeInitialized(true);
    } else {
      // Una vez inicializado, solo ajustar selectedProfessionalId según el modo actual
      if (selectedProfessionalId === '' || !selectedProfessionalId) {
        if (mode === 'grid' || (isDesktop || isTablet)) {
          setSelectedProfessionalId('all');
        } else if (isMobile && mode === 'list' && professionals.length > 0) {
          setSelectedProfessionalId(professionals[0]?.id || 'all');
        }
      }
    }
  }, [isDesktop, isTablet, isMobile, mode, professionals, modeInitialized, selectedProfessionalId]);

  useEffect(() => {
    if (!firestoreUser?.company_id) return;

    try {
      const unsubscribeProfessionals = listenProfessionals(
        firestoreUser.company_id,
        (data) => {
          setProfessionals(data);
          if (data.length > 0) {
            setSelectedProfessionalId((prev) => {
              // En móviles, permitir 'all' si el modo es 'grid'
              if (isMobile && mode === 'grid') {
                if (!prev || prev === '') return 'all';
                return prev;
              }
              if (isMobile) return prev || data[0].id;
              if (!prev || prev === '') return 'all';
              return prev;
            });
          }
        }
      );

      return () => unsubscribeProfessionals();
    } catch (error: any) {
      handleError(error);
    }
  }, [firestoreUser?.company_id, isMobile, mode, handleError]);

  useEffect(() => {
    if (!firestoreUser?.id || !firestoreUser?.company_id) return;
    (async () => {
      try {
        const settings = await getNotificationSettings(firestoreUser.id, firestoreUser.company_id!);
        if (!settings) {
          setNotificationsEnabled(null);
          setNotificationEmail(firestoreUser.email || null);
          return;
        }
        setNotificationsEnabled(settings.email_notifications_enabled ?? false);
        setNotificationEmail(settings.notification_email || firestoreUser.email || null);
      } catch (error: any) {
        handleError(error);
      }
    })();
  }, [firestoreUser?.id, firestoreUser?.company_id, firestoreUser?.email, handleError]);

  useEffect(() => {
    if (!firestoreUser?.company_id) return;
    // En móviles, solo requerir selectedProfessionalId si está en modo 'list'
    // En modo 'grid', permitir 'all' incluso en móviles
    if (isMobile && mode === 'list' && !selectedProfessionalId) return;

    setLoading(true);

    const filters =
      selectedProfessionalId !== 'all'
        ? { professionalId: selectedProfessionalId }
        : undefined;

    // Use dateRangeStart/End for list mode, dayStart/dayEnd for grid mode
    const startDate = mode === 'list' ? dateRangeStart : dayStart;
    const endDate = mode === 'list' ? dateRangeEnd : dayEnd;

    const unsubscribe = listenAppointmentsByRange(
      firestoreUser.company_id,
      startDate,
      endDate,
      (data: Appointment[]) => {
        setAppointments(data);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [firestoreUser?.company_id, dayStart, dayEnd, dateRangeStart, dateRangeEnd, selectedProfessionalId, isMobile, mode]);

  const handleOpenDetails = useCallback(
    (appointment: Appointment) => {
      setSelectedAppointment(appointment);
      setShowDetails(true);
      trackEvent('open_appointment_details', {
        appointment_id: appointment.id,
        professional_id: appointment.professional_id,
      });
    },
    [trackEvent]
  );

  // Memoizar el callback para evitar que ScheduleList se remonte
  const handleDateRangeChange = useCallback((start: Date, end: Date) => {
    setDateRangeStart(start);
    setDateRangeEnd(end);
  }, []);

  const filteredAppointments = useMemo(() => {
    const base =
      selectedProfessionalId === 'all'
        ? appointments
        : appointments.filter((appt) => appt.professional_id === selectedProfessionalId);
    return [...base].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [appointments, selectedProfessionalId]);

  const selectedProfessional = professionals.find(
    (pro) => pro.id === selectedProfessionalId
  );

  const unavailableSlots = useMemo(() => {
    const map: Record<string, { start: string; end: string }[]> = {};
    // TODO: Replace mock with availability_exceptions or weekly rules
    professionals.forEach((pro, index) => {
      map[pro.id] = index % 2 === 0 ? [{ start: '13:00', end: '14:00' }] : [];
    });
    return map;
  }, [professionals]);

  const statusLabels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.REQUESTED]: t('appointments:status.requested'),
    [AppointmentStatus.CONFIRMED]: t('appointments:status.confirmed'),
    [AppointmentStatus.CANCELLED]: t('appointments:status.cancelled'),
    [AppointmentStatus.COMPLETED]: t('appointments:status.completed'),
    [AppointmentStatus.NO_SHOW]: t('appointments:status.noShow'),
  };

  const showStatusToast = useCallback(
    async (appointment: Appointment, action: 'confirm' | 'cancel' | 'complete') => {
      const { start } = parseDateTimeRange(appointment);
      const whatsappUrl = action !== 'complete' ? await buildWhatsAppUrl(appointment, action) : null;
      const calendarLink = action === 'confirm' ? await buildCalendarLink(appointment) : null;
      
      const titles: Record<'confirm' | 'cancel' | 'complete', string> = {
        confirm: '✅ Cita confirmada',
        cancel: '❌ Cita cancelada',
        complete: '✅ Cita completada',
      };
      
      const icons: Record<'confirm' | 'cancel' | 'complete', string> = {
        confirm: '✅',
        cancel: '❌',
        complete: '✅',
      };
      
      const colors: Record<'confirm' | 'cancel' | 'complete', { bg: string; text: string; border: string }> = {
        confirm: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        cancel: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        complete: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      };
      
      const title = titles[action];
      const subtitle = `${appointment.client_name} · ${start.toLocaleString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      const colorScheme = colors[action];

      toast.custom(
        (t) => (
          <div
            className={`max-w-md w-full ${colorScheme.bg} border ${colorScheme.border} shadow-xl rounded-xl p-4 space-y-3 ${t.visible ? 'animate-enter' : 'animate-leave'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{icons[action]}</span>
                <div>
                  <p className={`text-sm ${colorScheme.text} font-semibold uppercase tracking-wide`}>{title}</p>
                  <p className={`text-base font-semibold ${colorScheme.text} mt-1`}>{subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className={`${colorScheme.text} hover:opacity-70 transition-opacity`}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            {(whatsappUrl || calendarLink) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    Enviar WhatsApp
                  </a>
                )}
                {calendarLink && (
                  <a
                    href={calendarLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    Agregar a calendario
                  </a>
                )}
              </div>
            )}
          </div>
        ),
        { duration: 6000 }
      );
    },
    []
  );

  const handleStatusChange = useCallback(
    async (status: AppointmentStatus) => {
      if (!selectedAppointment) return;
      const appointmentSnapshot = selectedAppointment;
      await handleAsyncError(async () => {
        // Use enhanced functions for confirm/cancel
        if (status === AppointmentStatus.CONFIRMED) {
          await confirmAppointmentWithNotifications(selectedAppointment.id);
          showStatusToast(appointmentSnapshot, 'confirm');
        } else if (status === AppointmentStatus.CANCELLED) {
          await cancelAppointmentWithNotifications(selectedAppointment.id);
          showStatusToast(appointmentSnapshot, 'cancel');
        } else if (status === AppointmentStatus.COMPLETED) {
          await updateAppointment(selectedAppointment.id, { status });
          showStatusToast(appointmentSnapshot, 'complete');
        } else {
          await updateAppointment(selectedAppointment.id, { status });
        }
        trackEvent('change_appointment_status', {
          appointment_id: selectedAppointment.id,
          status,
        });
      });
    },
    [selectedAppointment, handleAsyncError, trackEvent, showStatusToast]
  );

  const handleCancel = useCallback(async () => {
    if (!selectedAppointment) return;
    if (!confirm('¿Estás seguro de cancelar esta cita? Se enviará una notificación al cliente.')) return;
    await handleStatusChange(AppointmentStatus.CANCELLED);
  }, [selectedAppointment, handleStatusChange]);

  const showGrid = mode === 'grid';
  const showList = mode === 'list';

  if (!firestoreUser?.company_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No company selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 relative">
      <LogoutCorner />
      <ScheduleToolbar
        date={selectedDate}
        onDateChange={setSelectedDate}
        mode={mode}
        onModeChange={setMode}
        professionals={professionals}
        selectedProfessionalId={selectedProfessionalId}
        onProfessionalChange={setSelectedProfessionalId}
        isMobile={isMobile}
        showGridToggle
        labels={{
          date: t('schedule:toolbar.date'),
          professional: t('schedule:toolbar.professional'),
          allProfessionals: t('schedule:toolbar.allProfessionals'),
          mode: t('schedule:toolbar.mode'),
          list: t('schedule:toolbar.list'),
          grid: t('schedule:toolbar.grid'),
          viewInGrid: t('schedule:toolbar.viewInGrid'),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Header mejorado con botón de volver */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                aria-label="Volver al dashboard"
                title="Volver al dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {t('schedule:title')}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{t('schedule:subtitle')}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium">
                {t('appointments:status.requested')}
              </span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                {t('appointments:status.confirmed')}
              </span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                {t('appointments:status.completed')}
              </span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                {t('appointments:status.cancelled')}
              </span>
            </div>
          </div>
        </div>

        {notificationsEnabled === false && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold">Activa las notificaciones por correo</p>
              <p className="text-sm">
                El dueño de la URL debe activar las notificaciones en{' '}
                <span className="font-semibold">https://www.pymerp.cl/dashboard/settings/notifications</span>{' '}
                para recibir los correos de “cita solicitada/confirmada/cancelada”.
              </p>
              {notificationEmail && (
                <p className="text-xs text-amber-800">Email configurado: {notificationEmail}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/settings/notifications')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
            >
              Ir a notificaciones
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!loading && (
          <>
            {showList && (
              <ScheduleList
                key="schedule-list" // Key estable para preservar el estado
                appointments={appointments}
                professional={selectedProfessional}
                onSelectAppointment={handleOpenDetails}
                emptyLabel={t('schedule:empty.title')}
                selectedDate={selectedDate}
                onDateRangeChange={handleDateRangeChange}
              />
            )}

            {showGrid && (
              <>
                {filteredAppointments.length === 0 && (
                  <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-lg font-semibold text-gray-900">
                      {t('schedule:empty.title')}
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                      {t('schedule:empty.description')}
                    </p>
                    <button
                      type="button"
                      className="inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 min-h-[44px] transition-all"
                      onClick={() => navigate('/dashboard/appointments/new')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('schedule:empty.cta')}
                    </button>
                  </div>
                )}

                {filteredAppointments.length > 0 && (
                  <ScheduleGrid
                    appointments={appointments}
                    professionals={professionals}
                    selectedProfessionalId={selectedProfessionalId}
                    onSelectAppointment={handleOpenDetails}
                    timeSlots={timeSlots}
                    slotHeight={SLOT_HEIGHT}
                    dayStartMinutes={DAY_START_HOUR * 60}
                    slotIntervalMinutes={SLOT_INTERVAL_MINUTES}
                    unavailableSlots={unavailableSlots}
                    labels={{
                      hours: t('schedule:labels.hours'),
                      unavailable: (range: string) =>
                        t('schedule:labels.unavailable', { range }),
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      <AppointmentDetailsSheet
        isOpen={showDetails && isMobile}
        appointment={selectedAppointment}
        professional={
          selectedAppointment
            ? professionals.find((pro) => pro.id === selectedAppointment.professional_id)
            : undefined
        }
        onClose={() => setShowDetails(false)}
        onStatusChange={handleStatusChange}
        onCancel={handleCancel}
        onViewRecord={() => {
          setShowDetails(false);
          setShowPatientRecord(true);
        }}
        labels={{
          client: t('schedule:details.client'),
          service: t('schedule:details.service'),
          date: t('schedule:details.date'),
          professional: t('schedule:details.professional'),
          phone: t('schedule:details.phone'),
          email: t('schedule:details.email'),
          status: t('schedule:details.status'),
          changeStatus: t('schedule:details.changeStatus'),
          cancel: t('schedule:details.cancel'),
          viewRecord: t('schedule:details.viewRecord'),
          whatsapp: t('schedule:details.whatsapp'),
          timeRange: t('schedule:details.timeRange'),
        }}
        statusLabels={statusLabels}
      />

      <AppointmentDetailsModal
        isOpen={showDetails && !isMobile}
        appointment={selectedAppointment}
        professional={
          selectedAppointment
            ? professionals.find((pro) => pro.id === selectedAppointment.professional_id)
            : undefined
        }
        onClose={() => setShowDetails(false)}
        onStatusChange={handleStatusChange}
        onCancel={handleCancel}
        onViewRecord={() => {
          setShowDetails(false);
          setShowPatientRecord(true);
        }}
        labels={{
          client: t('schedule:details.client'),
          service: t('schedule:details.service'),
          date: t('schedule:details.date'),
          professional: t('schedule:details.professional'),
          phone: t('schedule:details.phone'),
          email: t('schedule:details.email'),
          status: t('schedule:details.status'),
          changeStatus: t('schedule:details.changeStatus'),
          cancel: t('schedule:details.cancel'),
          viewRecord: t('schedule:details.viewRecord'),
          whatsapp: t('schedule:details.whatsapp'),
          timeRange: t('schedule:details.timeRange'),
        }}
        statusLabels={statusLabels}
      />

      <PatientRecordModal
        isOpen={showPatientRecord}
        appointment={selectedAppointment}
        companyId={firestoreUser.company_id || ''}
        onClose={() => setShowPatientRecord(false)}
      />
    </div>
  );
}
