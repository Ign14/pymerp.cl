import DatePicker from 'react-datepicker';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import AnimatedModal from '../../../components/animations/AnimatedModal';
import { ScheduleSlot } from '../../../types';
import { DAY_NAMES_ES, DAY_OF_WEEK_KEYS } from '../constants';
import { AppearanceTheme, BookingForm } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  theme: AppearanceTheme;
  serviceName?: string;
  availableSchedules: ScheduleSlot[];
  selectedDate: Date | null;
  selectedSchedule: string | null;
  bookingForm: BookingForm;
  onClose: () => void;
  onDateChange: (date: Date | null, matchingScheduleId: string | null) => void;
  onScheduleChange: (scheduleId: string) => void;
  onFormChange: (field: keyof BookingForm, value: string) => void;
  onSubmit: () => void;
}

export function BookingModal({
  isOpen,
  theme,
  serviceName,
  availableSchedules,
  selectedDate,
  selectedSchedule,
  bookingForm,
  onClose,
  onDateChange,
  onScheduleChange,
  onFormChange,
  onSubmit,
}: BookingModalProps) {
  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="p-6"
    >
      <h3 className="text-xl font-bold mb-4">Agendar {serviceName}</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              if (date) {
                const dayKey = DAY_OF_WEEK_KEYS[date.getDay()];
                const matching = availableSchedules.filter((s: ScheduleSlot) => s.days_of_week?.includes(dayKey));
                onDateChange(date, matching[0]?.id || null);
              } else {
                onDateChange(null, null);
              }
            }}
            minDate={new Date()}
            filterDate={(date) => {
              const dayKey = DAY_OF_WEEK_KEYS[date.getDay()];
              return availableSchedules.some((s: ScheduleSlot) => s.days_of_week?.includes(dayKey));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horario *</label>
          <select
            value={selectedSchedule || ''}
            onChange={(e) => onScheduleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Selecciona un horario</option>
            {(selectedDate
              ? availableSchedules.filter((s: ScheduleSlot) =>
                  s.days_of_week?.includes(DAY_OF_WEEK_KEYS[selectedDate.getDay()])
                )
              : availableSchedules
            ).map((schedule: ScheduleSlot) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.days_of_week?.map((d: string) => DAY_NAMES_ES[d]).join(', ')} - {schedule.start_time} a {schedule.end_time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={bookingForm.client_name}
            onChange={(e) => onFormChange('client_name', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
          <input
            type="tel"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={bookingForm.client_whatsapp}
            onChange={(e) => onFormChange('client_whatsapp', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={bookingForm.client_comment}
            onChange={(e) => onFormChange('client_comment', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <AnimatedButton
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Cancelar
        </AnimatedButton>
        <AnimatedButton
          onClick={onSubmit}
          style={{ backgroundColor: theme.buttonColor }}
          className="px-4 py-2 text-white rounded-md hover:opacity-90"
        >
          Enviar por WhatsApp
        </AnimatedButton>
      </div>
    </AnimatedModal>
  );
}
