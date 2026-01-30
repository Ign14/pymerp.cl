import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getProperty, getPropertyBookings, updatePropertyBooking } from '../../../services/rentals';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import type { Property, PropertyBooking } from '../../../types';

export default function PropertyBookings() {
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

  const confirmedCount = useMemo(
    () => bookings.filter((b) => (b.status || 'CONFIRMED') === 'CONFIRMED').length,
    [bookings]
  );

  const handleStatusChange = async (bookingId: string, status: string) => {
    try {
      await updatePropertyBooking(bookingId, { status: status as any });
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: status as any } : b)));
    } catch (error) {
      handleError(error);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900">{t('propertiesModule.bookingsFor')} {property?.title}</h1>
              <p className="text-sm text-gray-600">{t('propertiesModule.totalBookings', { count: bookings.length })} · {t('propertiesModule.confirmed')}: {confirmedCount}</p>
            </div>
          </div>
          <Link to="/dashboard/properties" className="text-sm text-blue-600 hover:underline">
            {t('propertiesModule.backToList')}
          </Link>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4">
          {bookings.length === 0 ? (
            <p className="text-sm text-gray-600">{t('propertiesModule.bookingsEmpty')}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.map((bk) => (
                <div key={bk.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{bk.guest_name}</p>
                    <p className="text-sm text-gray-600">{[bk.guest_email, bk.guest_phone].filter(Boolean).join(' · ')}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(bk.check_in as any).toLocaleDateString()} - {new Date(bk.check_out as any).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">{t('propertiesModule.guests')}: {bk.guests || 1}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={bk.status || 'CONFIRMED'}
                      onChange={(e) => handleStatusChange(bk.id, e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-sm"
                    >
                      <option value="PENDING">{t('propertiesModule.status.pending')}</option>
                      <option value="CONFIRMED">{t('propertiesModule.status.confirmed')}</option>
                      <option value="CANCELLED">{t('propertiesModule.status.cancelled')}</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
