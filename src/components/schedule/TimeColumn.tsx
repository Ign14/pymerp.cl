interface TimeColumnProps {
  timeSlots: string[];
  slotHeight: number;
}

export function TimeColumn({ timeSlots, slotHeight }: TimeColumnProps) {
  return (
    <div className="sticky left-0 top-0 bg-gray-50 border-r border-gray-200 z-10 shadow-sm">
      {timeSlots.map((time) => {
        const isHour = time.endsWith(':00');
        return (
          <div
            key={time}
            className={`flex items-start justify-end pr-3 border-b border-dashed border-gray-200 ${
              isHour ? 'text-sm font-semibold text-gray-700' : 'text-xs text-gray-500'
            }`}
            style={{ height: slotHeight }}
            aria-hidden
          >
            <span className="translate-y-[-6px]">{time}</span>
          </div>
        );
      })}
    </div>
  );
}

export default TimeColumn;
