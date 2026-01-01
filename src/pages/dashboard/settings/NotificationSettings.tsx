import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import {
  getNotificationSettings,
  setEmailNotificationsEnabled,
} from '../../../services/appointments';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { motion } from 'framer-motion';

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabledState] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!firestoreUser?.id || !firestoreUser?.company_id) return;

    try {
      const data = await getNotificationSettings(firestoreUser.id, firestoreUser.company_id);
      setEmailNotificationsEnabledState(data?.email_notifications_enabled || false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!firestoreUser?.id || !firestoreUser?.company_id) {
      toast.error('Error de autenticación');
      return;
    }

    setSaving(true);

    try {
      await setEmailNotificationsEnabled(
        firestoreUser.id,
        firestoreUser.company_id,
        enabled,
        firestoreUser.email
      );
      setEmailNotificationsEnabledState(enabled);
      toast.success(enabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    } catch (error) {
      handleError(error);
      // Revert toggle on error
      setEmailNotificationsEnabledState(!enabled);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label="Volver"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de notificaciones</h1>
          </div>

          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Notificaciones por correo
                  </h2>
                  <p className="text-gray-600 text-sm mb-3">
                    Recibe un correo electrónico cuando haya nuevas solicitudes de cita o cambios en tu agenda.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Email de destino:</span>{' '}
                      <span className="text-blue-600">{firestoreUser?.email}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Solo lectura. Este es tu email de cuenta.
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailNotificationsEnabled}
                    disabled={saving}
                    onClick={() => handleToggle(!emailNotificationsEnabled)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="sr-only">
                      {emailNotificationsEnabled ? 'Desactivar' : 'Activar'} notificaciones por email
                    </span>
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        emailNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-label="Info">
                  ℹ️
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    ¿Cuándo recibirás notificaciones?
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Cuando un cliente solicite una nueva cita</li>
                    <li>• Cuando un cliente cancele una cita</li>
                    <li>• Recordatorios de citas próximas (24h antes)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Additional Settings Placeholder */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Más opciones de notificación
              </h2>
              <p className="text-gray-500 text-sm">
                Próximamente: notificaciones push, SMS y preferencias de horario.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
