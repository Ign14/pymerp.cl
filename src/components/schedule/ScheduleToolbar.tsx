import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Professional } from '../../types';

export type ScheduleMode = 'list' | 'grid';

interface ScheduleToolbarProps {
  date: Date;
  onDateChange: (date: Date) => void;
  mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
  professionals: Professional[];
  selectedProfessionalId: string;
  onProfessionalChange: (professionalId: string) => void;
  isMobile: boolean;
  showGridToggle?: boolean;
  labels: {
    date: string;
    professional: string;
    allProfessionals: string;
    mode: string;
    list: string;
    grid: string;
    viewInGrid?: string;
  };
}

export function ScheduleToolbar({
  date,
  onDateChange,
  mode,
  onModeChange,
  professionals,
  selectedProfessionalId,
  onProfessionalChange,
  isMobile,
  showGridToggle = true,
  labels,
}: ScheduleToolbarProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-indigo-50 via-white to-purple-50/60 backdrop-blur border-b border-indigo-100/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative" ref={calendarRef}>
            <span className="text-sm font-medium text-gray-800">{labels.date}</span>
            <button
              type="button"
              onClick={() => setShowCalendar((prev) => !prev)}
              className="mt-1 inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-white px-4 py-2 text-base font-semibold text-gray-900 shadow-sm hover:border-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={labels.date}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold">
                {format(date, 'dd')}
              </span>
              <span className="text-left">
                <span className="block text-sm text-gray-500 uppercase tracking-wide">
                  {format(date, 'MMM yyyy')}
                </span>
                <span className="block leading-tight">{format(date, 'EEEE')}</span>
              </span>
            </button>

            {showCalendar && (
              <div className="absolute mt-2 w-[280px] rounded-2xl border border-gray-200 bg-white shadow-2xl p-2 z-[100]">
                <DatePicker
                  inline
                  selected={date}
                  onChange={(selected) => {
                    setShowCalendar(false);
                    if (selected) onDateChange(selected as Date);
                  }}
                  calendarClassName="compact-calendar"
                  dayClassName={() => 'text-sm font-semibold'}
                  formatWeekDay={(nameOfDay) => nameOfDay.slice(0, 2)}
                />
              </div>
            )}
          </div>

          <label className="flex flex-col text-sm text-gray-700">
            <span className="font-medium text-gray-800">
              {labels.professional}
              {isMobile && mode === 'list' ? ' *' : ''}
            </span>
            <select
              value={selectedProfessionalId}
              onChange={(event) => onProfessionalChange(event.target.value)}
              className="mt-1 w-full sm:w-auto rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base px-3 py-2 sm:min-w-[180px] max-w-[280px]"
              aria-label={labels.professional}
            >
              {(mode === 'grid' || !isMobile) && (
                <option value="all">{labels.allProfessionals}</option>
              )}
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {showGridToggle && (
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 p-1 w-fit">
            <span className="text-sm font-medium text-gray-700 px-2">
              {labels.mode}
            </span>
            <button
              type="button"
              onClick={() => onModeChange('list')}
              aria-pressed={mode === 'list'}
              aria-label={labels.list}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition min-w-[96px] ${
                mode === 'list'
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-700 hover:text-indigo-600'
              }`}
            >
              {labels.list}
            </button>
            <button
              type="button"
              onClick={() => onModeChange('grid')}
              aria-pressed={mode === 'grid'}
              aria-label={labels.viewInGrid || labels.grid}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition min-w-[96px] ${
                mode === 'grid'
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-700 hover:text-indigo-600'
              }`}
            >
              {labels.grid}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScheduleToolbar;
