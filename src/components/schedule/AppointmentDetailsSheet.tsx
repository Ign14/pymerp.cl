import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Appointment, AppointmentStatus, Professional } from '../../types';
import AppointmentDetailsContent from './AppointmentDetailsContent';

interface AppointmentDetailsSheetProps {
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

export interface AppointmentDetailsLabels {
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
}

export function AppointmentDetailsSheet({
  isOpen,
  appointment,
  professional,
  onClose,
  onStatusChange,
  onCancel,
  onViewRecord,
  labels,
  statusLabels,
}: AppointmentDetailsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setTimeout(() => sheetRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && appointment && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
          onClick={onClose}
        >
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="bg-white w-full rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto focus:outline-none"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={labels.client}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-1.5 bg-gray-200 rounded-full mx-auto my-3 max-w-[120px]" />
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AppointmentDetailsSheet;
