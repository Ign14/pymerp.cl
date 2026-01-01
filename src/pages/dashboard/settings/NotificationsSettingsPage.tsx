import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getNotificationSettings, setEmailNotificationsEnabled } from '../../../services/notifications';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';

export default function NotificationsSettingsPage() {
  const { t } = useTranslation('notifications');
  const { firestoreUser } = useAuth();
  const { trackEvent } = useAnalytics();
  const { handleAsyncError } = useErrorHandler();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    if (firestoreUser?.id && firestoreUser?.company_id) {
      loadSettings();
    }
  }, [firestoreUser]);

  const loadSettings = async () => {
    if (!firestoreUser?.id || !firestoreUser?.company_id) return;
    
    setLoading(true);
    try {
      const data = await getNotificationSettings(
        firestoreUser.id,
        firestoreUser.company_id
      );
      // Si no hay doc (o no se pudo leer), permitimos editar para intentar crearlo
      if (!data) {
        setCanEdit(true);
        setEmailEnabled(false);
        setNotificationEmail(firestoreUser.email);
      } else {
        setCanEdit(true);
        setEmailEnabled(data.email_notifications_enabled ?? false);
        setNotificationEmail(data.notification_email || firestoreUser.email);
      }
    } catch (error) {
      handleAsyncError(async () => {
        throw error;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!firestoreUser?.id || !firestoreUser?.company_id) return;
    // Si no pudimos leer por permisos, igualmente intentamos crear/actualizar; el error se mostrará desde el servicio
    
    setSaving(true);
    try {
      await handleAsyncError(async () => {
        await setEmailNotificationsEnabled(
          firestoreUser.id,
          firestoreUser.company_id!,
          enabled,
          notificationEmail || firestoreUser.email
        );

        trackEvent(enabled ? 'notifications_toggle_on' : 'notifications_toggle_off', {
          company_id: firestoreUser.company_id,
        });

        setEmailEnabled(enabled);
        toast.success(
          enabled ? t('messages.enabledSuccess') : t('messages.disabledSuccess')
        );
        
        await loadSettings();
      });
    } catch (error) {
      toast.error(t('messages.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!firestoreUser?.id || !firestoreUser?.company_id || !notificationEmail) return;
    // Si no pudimos leer por permisos, igualmente intentamos crear/actualizar; el error se mostrará desde el servicio
    
    setSaving(true);
    try {
      await handleAsyncError(async () => {
        await setEmailNotificationsEnabled(
          firestoreUser.id,
          firestoreUser.company_id!,
          emailEnabled,
          notificationEmail
        );

        toast.success(t('messages.saved'));
        await loadSettings();
      });
    } catch (error) {
      toast.error(t('messages.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-600">{t('description')}</p>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('emailNotifications.title')}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t('emailNotifications.description')}
                </p>
              </div>
              
              <button
                type="button"
                role="switch"
                aria-checked={emailEnabled}
                aria-label={t('emailNotifications.toggleLabel')}
                onClick={() => handleToggle(!emailEnabled)}
                disabled={saving || !canEdit}
                className={`${
                  emailEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    emailEnabled ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>

            {/* Email Input */}
            {emailEnabled && (
              <div className="border-t border-gray-200 pt-6">
                <label
                  htmlFor="notificationEmail"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('emailNotifications.emailLabel')}
                </label>
                <div className="mt-1 flex gap-3">
                  <input
                    type="email"
                    id="notificationEmail"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder={t('emailNotifications.emailPlaceholder')}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleEmailChange}
                    disabled={saving || !notificationEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('buttons.save')}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {t('emailNotifications.emailHelp')}
                </p>
              </div>
            )}

            {/* Notification Types */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {t('types.newAppointment')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {t('types.newAppointment')}</li>
                <li>• {t('types.appointmentConfirmed')}</li>
                <li>• {t('types.appointmentCancelled')}</li>
                <li>• {t('types.appointmentReminder')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
