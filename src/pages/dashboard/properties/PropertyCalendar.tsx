import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getProperty, getPropertyBookings } from '../../../services/rentals';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import type { Property, PropertyBooking } from '../../../types';
import { formatLocalDate } from '../../../utils/date';

type DayAvailability = {
  date: string;
  status: 'AVAILABLE' | 'PARTIAL' | 'BOOKED';
};

const getDateRange = (start: Date, days: number): Date[] => {
  const arr: Date[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push(d);
  }
  return arr;
};

export default function PropertyCalendar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [property, setProperty] = useState<Property | null>(null);
  const [bookings, setBookings] = useState<PropertyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id || !firestoreUser?.company_id) return;
      try {
        const [prop, res] = await Promise.all([getProperty(id), getPropertyBookings(firestoreUser.company_id, id)]);
        setProperty(prop);
        setBookings(res);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, firestoreUser?.company_id, handleError]);

  const availability: DayAvailability[] = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const range = getDateRange(start, 30);
    return range.map((day) => {
      const dayStr = formatLocalDate(day);
      const overlaps = bookings.filter((b) => {
        const inDate = new Date(b.check_in as any);
        const outDate = new Date(b.check_out as any);
        return day >= inDate && day < outDate; // check-out not included
      });
      let status: DayAvailability['status'] = 'AVAILABLE';
      if (overlaps.some((b) => (b.status || 'CONFIRMED') === 'CONFIRMED')) {
        status = 'BOOKED';
      } else if (overlaps.length > 0) {
        status = 'PARTIAL';
      }
      return { date: dayStr, status };
    });
  }, [bookings]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label={t('common.back')}
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('propertiesModule.calendarFor')} {property?.title}</h1>
              <p className="text-sm text-gray-600">{t('propertiesModule.calendarHint')}</p>
            </div>
          </div>
          <Link to={`/dashboard/properties/${id}/bookings`} className="text-sm text-blue-600 hover:underline">
            {t('propertiesModule.bookings')}
          </Link>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {availability.map((day) => (
            <div key={day.date} className="p-3 rounded border border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">{new Date(day.date).toLocaleDateString()}</p>
              <span
                className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                  day.status === 'BOOKED'
                    ? 'bg-red-100 text-red-700'
                    : day.status === 'PARTIAL'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {t('propertiesModule.statusLabel.' + day.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
