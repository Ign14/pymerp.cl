import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany, getCompanyAppearance } from '../../services/firestore';
import { getPublicPageEvents, getAppointmentRequests, getProductOrderRequests } from '../../services/firestore';
import { getAppointmentsByCompany } from '../../services/appointments';
import { listProfessionals } from '../../services/professionals';
import { BusinessType, EventType } from '../../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LogoutCorner from '../../components/LogoutCorner';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import DashboardQuickActions from '../../components/dashboard/DashboardQuickActions';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import MenuQRModal from '../../components/dashboard/MenuQRModal';
import { getCategoryConfig, isModuleEnabled, resolveCategoryId } from '../../config/categories';
import { env } from '../../config/env';
import { useTranslation } from 'react-i18next';

export default function DashboardOverview() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();
  const [company, setCompany] = useState<any>(null);
  const [appearance, setAppearance] = useState<any>(null);
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
  const [appointmentsByProfessional, setAppointmentsByProfessional] = useState({
    total: 0,
    topProfessionalName: '',
    topProfessionalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showMenuQr, setShowMenuQr] = useState(false);
  const [updatingPublicEnabled, setUpdatingPublicEnabled] = useState(false);

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
      const appearanceData = await getCompanyAppearance(firestoreUser.company_id, BusinessType.PRODUCTS);
      setAppearance(appearanceData);

      if (!companyData?.setup_completed) {
        navigate('/setup/company-basic');
        return;
      }

      const [
        events,
        appointmentsRequests,
        orders,
        appointments,
        professionalsList,
      ] = await Promise.all([
        getPublicPageEvents(firestoreUser.company_id),
        getAppointmentRequests(firestoreUser.company_id),
        getProductOrderRequests(firestoreUser.company_id),
        getAppointmentsByCompany(firestoreUser.company_id),
        listProfessionals(firestoreUser.company_id),
      ]);

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

      const totalRequests = appointmentsRequests.length + orders.length;
      const last30DaysRequests = [
        ...appointmentsRequests.filter(a => a.created_at >= thirtyDaysAgo),
        ...orders.filter(o => o.created_at >= thirtyDaysAgo),
      ].length;

      const appointmentsByProCount = appointments.filter(a => a.professional_id).reduce<Record<string, number>>((acc, appt) => {
        if (appt.professional_id) {
          acc[appt.professional_id] = (acc[appt.professional_id] || 0) + 1;
        }
        return acc;
      }, {});

      const topProfessionalId = Object.entries(appointmentsByProCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topProfessionalName = professionalsList.find(p => p.id === topProfessionalId)?.name || '';
      const topProfessionalCount = topProfessionalId ? appointmentsByProCount[topProfessionalId] || 0 : 0;

      setAppointmentsByProfessional({
        total: Object.values(appointmentsByProCount).reduce((sum, value) => sum + value, 0),
        topProfessionalName,
        topProfessionalCount,
      });

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

  const categoryId = resolveCategoryId(company);
  const categoryConfig = getCategoryConfig(categoryId);
  const categoryLabel = t(categoryConfig.labelKey, categoryId);
  const hasAppointments =
    isModuleEnabled(categoryId, 'appointments') || isModuleEnabled(categoryId, 'appointments-lite');
  const hasSchedule = isModuleEnabled(categoryId, 'schedule');
  const hasProfessionals = isModuleEnabled(categoryId, 'professionals');
  const hasCatalog = isModuleEnabled(categoryId, 'catalog');
  const hasMenuCategories = isModuleEnabled(categoryId, 'menu-categories');
  const hasMenuQr = isModuleEnabled(categoryId, 'menu-qr');

  const publicUrl = `${env.publicBaseUrl}/${company.slug}`;
  const publicEnabled = Boolean(company?.publicEnabled);
  const minimarketAppUrl = env.minimarketAppUrl;
  const isMinimarket = categoryId === 'minimarket';

  const toRgba = (hex?: string, opacity?: number) => {
    if (!hex) return undefined;
    const safeOpacity = typeof opacity === 'number' ? Math.min(Math.max(opacity, 0), 1) : 1;
    const normalized = hex.replace('#', '');
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
  };

  const publicCardStyle = {
    background: appearance?.background_color
      ? toRgba(appearance.background_color, appearance.background_opacity ?? 0.12)
      : undefined,
    borderColor: appearance?.button_color ? toRgba(appearance.button_color, 0.4) : undefined,
  };
  const publicCardText = {
    color: appearance?.title_color || undefined,
  };
  const publicCardSubText = {
    color: appearance?.subtitle_color || undefined,
  };
  const publicCardButtonStyle = {
    backgroundColor: appearance?.button_color || undefined,
    color: appearance?.button_text_color || undefined,
  };

  const handlePublicEnabledToggle = async () => {
    if (!firestoreUser?.company_id || !company) return;
    const nextValue = !publicEnabled;
    try {
      setUpdatingPublicEnabled(true);
      await updateCompany(firestoreUser.company_id, { publicEnabled: nextValue });
      setCompany((prev: any) => ({ ...prev, publicEnabled: nextValue }));
      toast.success(
        nextValue
          ? 'Tu negocio ahora es público.'
          : 'Tu negocio ya no aparece en Pymes cercanas.'
      );
    } catch (error) {
      handleError(error);
      toast.error('No se pudo actualizar la visibilidad pública.');
    } finally {
      setUpdatingPublicEnabled(false);
    }
  };

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('URL pública copiada al portapapeles');
    } catch {
      toast.error('No se pudo copiar. Intenta manualmente.');
    }
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(`¡Visita mi negocio! ${publicUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`, '_blank');
  };

  const shareOnX = () => {
    const text = encodeURIComponent(`¡Visita ${company.name}!`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(publicUrl)}`, '_blank');
  };

  const shareOnInstagram = () => {
    // Instagram no tiene URL directo de compartir, pero podemos abrir el perfil o usar el esquema de URL
    window.open(`https://instagram.com/pymerp`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <LogoutCorner />
      <MenuQRModal
        company={company}
        isOpen={showMenuQr}
        onClose={() => setShowMenuQr(false)}
        onCompanyUpdate={(updates) => setCompany((prev: any) => ({ ...prev, ...updates }))}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Public URL Card - Destacada */}
        <div
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg p-6 mb-8 dark-url-card"
          style={publicCardStyle}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl shadow-md">
              🔗
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={publicCardText}>
                Tu Página Pública
              </h2>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed" style={publicCardSubText}>
                Comparte esta URL con tus clientes para que vean tus {company.business_type === 'SERVICES' ? 'servicios' : 'productos'} y puedan contactarte fácilmente
              </p>
              
              {/* URL Display */}
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-blue-200 shadow-sm" style={publicCardStyle}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a 
                    href={publicUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 font-medium break-all w-full sm:flex-1 min-w-0 transition-colors"
                  >
                    {publicUrl}
                  </a>
                  <button
                    type="button"
                    onClick={copyPublicUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md w-full sm:w-auto"
                    style={publicCardButtonStyle}
                  >
                    📋 Copiar URL
                  </button>
                </div>
              </div>

              {/* Public toggle */}
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-blue-100 shadow-sm" style={publicCardStyle}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">🌐 Publicar mi Negocio</h3>
                    <p className="text-sm text-gray-600">
                      Tu negocio aparece en "Pymes cercanas" y puede ser encontrado por clientes cercanos.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={publicEnabled}
                      disabled={updatingPublicEnabled}
                      onChange={handlePublicEnabledToggle}
                    />
                    <div className="w-11 h-6 rounded-full peer transition-colors bg-slate-300 peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                  aria-label="Compartir en WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Compartir en WhatsApp
                </button>
                <button
                  type="button"
                  onClick={shareOnFacebook}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                  aria-label="Compartir en Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Compartir en Facebook
                </button>
                <button
                  type="button"
                  onClick={shareOnX}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                  aria-label="Compartir en X"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Compartir en X
                </button>
                <button
                  type="button"
                  onClick={shareOnInstagram}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 text-sm font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                  aria-label="Seguir en Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                  </svg>
                  Seguir en Instagram
                </button>
              </div>

              {isMinimarket && (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1" style={publicCardText}>
                      Acceso rápido Minimarket
                    </h3>
                    <p className="text-sm text-gray-600" style={publicCardSubText}>
                      Entra a la nueva app para gestionar POS, inventario y pedidos.
                    </p>
                  </div>
                  <a
                    href={minimarketAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all w-full sm:w-auto text-center"
                    style={publicCardButtonStyle}
                  >
                    Abrir app Minimarket
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Main Dashboard Actions */}
        <div className="mb-8">
          <DashboardQuickActions onOpenMenuQr={() => setShowMenuQr(true)} />
        </div>

        {/* Configuration Section */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Configuración</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/setup/company-basic')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              📝 Editar datos básicos
            </button>
            <Link
              to="/change-password"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              🔒 Cambiar contraseña
            </Link>
            <Link
              to="/dashboard/branding/background"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              🖼️ Fondo personalizado
            </Link>
            <Link
              to="/dashboard/branding/video"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              🎥 Video promocional
            </Link>
          </div>
        </div>

        {/* Services/Products Management */}
        {(hasAppointments || hasCatalog) && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              {hasAppointments ? 'Gestión de Servicios' : 'Gestión de Productos'}
            </h2>
            {hasCatalog && (
              <p className="text-sm text-gray-600 mb-4">Categoría: {categoryLabel}</p>
            )}
            <div className="flex flex-wrap gap-3">
              {hasAppointments && (
                <>
                  <Link
                    to="/dashboard/services"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    📋 Servicios
                  </Link>
                  {hasSchedule && (
                    <Link
                      to="/dashboard/services/schedules"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      🕐 Horarios disponibles
                    </Link>
                  )}
                  <Link
                    to="/dashboard/services/settings"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    🎨 Apariencia
                  </Link>
                </>
              )}
              {hasCatalog && (
                <>
                  <Link
                    to="/dashboard/products"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    📦 Productos
                  </Link>
                  <Link
                    to="/dashboard/products/settings"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    🎨 Apariencia
                  </Link>
                  {hasMenuCategories && (
                    <Link
                      to="/dashboard/catalog/menu-categories"
                      className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium transition-colors"
                    >
                      📋 Categorías de Menú
                    </Link>
                  )}
                  {hasMenuQr && (
                    <button
                      type="button"
                      onClick={() => setShowMenuQr(true)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm font-medium transition-colors"
                    >
                      📱 Menú QR
                    </button>
                  )}
                  {hasMenuCategories && (
                    <a
                      href={`${publicUrl}/menu`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium transition-colors inline-flex items-center gap-2"
                      title="Ver menú público con productos categorizados"
                    >
                      📖 Menú
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Professionals Management */}
        {hasProfessionals && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Gestión de Profesionales</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard/professionals"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
              >
                👥 Ver Profesionales
              </Link>
              <Link
                to="/dashboard/professionals/new"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
              >
                ➕ Nuevo Profesional
              </Link>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Visitas a la ficha"
            total={stats.totalViews}
            last30Days={stats.last30DaysViews}
          />
          {hasAppointments && (
            <AppointmentsKpiCard
              total={appointmentsByProfessional.total}
              topProfessionalName={appointmentsByProfessional.topProfessionalName}
              topProfessionalCount={appointmentsByProfessional.topProfessionalCount}
            />
          )}
          <StatCard
            title="Clics en WhatsApp"
            total={stats.totalWhatsAppClicks}
            last30Days={stats.last30DaysWhatsAppClicks}
          />
          {hasAppointments && (
            <StatCard
              title="Clics en Agendar"
              total={stats.totalServiceBookClicks}
              last30Days={stats.last30DaysServiceBookClicks}
            />
          )}
          {hasCatalog && (
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
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-1">{total}</div>
      <div className="text-sm text-gray-600">Últimos 30 días: <span className="font-semibold text-blue-600">{last30Days}</span></div>
    </div>
  );
}

function AppointmentsKpiCard({
  total,
  topProfessionalName,
  topProfessionalCount,
}: {
  total: number;
  topProfessionalName: string;
  topProfessionalCount: number;
}) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Servicios agendados - profesional</h3>
      <div className="text-3xl font-bold text-gray-900 mb-1">{total}</div>
      <div className="text-sm text-gray-600">
        {topProfessionalName
          ? <>Top: <span className="font-semibold text-blue-600">{topProfessionalName}</span> ({topProfessionalCount})</>
          : 'Sin profesionales asignados'}
      </div>
    </div>
  );
}
