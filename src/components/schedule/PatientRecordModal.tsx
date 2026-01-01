import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment, AppointmentStatus } from '../../types';
import { getPatientAppointmentHistory } from '../../services/appointments';
import { useServiceName } from '../../hooks/useServiceName';
import AnimatedModal from '../animations/AnimatedModal';
import LoadingSpinner from '../animations/LoadingSpinner';

interface PatientRecordModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  companyId: string;
  onClose: () => void;
}

const statusColors: Record<AppointmentStatus, string> = {
  [AppointmentStatus.REQUESTED]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  [AppointmentStatus.CONFIRMED]: 'bg-green-50 text-green-700 border-green-200',
  [AppointmentStatus.CANCELLED]: 'bg-red-50 text-red-700 border-red-200',
  [AppointmentStatus.COMPLETED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [AppointmentStatus.NO_SHOW]: 'bg-gray-50 text-gray-700 border-gray-200',
};

const statusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.REQUESTED]: 'Solicitada',
  [AppointmentStatus.CONFIRMED]: 'Confirmada',
  [AppointmentStatus.CANCELLED]: 'Cancelada',
  [AppointmentStatus.COMPLETED]: 'Completada',
  [AppointmentStatus.NO_SHOW]: 'No asistió',
};

export function PatientRecordModal({
  isOpen,
  appointment,
  companyId,
  onClose,
}: PatientRecordModalProps) {
  const [history, setHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !appointment || !appointment.client_name) {
      setHistory([]);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load history by name and RUT (RUT is optional, will search by name if not provided)
        const patientHistory = await getPatientAppointmentHistory(
          companyId,
          appointment.client_name,
          appointment.client_rut
        );
        setHistory(patientHistory);
      } catch (err: any) {
        console.error('Error loading patient history:', err);
        setError('Error al cargar el historial del paciente');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [isOpen, appointment, companyId]);

  if (!appointment) return null;

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      ariaLabel="Ficha del paciente"
    >
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Ficha del Paciente</h2>
            <div className="mt-2 space-y-1">
              <p className="text-lg font-semibold text-gray-800">{appointment.client_name}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {appointment.client_rut && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">RUT:</span>
                    {appointment.client_rut}
                  </span>
                )}
                {appointment.client_phone && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Teléfono:</span>
                    {appointment.client_phone}
                  </span>
                )}
                {appointment.client_email && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Email:</span>
                    {appointment.client_email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded-full p-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-600">
            <p className="text-lg font-semibold mb-2">No hay historial de citas</p>
            <p className="text-sm">Esta es la primera cita registrada para este paciente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Historial Completo de Citas ({history.length})
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Todas las citas registradas para este cliente, incluyendo todos los estados
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = history.filter((apt) => apt.status === status).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={status}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        statusColors[status as AppointmentStatus] || 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {label}: {count}
                    </span>
                  );
                })}
              </div>
            </div>

            {history.map((apt) => {
              const isCurrent = apt.id === appointment.id;
              return <AppointmentHistoryItem key={apt.id} appointment={apt} isCurrent={isCurrent} />;
            })}
          </div>
        )}
      </div>
    </AnimatedModal>
  );
}

function AppointmentHistoryItem({ appointment, isCurrent }: { appointment: Appointment; isCurrent: boolean }) {
  const serviceName = useServiceName(appointment);
              
  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all ${
        isCurrent
          ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-base font-semibold text-gray-900">
              {format(appointment.appointment_date, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })}
            </h4>
            {isCurrent && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                Cita actual
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Horario:</span> {appointment.start_time} - {appointment.end_time}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Servicio:</span> {serviceName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
              statusColors[appointment.status] || statusColors[AppointmentStatus.REQUESTED]
            }`}
          >
            {statusLabels[appointment.status] || appointment.status}
          </span>
        </div>
      </div>
      
      {appointment.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-medium">Notas:</span>
          </p>
          <p className="text-sm text-gray-700">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
}

export default PatientRecordModal;

