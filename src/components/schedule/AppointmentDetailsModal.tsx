import AnimatedModal from '../animations/AnimatedModal';
import { Appointment, AppointmentStatus, Professional } from '../../types';
import AppointmentDetailsContent from './AppointmentDetailsContent';
import { AppointmentDetailsLabels } from './AppointmentDetailsSheet';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  professional?: Professional;
  onClose: () => void;
  onStatusChange: (status: AppointmentStatus) => void;
  onCancel: () => void;
  onViewRecord?: () => void;
  labels: AppointmentDetailsLabels;
  statusLabels: Record<AppointmentStatus, string>;
}

export function AppointmentDetailsModal({
  isOpen,
  appointment,
  professional,
  onClose,
  onStatusChange,
  onCancel,
  onViewRecord,
  labels,
  statusLabels,
}: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl w-full"
      ariaLabel={labels.client}
    >
      <AppointmentDetailsContent
        appointment={appointment}
        professional={professional}
        labels={labels}
        statusLabels={statusLabels}
        onStatusChange={onStatusChange}
        onCancel={onCancel}
        onClose={onClose}
        onViewRecord={onViewRecord}
      />
    </AnimatedModal>
  );
}

export default AppointmentDetailsModal;
