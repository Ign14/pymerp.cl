import { Appointment, AppointmentStatus, Professional } from '../../types';
import { useServiceName } from '../../hooks/useServiceName';

const statusStyles: Record<
  AppointmentStatus,
  { bg: string; border: string; accent: string; text: string }
> = {
  [AppointmentStatus.REQUESTED]: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    accent: 'bg-yellow-500',
    text: 'text-yellow-900',
  },
  [AppointmentStatus.CONFIRMED]: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    accent: 'bg-green-600',
    text: 'text-green-900',
  },
  [AppointmentStatus.COMPLETED]: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    accent: 'bg-blue-600',
    text: 'text-blue-900',
  },
  [AppointmentStatus.CANCELLED]: {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    accent: 'bg-gray-500',
    text: 'text-gray-800',
  },
  [AppointmentStatus.NO_SHOW]: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    accent: 'bg-orange-600',
    text: 'text-orange-900',
  },
};

interface AppointmentBlockProps {
  appointment: Appointment;
  professional?: Professional;
  top: number;
  height: number;
  onSelect: (appointment: Appointment) => void;
  timeLabel: string;
}

export function AppointmentBlock({
  appointment,
  professional,
  top,
  height,
  onSelect,
  timeLabel,
}: AppointmentBlockProps) {
  const styles = statusStyles[appointment.status] || statusStyles[AppointmentStatus.CONFIRMED];
  const serviceName = useServiceName(appointment);

  return (
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      className={`absolute left-2 right-2 rounded-xl border-2 shadow-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden cursor-pointer ${styles.bg} ${styles.border}`}
      style={{ top, height, minHeight: '60px' }}
      aria-label={`${appointment.client_name} ${timeLabel}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${styles.accent} shadow-sm`} />
      <div className="px-3 py-2 h-full flex flex-col justify-between overflow-hidden">
        <div className="space-y-1">
          <p
            className="text-[13px] sm:text-sm font-bold text-gray-900 overflow-hidden break-words leading-tight"
            style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}
          >
            {appointment.client_name}
          </p>
          <p
            className={`text-[12px] sm:text-xs font-medium ${styles.text} overflow-hidden break-words leading-snug`}
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          >
            {serviceName || 'Servicio'}
          </p>
        </div>
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-700 gap-2 min-w-0 leading-tight mt-1">
          <span className="font-semibold truncate flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeLabel}
          </span>
          {professional && (
            <span className="text-gray-500 truncate max-w-[50%] text-right flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {professional.name}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default AppointmentBlock;
