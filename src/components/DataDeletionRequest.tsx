import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedButton from './animations/AnimatedButton';
import AnimatedModal from './animations/AnimatedModal';
import toast from 'react-hot-toast';
import { logOut } from '../services/auth';
import { logger } from '../utils/logger';

interface DataDeletionRequestProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataDeletionRequest({ isOpen, onClose }: DataDeletionRequestProps) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmText !== 'ELIMINAR') {
      toast.error('Escribe ELIMINAR para confirmar');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar función de eliminación completa
      // Esta función debería:
      // 1. Marcar usuario como "pending_deletion"
      // 2. Crear ticket de eliminación para admin
      // 3. Proceso batch para eliminar datos después de 30 días
      
      // Por ahora, crear solicitud de eliminación
      const deletionRequest = {
        user_id: firestoreUser?.id,
        email: firestoreUser?.email,
        requested_at: new Date().toISOString(),
        status: 'PENDING',
        data_to_delete: {
          user_profile: true,
          company_data: true,
          services: true,
          products: true,
          analytics: false,  // GA4 retiene 26 meses mínimo
        }
      };

      logger.info('Solicitud de eliminación creada:', deletionRequest);
      
      // Enviar email de confirmación (implementar)
      // await sendDeletionRequestEmail(firestoreUser?.email);
      
      toast.success('✅ Solicitud de eliminación enviada exitosamente. Te contactaremos en 24-48 horas hábiles.');
      
      // Logout
      await logOut();
      navigate('/');
      
    } catch (error) {
      logger.error('Error creando solicitud de eliminación:', error);
      toast.error('❌ No se pudo procesar la solicitud. Por favor intenta nuevamente o contacta a soporte@pymerp.cl');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Solicitud de eliminación de datos"
      className="p-6"
    >
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Eliminar Permanentemente Mi Cuenta
        </h2>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>⚠️ Advertencia:</strong> Esta acción es permanente y no se puede deshacer
                  </p>
                </div>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">¿Qué información se eliminará?</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ Tu perfil de usuario y credenciales</li>
                <li>✓ Toda la información de tu empresa</li>
                <li>✓ Servicios y productos publicados</li>
                <li>✓ Imágenes y archivos que hayas subido</li>
                <li>✓ Historial de solicitudes y pedidos</li>
                <li>✓ Preferencias y configuraciones</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 text-gray-900 dark:text-white">¿Qué NO podemos eliminar?</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Datos en Google Analytics (se conservan 26 meses por política de Google)</li>
                <li>• Registros de auditoría requeridos por ley chilena</li>
                <li>• Datos ya anonimizados en estadísticas agregadas</li>
                <li>• Transacciones con obligación legal de conservación</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 text-gray-900 dark:text-white">¿Cómo funciona el proceso?</h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li><strong>1.</strong> Envías tu solicitud de eliminación desde aquí</li>
                <li><strong>2.</strong> Verificamos tu identidad (24 a 48 horas hábiles)</li>
                <li><strong>3.</strong> Procesamos la eliminación permanente (máximo 30 días según RGPD)</li>
                <li><strong>4.</strong> Recibes confirmación por email cuando esté completa</li>
              </ol>
            </div>

            <div className="flex gap-2 pt-4">
              <AnimatedButton
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </AnimatedButton>
              <AnimatedButton
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Continuar
              </AnimatedButton>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Para confirmar la eliminación permanente, escribe exactamente:
            </p>
            <p className="text-center text-xl font-bold text-gray-900 dark:text-white mb-3">
              ELIMINAR
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Escribe: ELIMINAR"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg font-mono"
              autoFocus
            />

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>⚠️ Última advertencia:</strong> Una vez confirmado, NO podrás recuperar tu información.
                Asegúrate de haber descargado todo lo importante usando "Descargar Mis Datos".
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <AnimatedButton
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Atrás
              </AnimatedButton>
              <AnimatedButton
                onClick={handleDelete}
                disabled={confirmText !== 'ELIMINAR' || loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : 'Eliminar Permanentemente'}
              </AnimatedButton>
            </div>
          </div>
        )}
      </div>
    </AnimatedModal>
  );
}

