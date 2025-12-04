import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { errorHandler, AppError, ErrorType } from '../services/errorHandler';

/**
 * Custom hook para manejo consistente de errores
 * 
 * Uso:
 * ```tsx
 * const { handleError, handleAsyncError } = useErrorHandler();
 * 
 * // Manejo síncrono
 * try {
 *   // código
 * } catch (error) {
 *   handleError(error);
 * }
 * 
 * // Manejo asíncrono
 * const result = await handleAsyncError(
 *   async () => await someAsyncOperation(),
 *   { context: 'loading data' }
 * );
 * ```
 */
export const useErrorHandler = () => {
  /**
   * Manejar error con toast notification
   */
  const handleError = useCallback((
    error: Error | AppError | any,
    options?: {
      showToast?: boolean;
      customMessage?: string;
      context?: Record<string, any>;
    }
  ) => {
    const showToast = options?.showToast ?? true;
    
    // Convertir a AppError si no lo es
    const appError = error instanceof AppError
      ? error
      : new AppError(
          error.message || 'Error desconocido',
          ErrorType.UNKNOWN,
          options?.context
        );

    // Usar errorHandler para logging y Sentry
    errorHandler.handle(appError, false);

    // Mostrar toast si es necesario
    if (showToast) {
      const message = options?.customMessage || getErrorMessage(appError);
      toast.error(message, {
        duration: 4000,
        position: 'top-right',
      });
    }
  }, []);

  /**
   * Wrapper para operaciones asíncronas con manejo de errores
   */
  const handleAsyncError = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    options?: {
      showToast?: boolean;
      customMessage?: string;
      context?: Record<string, any>;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error: any) {
      handleError(error, {
        showToast: options?.showToast,
        customMessage: options?.customMessage,
        context: options?.context,
      });

      // Callback adicional si existe
      if (options?.onError) {
        options.onError(error);
      }

      return null;
    }
  }, [handleError]);

  /**
   * Manejar errores de autenticación específicamente
   */
  const handleAuthError = useCallback((error: any) => {
    errorHandler.handleAuthError(error);
    
    // Obtener mensaje amigable
    const message = getAuthErrorMessage(error);
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
    });
  }, []);

  /**
   * Manejar errores de Firestore específicamente
   */
  const handleFirestoreError = useCallback((
    error: any,
    context?: Record<string, any>
  ) => {
    errorHandler.handleFirestoreError(error, context);
    
    const message = getFirestoreErrorMessage(error);
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
    });
  }, []);

  /**
   * Manejar errores de red específicamente
   */
  const handleNetworkError = useCallback((
    error: any,
    context?: Record<string, any>
  ) => {
    errorHandler.handleNetworkError(error, context);
    
    toast.error('Error de conexión. Verifica tu internet.', {
      duration: 4000,
      position: 'top-right',
    });
  }, []);

  return {
    handleError,
    handleAsyncError,
    handleAuthError,
    handleFirestoreError,
    handleNetworkError,
  };
};

/**
 * Obtener mensaje de error amigable
 */
function getErrorMessage(error: AppError): string {
  const messages: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: 'Error de conexión. Verifica tu internet.',
    [ErrorType.AUTHENTICATION]: 'Error de autenticación. Inicia sesión nuevamente.',
    [ErrorType.AUTHORIZATION]: 'No tienes permisos para esta acción.',
    [ErrorType.VALIDATION]: 'Los datos ingresados no son válidos.',
    [ErrorType.NOT_FOUND]: 'No se encontró el recurso solicitado.',
    [ErrorType.SERVER]: 'Error del servidor. Intenta más tarde.',
    [ErrorType.UNKNOWN]: error.message || 'Ha ocurrido un error inesperado.',
  };

  return messages[error.type] || messages[ErrorType.UNKNOWN];
}

/**
 * Obtener mensaje específico para errores de autenticación
 */
function getAuthErrorMessage(error: any): string {
  switch (error.code) {
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o contraseña incorrectos';
    case 'auth/email-already-in-use':
      return 'Este email ya está registrado';
    case 'auth/weak-password':
      return 'La contraseña es muy débil';
    case 'auth/invalid-email':
      return 'Email inválido';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde';
    default:
      return error.message || 'Error de autenticación';
  }
}

/**
 * Obtener mensaje específico para errores de Firestore
 */
function getFirestoreErrorMessage(error: any): string {
  switch (error.code) {
    case 'permission-denied':
      return 'No tienes permisos para acceder a este recurso';
    case 'not-found':
      return 'No se encontró el recurso solicitado';
    case 'already-exists':
      return 'Este recurso ya existe';
    case 'resource-exhausted':
      return 'Se alcanzó el límite de operaciones';
    case 'unauthenticated':
      return 'Debes iniciar sesión para continuar';
    default:
      return error.message || 'Error de base de datos';
  }
}

export default useErrorHandler;
