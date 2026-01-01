import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getCompany } from '../../services/firestore';
import { Calendar, Bell, Plus, UserPlus } from 'lucide-react';

interface QuickAction {
  icon: any;
  title: string;
  description: string;
  buttonText: string;
  ariaLabel: string;
  onClick: () => void;
  colorClass: string;
  showFor?: 'SERVICES' | 'PRODUCTS' | 'BOTH';
}

export default function DashboardQuickActions() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { trackClick } = useAnalytics();
  const { firestoreUser } = useAuth();
  const [businessType, setBusinessType] = useState<'SERVICES' | 'PRODUCTS' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBusinessType = async () => {
      if (firestoreUser?.company_id) {
        try {
          const company = await getCompany(firestoreUser.company_id);
          setBusinessType(company?.business_type || null);
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

  const allActions: QuickAction[] = [
    {
      icon: Plus,
      title: t('quickActions.manualBooking.title'),
      description: t('quickActions.manualBooking.description'),
      buttonText: t('quickActions.manualBooking.button'),
      ariaLabel: t('quickActions.manualBooking.ariaLabel'),
      onClick: handleManualBooking,
      colorClass: 'bg-blue-600 hover:bg-blue-700',
      showFor: 'SERVICES',
    },
    {
      icon: Calendar,
      title: t('quickActions.reviewSchedule.title'),
      description: t('quickActions.reviewSchedule.description'),
      buttonText: t('quickActions.reviewSchedule.button'),
      ariaLabel: t('quickActions.reviewSchedule.ariaLabel'),
      onClick: handleReviewSchedule,
      colorClass: 'bg-green-600 hover:bg-green-700',
      showFor: 'SERVICES',
    },
    {
      icon: UserPlus,
      title: t('quickActions.createProfessional.title'),
      description: t('quickActions.createProfessional.description'),
      buttonText: t('quickActions.createProfessional.button'),
      ariaLabel: t('quickActions.createProfessional.ariaLabel'),
      onClick: handleCreateProfessional,
      colorClass: 'bg-orange-600 hover:bg-orange-700',
      showFor: 'SERVICES',
    },
    {
      icon: Bell,
      title: t('quickActions.manageNotifications.title'),
      description: t('quickActions.manageNotifications.description'),
      buttonText: t('quickActions.manageNotifications.button'),
      ariaLabel: t('quickActions.manageNotifications.ariaLabel'),
      onClick: handleManageNotifications,
      colorClass: 'bg-purple-600 hover:bg-purple-700',
      showFor: 'BOTH',
    },
  ];

  // Filter actions based on business type
  const visibleActions = allActions.filter(
    (action) => action.showFor === 'BOTH' || action.showFor === businessType
  );

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
