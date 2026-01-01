import { format } from 'date-fns';
import { Appointment, AppointmentStatus, Professional } from '../../types';
import { useServiceName } from '../../hooks/useServiceName';

interface AppointmentDetailsContentProps {
  appointment: Appointment;
  professional?: Professional;
  labels: {
    client: string;
    service: string;
    date: string;
    professional: string;
    phone: string;
    email: string;
    status: string;
    changeStatus: string;
    cancel: string;
    viewRecord: string;
    whatsapp: string;
    timeRange: string;
  };
  statusLabels: Record<AppointmentStatus, string>;
  onStatusChange: (status: AppointmentStatus) => void;
  onCancel: () => void;
  onClose: () => void;
  onViewRecord?: () => void;
}

const statusOptions: AppointmentStatus[] = [
  AppointmentStatus.REQUESTED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

const normalizePhone = (phone: string) => phone.replace(/[^0-9]/g, '');

export function AppointmentDetailsContent({
  appointment,
  professional,
  labels,
  statusLabels,
  onStatusChange,
  onCancel,
  onClose,
  onViewRecord,
}: AppointmentDetailsContentProps) {
  const serviceName = useServiceName(appointment);
  const dateLabel = `${format(
    appointment.appointment_date,
    'dd MMM yyyy'
  )} · ${appointment.start_time} - ${appointment.end_time}`;
  const whatsappHref = appointment.client_phone
    ? `https://wa.me/${normalizePhone(appointment.client_phone)}?text=${encodeURIComponent(
        `Hola ${appointment.client_name}, hablo desde Pymerp acerca de tu cita.`
      )}`
    : undefined;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">
            {labels.client}
          </p>
          <h2 className="text-xl font-bold text-gray-900">{appointment.client_name}</h2>
          <p className="text-sm text-gray-600 mt-1">{serviceName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 rounded-full p-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label={labels.date} value={dateLabel} />
        <InfoRow label={labels.professional} value={professional?.name || '-'} />
        <InfoRow label={labels.phone} value={appointment.client_phone || '-'} />
        <InfoRow label={labels.email} value={appointment.client_email || '-'} />
        <InfoRow
          label={labels.status}
          value={statusLabels[appointment.status] || appointment.status}
        />
        <InfoRow label={labels.timeRange} value={`${appointment.start_time} - ${appointment.end_time}`} />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-gray-800">{labels.changeStatus}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusOptions.map((status) => {
            const isSelected = appointment.status === status;
            
            // Colores específicos para cada estado
            const statusStyles: Record<AppointmentStatus, string> = {
              [AppointmentStatus.REQUESTED]: isSelected
                ? 'bg-yellow-500 text-white border-yellow-600 shadow-lg shadow-yellow-200 ring-2 ring-yellow-300'
                : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400',
              [AppointmentStatus.CONFIRMED]: isSelected
                ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-200 ring-2 ring-green-300'
                : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400',
              [AppointmentStatus.CANCELLED]: isSelected
                ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-200 ring-2 ring-red-300'
                : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400',
              [AppointmentStatus.COMPLETED]: isSelected
                ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-200 ring-2 ring-blue-300'
                : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400',
              [AppointmentStatus.NO_SHOW]: isSelected
                ? 'bg-gray-500 text-white border-gray-600 shadow-lg shadow-gray-200 ring-2 ring-gray-300'
                : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400',
            };

            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold min-h-[44px] transition-all duration-200 ${
                  statusStyles[status]
                } ${isSelected ? 'scale-105 font-bold' : 'scale-100'}`}
                aria-pressed={isSelected}
              >
                {statusLabels[status] || status}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-semibold min-h-[44px]"
        >
          {labels.cancel}
        </button>
        <button
          type="button"
          onClick={onViewRecord}
          disabled={!appointment.client_name}
          className="px-4 py-3 rounded-xl border border-gray-200 text-gray-800 bg-gray-50 hover:bg-gray-100 font-semibold min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          title={!appointment.client_name ? 'Nombre requerido para ver la ficha' : ''}
        >
          {labels.viewRecord}
        </button>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-3 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold text-center min-h-[44px]"
          >
            {labels.whatsapp}
          </a>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p className="text-sm text-gray-900 mt-1 truncate">{value}</p>
    </div>
  );
}

export default AppointmentDetailsContent;
