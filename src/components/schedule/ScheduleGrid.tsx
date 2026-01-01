import { useMemo } from 'react';
import { Appointment, Professional } from '../../types';
import AppointmentBlock from './AppointmentBlock';
import ProfessionalHeaderRow from './ProfessionalHeaderRow';
import TimeColumn from './TimeColumn';

interface UnavailableSlot {
  start: string;
  end: string;
}

interface ScheduleGridProps {
  appointments: Appointment[];
  professionals: Professional[];
  selectedProfessionalId: string;
  onSelectAppointment: (appointment: Appointment) => void;
  timeSlots: string[];
  slotHeight: number;
  dayStartMinutes: number;
  slotIntervalMinutes: number;
  labels: {
    hours: string;
    unavailable: (range: string) => string;
  };
  unavailableSlots?: Record<string, UnavailableSlot[]>;
}

const parseMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export function ScheduleGrid({
  appointments,
  professionals,
  selectedProfessionalId,
  onSelectAppointment,
  timeSlots,
  slotHeight,
  dayStartMinutes,
  slotIntervalMinutes,
  labels,
  unavailableSlots = {},
}: ScheduleGridProps) {
  const visibleProfessionals = useMemo(() => {
    if (selectedProfessionalId === 'all') return professionals;
    return professionals.filter((pro) => pro.id === selectedProfessionalId);
  }, [professionals, selectedProfessionalId]);

  const appointmentsByProfessional = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    visibleProfessionals.forEach((pro) => {
      grouped[pro.id] = appointments.filter(
        (appt) => appt.professional_id === pro.id
      );
    });
    return grouped;
  }, [appointments, visibleProfessionals]);

  const totalHeight = timeSlots.length * slotHeight;

  const getPosition = (start: string, end: string) => {
    const startMinutes = Math.max(parseMinutes(start) - dayStartMinutes, 0);
    const endMinutes = Math.max(parseMinutes(end) - dayStartMinutes, 0);
    const duration = Math.max(endMinutes - startMinutes, slotIntervalMinutes);
    const top = (startMinutes / slotIntervalMinutes) * slotHeight;
    const height = (duration / slotIntervalMinutes) * slotHeight;
    return { top, height };
  };

  // TODO: Virtualize rows/blocks if the agenda grows to many hours to keep scroll smooth.
  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-md overflow-hidden">
      <div className="grid grid-cols-[80px,1fr] bg-gray-50">
        <div className="bg-white border-r border-gray-200 px-3 py-3 text-xs font-semibold text-gray-700 sticky top-0 z-10 bg-gray-50">
          {labels.hours}
        </div>
        <div className="overflow-x-auto bg-gray-50">
          <div className="min-w-[640px]">
            <div className="relative z-10">
              <ProfessionalHeaderRow professionals={visibleProfessionals} selectedProfessionalId={selectedProfessionalId === 'all' ? undefined : selectedProfessionalId} />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white">
        <div className="min-w-[640px]">
          <div className="relative h-[70vh] max-h-[800px] overflow-y-auto">
            <div
              className="grid grid-cols-[80px,1fr] relative"
              style={{ minHeight: totalHeight }}
            >
              <TimeColumn timeSlots={timeSlots} slotHeight={slotHeight} />

              <div className="relative bg-white" style={{ minHeight: totalHeight }}>
                <GridLines
                  timeSlots={timeSlots}
                  slotHeight={slotHeight}
                  totalHeight={totalHeight}
                />

                <div className="relative flex" style={{ minHeight: totalHeight }}>
                  {visibleProfessionals.map((professional) => (
                    <div
                      key={professional.id}
                      className="relative min-w-[220px] border-r border-gray-100 last:border-r-0 bg-white"
                      style={{ minHeight: totalHeight }}
                    >
                      {(unavailableSlots[professional.id] || []).map((slot) => {
                        const { top, height } = getPosition(slot.start, slot.end);
                        return (
                          <UnavailableBlock
                            key={`${slot.start}-${slot.end}`}
                            top={top}
                            height={height}
                            label={labels.unavailable(`${slot.start} - ${slot.end}`)}
                          />
                        );
                      })}

                      {(appointmentsByProfessional[professional.id] || []).map(
                        (appointment) => {
                          const { top, height } = getPosition(
                            appointment.start_time,
                            appointment.end_time
                          );
                          const timeLabel = `${appointment.start_time} - ${appointment.end_time}`;
                          return (
                            <AppointmentBlock
                              key={appointment.id}
                              appointment={appointment}
                              professional={professional}
                              top={top}
                              height={height}
                              onSelect={onSelectAppointment}
                              timeLabel={timeLabel}
                            />
                          );
                        }
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GridLines({
  timeSlots,
  slotHeight,
  totalHeight,
}: {
  timeSlots: string[];
  slotHeight: number;
  totalHeight: number;
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ minHeight: totalHeight }}
    >
      {timeSlots.map((time, index) => (
        <div
          key={time}
          className="absolute left-0 right-0 border-b border-dashed border-gray-200"
          style={{ 
            top: index * slotHeight, 
            height: slotHeight,
            borderColor: index % 2 === 0 ? '#e5e7eb' : '#f3f4f6',
            borderWidth: index % 2 === 0 ? '1px' : '0.5px',
          }}
        />
      ))}
    </div>
  );
}

function UnavailableBlock({
  top,
  height,
  label,
}: {
  top: number;
  height: number;
  label: string;
}) {
  return (
    <div
      className="absolute left-2 right-2 rounded-lg border border-gray-300 text-gray-700 text-xs px-3 py-2 flex items-center shadow-inner"
      style={{
        top,
        height,
        backgroundImage:
          'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 12px, #e5e7eb 12px, #e5e7eb 24px)',
      }}
    >
      {label}
    </div>
  );
}

export default ScheduleGrid;
