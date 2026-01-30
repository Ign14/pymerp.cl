import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getCompany } from '../../services/firestore';
import { getEvent, getEventReservations } from '../../services/events';
import { Event as EventType, EventReservation } from '../../types';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { GAEventCategory } from '../../config/analytics';
import { useAnalytics } from '../../hooks/useAnalytics';

export default function PublicEventDetail() {
  const { companyId, eventId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const { trackEvent } = useAnalytics();

  const [eventData, setEventData] = useState<EventType | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [companyWhatsapp, setCompanyWhatsapp] = useState<string>('');
  const [reservations, setReservations] = useState<EventReservation[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !eventId) return;
      try {
        const [company, ev, res] = await Promise.all([
          getCompany(companyId),
          getEvent(eventId),
          getEventReservations(companyId, eventId),
        ]);
        if (!company || !ev || ev.status !== 'PUBLISHED') {
          navigate('/');
          return;
        }
        setCompanyName(company.name);
        setCompanyWhatsapp(company.whatsapp || '');
        setEventData(ev);
        setReservations(res);
        trackEvent('EVENT_VIEW', { category: GAEventCategory.NAVIGATION, company_id: company.id, event_id: ev.id });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, eventId, handleError, navigate, trackEvent]);

  const confirmed = useMemo(
    () => reservations.filter((r) => (r.status || 'CONFIRMED') === 'CONFIRMED').reduce((sum, r) => sum + (r.tickets || 1), 0),
    [reservations]
  );

  const remaining = eventData?.capacity ? Math.max(eventData.capacity - confirmed, 0) : null;

  const handleWhatsapp = () => {
    if (!companyWhatsapp) {
      toast.error(t('menuView.noWhatsapp'));
      return;
    }
    if (remaining !== null && qty > remaining) {
      toast.error(t('eventsModule.capacityExceeded'));
      return;
    }
    const phone = companyWhatsapp.replace(/\D/g, '');
    const lines = [
      `Hola! Quiero reservar para el evento ${eventData?.title}`,
      `Cantidad: ${qty}`,
      eventData?.start_date ? `Fecha: ${new Date(eventData.start_date as any).toLocaleString()}` : '',
      eventData?.location ? `Lugar: ${eventData.location}` : '',
    ];
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`;
    trackEvent('EVENT_WHATSAPP_ORDER', {
      category: GAEventCategory.CONVERSION,
      company_id: companyId,
      event_id: eventId,
      qty,
    });
    window.open(url, '_blank');
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!eventData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <button
          type="button"
          onClick={() => navigate(`/${companyId}/events`)}
          className="text-sm text-blue-600 hover:underline"
        >
          {t('common.back')}
        </button>
        <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-5 space-y-3">
          <p className="text-xs text-gray-500">{companyName}</p>
          <h1 className="text-2xl font-bold text-gray-900">{eventData.title}</h1>
          <p className="text-sm text-gray-600">{eventData.description}</p>
          <p className="text-sm text-gray-600">{new Date(eventData.start_date as any).toLocaleString()}</p>
          {eventData.end_date && (
            <p className="text-xs text-gray-500">{t('eventsModule.ends')}: {new Date(eventData.end_date as any).toLocaleString()}</p>
          )}
          {eventData.location && <p className="text-sm text-gray-600">{eventData.location}</p>}
          <p className="text-sm text-gray-600">
            {eventData.capacity ? `${t('eventsModule.capacity')}: ${eventData.capacity} · ${t('eventsModule.available')}: ${remaining}` : t('eventsModule.openCapacity')}
          </p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">{t('eventsModule.qty')}</label>
            <input
              type="number"
              min={1}
              max={remaining || 99}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(remaining || 99, Number(e.target.value) || 1)))}
              className="w-24 border border-gray-200 rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={handleWhatsapp}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {t('eventsModule.whatsapp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
