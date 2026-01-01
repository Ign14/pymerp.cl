import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  applyActionCode, 
  verifyPasswordResetCode, 
  checkActionCode 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useErrorHandler } from '../hooks/useErrorHandler';
import LoadingSpinner from '../components/animations/LoadingSpinner';
import toast from 'react-hot-toast';

/**
 * Página que maneja las acciones de Firebase Auth (verificación de email, recuperación de contraseña)
 * Esta página procesa los códigos de acción (oobCode) enviados por email
 */
export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const processAction = async () => {
      const mode = searchParams.get('mode');
      const actionCode = searchParams.get('oobCode');

      if (!mode || !actionCode) {
        setStatus('error');
        setMessage('Enlace inválido o expirado. Por favor, solicita un nuevo enlace.');
        return;
      }

      try {
        switch (mode) {
          case 'verifyEmail': {
            // Verificar email
            await applyActionCode(auth, actionCode);
            setStatus('success');
            setMessage('Tu correo electrónico ha sido verificado correctamente.');
            toast.success('Correo verificado correctamente');
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
              navigate('/login?verified=true');
            }, 2000);
            break;
          }

          case 'resetPassword': {
            // Verificar que el código es válido antes de redirigir
            try {
              await verifyPasswordResetCode(auth, actionCode);
              // El código es válido, redirigir a la página de cambio de contraseña
              navigate(`/change-password?oobCode=${actionCode}&mode=resetPassword`);
            } catch (error: any) {
              // El código es inválido o expirado
              setStatus('error');
              setMessage('Este enlace ha expirado o ya fue utilizado. Por favor, solicita un nuevo enlace de recuperación.');
              toast.error('Enlace inválido o expirado');
              
              setTimeout(() => {
                navigate('/login');
              }, 3000);
            }
            break;
          }

          case 'recoverEmail': {
            // Recuperar email (cuando se cambia el email)
            try {
              await checkActionCode(auth, actionCode);
              // Procesar recuperación de email
              setStatus('success');
              setMessage('Tu email ha sido recuperado correctamente.');
              toast.success('Email recuperado correctamente');
              
              setTimeout(() => {
                navigate('/login');
              }, 2000);
            } catch (error: any) {
              setStatus('error');
              setMessage('Este enlace ha expirado o ya fue utilizado.');
              toast.error('Enlace inválido o expirado');
              
              setTimeout(() => {
                navigate('/login');
              }, 3000);
            }
            break;
          }

          default: {
            setStatus('error');
            setMessage(`Modo de acción no reconocido: ${mode}`);
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        }
      } catch (error: any) {
        console.error('Error procesando acción de Auth:', error);
        handleError(error);
        setStatus('error');
        
        let errorMessage = 'Ocurrió un error al procesar tu solicitud.';
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'Este enlace ha expirado. Por favor, solicita un nuevo enlace.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Este enlace es inválido o ya fue utilizado. Por favor, solicita un nuevo enlace.';
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'Esta cuenta ha sido deshabilitada. Por favor, contacta al soporte.';
        }
        
        setMessage(errorMessage);
        toast.error(errorMessage);
        
        setTimeout(() => {
          navigate('/login');
        }, 4000);
      }
    };

    processAction();
  }, [searchParams, navigate, handleError]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
              Procesando tu solicitud...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras verificamos tu enlace.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl text-green-500 mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Operación exitosa!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              Serás redirigido automáticamente...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl text-red-500 mb-4">✕</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error al procesar
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}

