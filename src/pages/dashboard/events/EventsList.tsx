import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getEvents, deleteEvent, getEventReservations } from '../../../services/events';
import type { Event as EventType, EventReservation } from '../../../types';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import AnimatedCard from '../../../components/animations/AnimatedCard';

const formatDate = (date?: any) => {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString();
};

export default function EventsList() {
  const { firestoreUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();

  const [events, setEvents] = useState<EventType[]>([]);
  const [reservations, setReservations] = useState<Record<string, EventReservation[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!firestoreUser?.company_id) return;
      try {
        const list = await getEvents(firestoreUser.company_id);
        setEvents(list);
        const map: Record<string, EventReservation[]> = {};
        for (const ev of list) {
          const res = await getEventReservations(firestoreUser.company_id, ev.id);
          map[ev.id] = res;
        }
        setReservations(map);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firestoreUser?.company_id, handleError]);

  const getConfirmedCount = (eventId: string) =>
    (reservations[eventId] || []).filter((r) => (r.status || 'CONFIRMED') === 'CONFIRMED').reduce((sum, r) => sum + (r.tickets || 1), 0);

  const handleDelete = async (id: string) => {
    if (!confirm(t('eventsModule.deleteConfirm'))) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success(t('eventsModule.deleted'));
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
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label={t('common.back')}
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{t('eventsModule.title')}</h1>
          </div>
          <Link to="/dashboard/events/new" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {t('eventsModule.new')}
          </Link>
        </div>

        {events.length === 0 && <p className="text-sm text-gray-600">{t('eventsModule.empty')}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev, idx) => {
            const confirmed = getConfirmedCount(ev.id);
            const capacity = ev.capacity ?? null;
            const available = capacity ? Math.max(capacity - confirmed, 0) : null;
            return (
              <AnimatedCard key={ev.id} delay={idx * 0.05} className="bg-white border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{ev.title}</h2>
                    <p className="text-sm text-gray-600">{ev.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      ev.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : ev.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ev.status || 'DRAFT'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{formatDate(ev.start_date)} — {formatDate(ev.end_date)}</p>
                  <p>{ev.location || t('eventsModule.noLocation')}</p>
                  <p>
                    {capacity ? `${t('eventsModule.capacity')}: ${capacity} · ${t('eventsModule.available')}: ${available}` : t('eventsModule.openCapacity')}
                  </p>
                  <p>{t('eventsModule.confirmed')}: {confirmed}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/dashboard/events/${ev.id}`} className="px-3 py-2 rounded bg-blue-50 text-blue-700 text-sm border border-blue-100 hover:bg-blue-100">
                    {t('common.edit')}
                  </Link>
                  <Link to={`/dashboard/events/${ev.id}/reservations`} className="px-3 py-2 rounded bg-indigo-50 text-indigo-700 text-sm border border-indigo-100 hover:bg-indigo-100">
                    {t('eventsModule.reservations')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    className="px-3 py-2 rounded bg-red-50 text-red-700 text-sm border border-red-100 hover:bg-red-100"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
