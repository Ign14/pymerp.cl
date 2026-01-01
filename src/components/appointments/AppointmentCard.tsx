import { motion } from 'framer-motion';
import { Appointment, AppointmentStatus } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentCardProps {
  appointment: Appointment;
  serviceName?: string;
  professionalName?: string;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onEdit?: (id: string) => void;
  showActions?: boolean;
}

export default function AppointmentCard({
  appointment,
  serviceName,
  professionalName,
  onConfirm,
  onCancel,
  onEdit,
  showActions = true,
}: AppointmentCardProps) {
  const statusColors: Record<AppointmentStatus, string> = {
    [AppointmentStatus.REQUESTED]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [AppointmentStatus.CONFIRMED]: 'bg-green-100 text-green-800 border-green-300',
    [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-300',
    [AppointmentStatus.COMPLETED]: 'bg-blue-100 text-blue-800 border-blue-300',
    [AppointmentStatus.NO_SHOW]: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusLabels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.REQUESTED]: 'Solicitada',
    [AppointmentStatus.CONFIRMED]: 'Confirmada',
    [AppointmentStatus.CANCELLED]: 'Cancelada',
    [AppointmentStatus.COMPLETED]: 'Completada',
    [AppointmentStatus.NO_SHOW]: 'No asistió',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{appointment.client_name}</h3>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">📱 {appointment.client_phone}</p>
            {appointment.client_email && (
              <p className="text-sm text-gray-600">✉️ {appointment.client_email}</p>
            )}
            {appointment.client_rut && (
              <p className="text-sm text-gray-600">🆔 RUT: {appointment.client_rut}</p>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status]}`}>
          {statusLabels[appointment.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-medium text-base">📅</span>
          <span className="font-medium">{format(appointment.appointment_date, "EEEE d 'de' MMMM", { locale: es })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-medium text-base">🕐</span>
          <span className="font-medium">{appointment.start_time} - {appointment.end_time}</span>
        </div>
        {serviceName && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium text-base">💼</span>
            <span>{serviceName}</span>
          </div>
        )}
        {professionalName && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium text-base">👨‍⚕️</span>
            <span className="font-medium text-blue-700">Profesional: {professionalName}</span>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <span className="font-medium text-base">📝</span>
            <div>
              <span className="font-medium">Notas:</span>
              <p className="mt-1">{appointment.notes}</p>
            </div>
          </div>
        </div>
      )}

      {showActions && appointment.status !== AppointmentStatus.CANCELLED && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          {appointment.status === AppointmentStatus.REQUESTED && onConfirm && (
            <button
              type="button"
              onClick={() => onConfirm(appointment.id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
            >
              Confirmar
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(appointment.id)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Editar
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(appointment.id)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

