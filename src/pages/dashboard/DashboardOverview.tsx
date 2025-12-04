import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany } from '../../services/firestore';
import { getPublicPageEvents, getAppointmentRequests, getProductOrderRequests } from '../../services/firestore';
import { EventType } from '../../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LogoutCorner from '../../components/LogoutCorner';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export default function DashboardOverview() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    last30DaysViews: 0,
    totalWhatsAppClicks: 0,
    last30DaysWhatsAppClicks: 0,
    totalServiceBookClicks: 0,
    last30DaysServiceBookClicks: 0,
    totalProductOrderClicks: 0,
    last30DaysProductOrderClicks: 0,
    totalRequests: 0,
    last30DaysRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firestoreUser?.company_id) {
      loadData();
    } else if (firestoreUser && !firestoreUser.company_id) {
      // Redirect to setup if no company
      navigate('/setup/company-basic');
    }
  }, [firestoreUser]);

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const companyData = await getCompany(firestoreUser.company_id);
      setCompany(companyData);

      if (!companyData?.setup_completed) {
        navigate('/setup/company-basic');
        return;
      }

      // Load events
      const events = await getPublicPageEvents(firestoreUser.company_id);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalViews = events.filter(e => e.event_type === EventType.PAGE_VIEW).length;
      const last30DaysViews = events.filter(
        e => e.event_type === EventType.PAGE_VIEW && e.created_at >= thirtyDaysAgo
      ).length;

      const totalWhatsAppClicks = events.filter(e => e.event_type === EventType.WHATSAPP_CLICK).length;
      const last30DaysWhatsAppClicks = events.filter(
        e => e.event_type === EventType.WHATSAPP_CLICK && e.created_at >= thirtyDaysAgo
      ).length;

      const totalServiceBookClicks = events.filter(e => e.event_type === EventType.SERVICE_BOOK_CLICK).length;
      const last30DaysServiceBookClicks = events.filter(
        e => e.event_type === EventType.SERVICE_BOOK_CLICK && e.created_at >= thirtyDaysAgo
      ).length;

      const totalProductOrderClicks = events.filter(e => e.event_type === EventType.PRODUCT_ORDER_CLICK).length;
      const last30DaysProductOrderClicks = events.filter(
        e => e.event_type === EventType.PRODUCT_ORDER_CLICK && e.created_at >= thirtyDaysAgo
      ).length;

      // Load requests
      const appointments = await getAppointmentRequests(firestoreUser.company_id);
      const orders = await getProductOrderRequests(firestoreUser.company_id);
      const totalRequests = appointments.length + orders.length;
      const last30DaysRequests = [
        ...appointments.filter(a => a.created_at >= thirtyDaysAgo),
        ...orders.filter(o => o.created_at >= thirtyDaysAgo),
      ].length;

      setStats({
        totalViews,
        last30DaysViews,
        totalWhatsAppClicks,
        last30DaysWhatsAppClicks,
        totalServiceBookClicks,
        last30DaysServiceBookClicks,
        totalProductOrderClicks,
        last30DaysProductOrderClicks,
        totalRequests,
        last30DaysRequests,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (!company) {
    return null;
  }

  const publicUrl = `${window.location.origin}/${company.slug}`;

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('URL pública copiada al portapapeles');
    } catch {
      toast.error('No se pudo copiar. Intenta manualmente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <LogoutCorner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="mt-2 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-gray-600">
                  URL pública:{' '}
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {publicUrl}
                  </a>
                </span>
                <button
                  type="button"
                  onClick={copyPublicUrl}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Copiar
                </button>
              </div>
              <p className="text-gray-500 text-sm">Comparte desde aquí.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/setup/company-basic')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            Editar datos básicos / URL pública
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Accesos rápidos</h2>
          <div className="flex flex-wrap gap-4">
            {company.business_type === 'SERVICES' && (
              <>
                <Link
                  to="/dashboard/services"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Servicios
                </Link>
                <Link
                  to="/dashboard/services/schedules"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Horarios
                </Link>
                <Link
                  to="/dashboard/services/settings"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Configuración Visual
                </Link>
              </>
            )}
            {company.business_type === 'PRODUCTS' && (
              <>
                <Link
                  to="/dashboard/products"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Productos
                </Link>
                <Link
                  to="/dashboard/products/settings"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Configuración Visual
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Visitas a la ficha"
            total={stats.totalViews}
            last30Days={stats.last30DaysViews}
          />
          <StatCard
            title="Clics en WhatsApp"
            total={stats.totalWhatsAppClicks}
            last30Days={stats.last30DaysWhatsAppClicks}
          />
          {company.business_type === 'SERVICES' && (
            <StatCard
              title="Clics en Agendar"
              total={stats.totalServiceBookClicks}
              last30Days={stats.last30DaysServiceBookClicks}
            />
          )}
          {company.business_type === 'PRODUCTS' && (
            <StatCard
              title="Clics en Solicitar"
              total={stats.totalProductOrderClicks}
              last30Days={stats.last30DaysProductOrderClicks}
            />
          )}
          <StatCard
            title="Solicitudes registradas"
            total={stats.totalRequests}
            last30Days={stats.last30DaysRequests}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, total, last30Days }: { title: string; total: number; last30Days: number }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-1">{total}</div>
      <div className="text-sm text-gray-600">Últimos 30 días: {last30Days}</div>
    </div>
  );
}
