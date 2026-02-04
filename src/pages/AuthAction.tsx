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
import SEO from '../components/SEO';

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

  const mode = searchParams.get('mode');
  const getPageTitle = () => {
    switch (mode) {
      case 'verifyEmail':
        return 'Verificar Email | PyM-ERP';
      case 'resetPassword':
        return 'Restablecer Contraseña | PyM-ERP';
      case 'recoverEmail':
        return 'Recuperar Email | PyM-ERP';
      default:
        return 'Verificación | PyM-ERP';
    }
  };

  return (
    <>
      <SEO
        title={getPageTitle()}
        description="Procesando tu solicitud de autenticación en PyM-ERP"
        robots="noindex, nofollow"
      />
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center px-4 py-8">
        {/* Logo en la parte superior */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <img 
            src="/logoapp.png" 
            alt="PyM-ERP Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>

        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 md:p-10 text-center">
        {status === 'loading' && (
          <>
            <LoadingSpinner size="lg" />
            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">
              Procesando tu solicitud...
            </h2>
            <p className="text-gray-600 text-base">
              Por favor espera mientras verificamos tu enlace.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Operación exitosa!
            </h2>
            <p className="text-gray-600 text-base mb-6">{message}</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <LoadingSpinner size="sm" />
              <span>Redirigiendo automáticamente...</span>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Error al procesar
            </h2>
            <p className="text-gray-600 text-base mb-8">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all duration-200"
            >
              Volver al inicio de sesión
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-all duration-200"
            >
              Ir al inicio
            </button>
          </>
        )}

        {/* Footer con branding */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-semibold text-indigo-600">PyM-ERP</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Tu plataforma de gestión empresarial
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

