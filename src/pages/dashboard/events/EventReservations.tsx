import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import {
  createEventReservation,
  getEvent,
  getEventReservations,
  updateEventReservation,
} from '../../../services/events';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { Event as EventType, EventReservation } from '../../../types';

export default function EventReservationsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [eventData, setEventData] = useState<EventType | null>(null);
  const [reservations, setReservations] = useState<EventReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    attendee_name: '',
    attendee_email: '',
    attendee_phone: '',
    tickets: 1,
    status: 'CONFIRMED',
  });

  useEffect(() => {
    const load = async () => {
      if (!id || !firestoreUser?.company_id) return;
      try {
        const [ev, res] = await Promise.all([getEvent(id), getEventReservations(firestoreUser.company_id, id)]);
        setEventData(ev);
        setReservations(res);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, firestoreUser?.company_id, handleError]);

  const confirmedQty = useMemo(
    () => reservations.filter((r) => (r.status || 'CONFIRMED') === 'CONFIRMED').reduce((sum, r) => sum + (r.tickets || 1), 0),
    [reservations]
  );

  const remaining = eventData?.capacity ? Math.max(eventData.capacity - confirmedQty, 0) : null;

  const handleCreate = async () => {
    if (!id || !firestoreUser?.company_id) return;
    if (!form.attendee_name.trim()) {
      toast.error(t('eventsModule.reservationsForm.nameRequired'));
      return;
    }
    if (remaining !== null && form.status === 'CONFIRMED' && form.tickets > remaining) {
      toast.error(t('eventsModule.capacityExceeded'));
      return;
    }
    setSaving(true);
    try {
      await createEventReservation({
        company_id: firestoreUser.company_id,
        event_id: id,
        attendee_name: form.attendee_name.trim(),
        attendee_email: form.attendee_email.trim() || undefined,
        attendee_phone: form.attendee_phone.trim() || undefined,
        tickets: form.tickets,
        status: form.status as any,
        created_at: new Date(),
        updated_at: new Date(),
        id: '',
      } as any);
      const res = await getEventReservations(firestoreUser.company_id, id);
      setReservations(res);
      setForm({ attendee_name: '', attendee_email: '', attendee_phone: '', tickets: 1, status: 'CONFIRMED' });
      toast.success(t('eventsModule.reservationsForm.created'));
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (reservationId: string, status: string) => {
    if (!firestoreUser?.company_id) return;
    const resItem = reservations.find((r) => r.id === reservationId);
    const tickets = resItem?.tickets || 1;
    if (remaining !== null && status === 'CONFIRMED' && tickets > remaining) {
      toast.error(t('eventsModule.capacityExceeded'));
      return;
    }
    try {
      await updateEventReservation(reservationId, { status: status as any });
      setReservations((prev) => prev.map((r) => (r.id === reservationId ? { ...r, status: status as any } : r)));
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
              <h1 className="text-2xl font-bold text-gray-900">{t('eventsModule.reservationsFor')} {eventData?.title}</h1>
              <p className="text-sm text-gray-600">
                {eventData?.capacity ? `${t('eventsModule.capacity')}: ${eventData.capacity} · ${t('eventsModule.available')}: ${remaining}` : t('eventsModule.openCapacity')}
              </p>
            </div>
          </div>
          <Link to="/dashboard/events" className="text-sm text-blue-600 hover:underline">
            {t('eventsModule.backToEvents')}
          </Link>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('eventsModule.addReservation')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.reservationsForm.name')}</label>
              <input
                type="text"
                value={form.attendee_name}
                onChange={(e) => setForm((prev) => ({ ...prev, attendee_name: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.reservationsForm.email')}</label>
              <input
                type="email"
                value={form.attendee_email}
                onChange={(e) => setForm((prev) => ({ ...prev, attendee_email: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.reservationsForm.phone')}</label>
              <input
                type="tel"
                value={form.attendee_phone}
                onChange={(e) => setForm((prev) => ({ ...prev, attendee_phone: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.reservationsForm.tickets')}</label>
              <input
                type="number"
                min="1"
                value={form.tickets}
                onChange={(e) => setForm((prev) => ({ ...prev, tickets: Number(e.target.value) || 1 }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">{t('eventsModule.reservationsForm.status')}</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="border border-gray-200 rounded px-3 py-2"
            >
              <option value="PENDING">{t('eventsModule.status.pending')}</option>
              <option value="CONFIRMED">{t('eventsModule.status.confirmed')}</option>
              <option value="CANCELLED">{t('eventsModule.status.cancelled')}</option>
            </select>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {saving ? t('eventsModule.saving') : t('eventsModule.reservationsForm.create')}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('eventsModule.reservationsList')}</h2>
          {reservations.length === 0 ? (
            <p className="text-sm text-gray-600">{t('eventsModule.reservationsEmpty')}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reservations.map((res) => (
                <div key={res.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{res.attendee_name}</p>
                    <p className="text-sm text-gray-600">{[res.attendee_email, res.attendee_phone].filter(Boolean).join(' · ')}</p>
                    <p className="text-sm text-gray-500">{t('eventsModule.ticketsLabel', { count: res.tickets || 1 })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={res.status || 'CONFIRMED'}
                      onChange={(e) => handleStatusChange(res.id, e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-sm"
                    >
                      <option value="PENDING">{t('eventsModule.status.pending')}</option>
                      <option value="CONFIRMED">{t('eventsModule.status.confirmed')}</option>
                      <option value="CANCELLED">{t('eventsModule.status.cancelled')}</option>
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
