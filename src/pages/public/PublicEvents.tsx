import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCompany } from '../../services/firestore';
import { getEvents } from '../../services/events';
import { Event as EventType } from '../../types';
import EventCardSkeleton from '../../components/skeletons/EventCardSkeleton';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAnalytics } from '../../hooks/useAnalytics';
import { GAEventCategory } from '../../config/analytics';

export default function PublicEvents() {
  const { companyId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const { trackEvent } = useAnalytics();

  const [companyName, setCompanyName] = useState<string>('');
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      try {
        const [company, evs] = await Promise.all([getCompany(companyId), getEvents(companyId)]);
        if (!company) {
          navigate('/');
          return;
        }
        setCompanyName(company.name);
        setEvents(evs.filter((e) => e.status === 'PUBLISHED').sort((a, b) => {
          const aDate = (a.start_date as any)?.getTime?.() || new Date(a.start_date).getTime();
          const bDate = (b.start_date as any)?.getTime?.() || new Date(b.start_date).getTime();
          return aDate - bDate;
        }));
        trackEvent('EVENTS_VIEW', { category: GAEventCategory.NAVIGATION, company_id: company.id });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, handleError, navigate, trackEvent]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500">{companyName}</p>
                <h1 className="text-2xl font-bold text-gray-900">{t('eventsModule.publicTitle')}</h1>
              </>
            )}
          </div>
          {!loading && (
            <button
              type="button"
              onClick={() => navigate(`/${companyId}`)}
              className="text-sm text-blue-600 hover:underline"
            >
              {t('menuView.backToProfile')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-600">{t('eventsModule.publicEmpty')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{ev.title}</h2>
                  <span className="text-xs text-gray-500">{new Date(ev.start_date as any).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{ev.description}</p>
                <p className="text-sm text-gray-500">{ev.location}</p>
                <Link
                  to={`/${companyId}/events/${ev.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('eventsModule.viewDetails')}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
