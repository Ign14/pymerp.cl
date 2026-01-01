import { Appointment } from '../../types';
import AppointmentCard from './AppointmentCard';
import LoadingSpinner from '../animations/LoadingSpinner';

interface PendingListProps {
  appointments: Appointment[];
  services: Array<{ id: string; name: string }>;
  professionals: Array<{ id: string; name: string }>;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  loading?: boolean;
}

export default function PendingList({
  appointments,
  services,
  professionals,
  onConfirm,
  onCancel,
  loading = false,
}: PendingListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">✅ No hay citas pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => {
        const service = services.find((s) => s.id === appointment.service_id);
        const professional = professionals.find((p) => p.id === appointment.professional_id);
        
        return (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            serviceName={service?.name}
            professionalName={professional?.name}
            onConfirm={onConfirm}
            onCancel={onCancel}
            showActions={true}
          />
        );
      })}
    </div>
  );
}

