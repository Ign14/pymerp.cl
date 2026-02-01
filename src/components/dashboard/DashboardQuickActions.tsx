import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getCompany } from '../../services/firestore';
import { Calendar, Bell, Plus, UserPlus, Menu, QrCode, ShoppingBag } from 'lucide-react';
import { resolveCategoryId, isModuleEnabled } from '../../config/categories';

interface QuickAction {
  icon: any;
  title: string;
  description: string;
  buttonText: string;
  ariaLabel: string;
  onClick: () => void;
  colorClass: string;
  module?: string;
}

export default function DashboardQuickActions({ onOpenMenuQr }: { onOpenMenuQr?: () => void }) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { trackClick } = useAnalytics();
  const { firestoreUser } = useAuth();
  const [categoryId, setCategoryId] = useState<string>('otros');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBusinessType = async () => {
      if (firestoreUser?.company_id) {
        try {
          const company = await getCompany(firestoreUser.company_id);
          setCategoryId(resolveCategoryId(company));
        } catch (error) {
          console.error('Error loading business type:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadBusinessType();
  }, [firestoreUser]);

  const handleManualBooking = () => {
    trackClick('quick_action_manual_booking')();
    navigate('/dashboard/appointments/new');
  };

  const handleReviewSchedule = () => {
    trackClick('quick_action_review_schedule')();
    navigate('/dashboard/schedule');
  };

  const handleManageNotifications = () => {
    trackClick('quick_action_notifications')();
    navigate('/dashboard/settings/notifications');
  };

  const handleCreateProfessional = () => {
    trackClick('quick_action_create_professional')();
    navigate('/dashboard/professionals/new');
  };

  const handleMenuCategories = () => {
    trackClick('quick_action_menu_categories')();
    navigate('/dashboard/catalog/menu-categories');
  };

  const handleMenuQr = () => {
    trackClick('quick_action_menu_qr')();
    if (onOpenMenuQr) {
      onOpenMenuQr();
      return;
    }
  };

  const handleOrders = () => {
    trackClick('quick_action_orders')();
    navigate('/dashboard/orders');
  };

  const allActions: QuickAction[] = [
    {
      icon: Plus,
      title: t('quickActions.manualBooking.title'),
      description: t('quickActions.manualBooking.description'),
      buttonText: t('quickActions.manualBooking.button'),
      ariaLabel: t('quickActions.manualBooking.ariaLabel'),
      onClick: handleManualBooking,
      colorClass: 'bg-blue-600 hover:bg-blue-700',
      module: 'appointments',
    },
    {
      icon: Calendar,
      title: t('quickActions.reviewSchedule.title'),
      description: t('quickActions.reviewSchedule.description'),
      buttonText: t('quickActions.reviewSchedule.button'),
      ariaLabel: t('quickActions.reviewSchedule.ariaLabel'),
      onClick: handleReviewSchedule,
      colorClass: 'bg-green-600 hover:bg-green-700',
      module: 'schedule',
    },
    {
      icon: UserPlus,
      title: t('quickActions.createProfessional.title'),
      description: t('quickActions.createProfessional.description'),
      buttonText: t('quickActions.createProfessional.button'),
      ariaLabel: t('quickActions.createProfessional.ariaLabel'),
      onClick: handleCreateProfessional,
      colorClass: 'bg-orange-600 hover:bg-orange-700',
      module: 'professionals',
    },
    {
      icon: Menu,
      title: 'Categorías de Menú',
      description: 'Organiza tus productos en categorías para tu menú digital',
      buttonText: 'Gestionar Categorías',
      ariaLabel: 'Gestionar categorías de menú',
      onClick: handleMenuCategories,
      colorClass: 'bg-amber-600 hover:bg-amber-700',
      module: 'menu-categories',
    },
    {
      icon: QrCode,
      title: 'Menú QR',
      description: 'Accede a tu menú digital con código QR para compartir con clientes',
      buttonText: 'Ver Menú QR',
      ariaLabel: 'Ver menú QR',
      onClick: handleMenuQr,
      colorClass: 'bg-teal-600 hover:bg-teal-700',
      module: 'menu-qr',
    },
    {
      icon: ShoppingBag,
      title: 'Pedidos',
      description: 'Revisa y gestiona los pedidos ingresados desde el menú o WhatsApp',
      buttonText: 'Ir a Pedidos',
      ariaLabel: 'Ir a la pantalla de pedidos',
      onClick: handleOrders,
      colorClass: 'bg-slate-700 hover:bg-slate-800',
      module: 'orders',
    },
    {
      icon: Bell,
      title: t('quickActions.manageNotifications.title'),
      description: t('quickActions.manageNotifications.description'),
      buttonText: t('quickActions.manageNotifications.button'),
      ariaLabel: t('quickActions.manageNotifications.ariaLabel'),
      onClick: handleManageNotifications,
      colorClass: 'bg-purple-600 hover:bg-purple-700',
      module: 'notifications',
    },
  ];

  const hasAppointments =
    isModuleEnabled(categoryId, 'appointments') || isModuleEnabled(categoryId, 'appointments-lite');

  const visibleActions = allActions.filter((action) => {
    if (!action.module) return false;
    if (action.module === 'appointments') {
      return hasAppointments;
    }
    return isModuleEnabled(categoryId, action.module as any);
  });

  // Show loading or nothing while determining business type
  if (loading) {
    return null;
  }

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="quick-actions-title" className="space-y-4">
      <h2 id="quick-actions-title" className="text-xl font-semibold text-gray-900">
        {t('quickActions.title')}
      </h2>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 ${visibleActions.length > 2 ? 'lg:grid-cols-3' : ''} gap-4`}>
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${action.colorClass} text-white`}>
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900">{action.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600">{action.description}</p>
              
              <button
                type="button"
                onClick={action.onClick}
                className={`w-full px-4 py-2 rounded-md text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${action.colorClass}`}
                aria-label={action.ariaLabel}
              >
                {action.buttonText}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
