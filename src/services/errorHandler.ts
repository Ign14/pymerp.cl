import { logger } from '../utils/logger';
import { captureException } from '../config/sentry';

/**
 * Tipos de errores personalizados
 */
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  SERVER = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

/**
 * Clase de error personalizada con contexto adicional
 */
export class AppError extends Error {
  type: ErrorType;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.timestamp = new Date();
    
    // Mantener el stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Interfaz para el reporte de errores
 */
interface ErrorReport {
  message: string;
  type: ErrorType;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  url?: string;
}

/**
 * Servicio centralizado de manejo de errores
 */
class ErrorHandler {
  private userId?: string;

  /**
   * Establecer el usuario actual para contexto de errores
   */
  setUser(userId: string | undefined): void {
    this.userId = userId;
  }

  /**
   * Crear reporte de error estructurado
   */
  private createErrorReport(error: Error | AppError): ErrorReport {
    const report: ErrorReport = {
      message: error.message,
      type: error instanceof AppError ? error.type : ErrorType.UNKNOWN,
      stack: error.stack,
      timestamp: new Date(),
      userId: this.userId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    if (error instanceof AppError && error.context) {
      report.context = error.context;
    }

    return report;
  }

  /**
   * Manejar error y reportarlo
   */
  handle(error: Error | AppError, showToUser = true): void {
    const report = this.createErrorReport(error);
    
    // Log estructurado en desarrollo
    if (import.meta.env.DEV) {
      logger.group('Error Handler', true);
      logger.error('Error:', report.message);
      logger.error('Type:', report.type);
      if (report.context) {
        logger.error('Context:', report.context);
      }
      if (report.stack) {
        logger.error('Stack:', report.stack);
      }
      logger.groupEnd();
    }

    // Enviar a Sentry en producción
    if (!import.meta.env.DEV) {
      this.sendToSentry(report);
    }

    // Mostrar al usuario si es necesario
    if (showToUser) {
      this.showUserFriendlyMessage(report.type);
    }
  }

  /**
   * Enviar error a Sentry
   */
  private sendToSentry(report: ErrorReport): void {
    try {
      captureException(new Error(report.message), {
        type: report.type,
        userId: report.userId,
        url: report.url,
        ...report.context,
      });
    } catch (error) {
      logger.error('Error enviando a Sentry:', error);
    }
  }

  /**
   * Mostrar mensaje amigable al usuario
   */
  private showUserFriendlyMessage(type: ErrorType): void {
    // Usando el toast que ya está en el proyecto
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Error de conexión. Por favor, verifica tu internet.',
      [ErrorType.AUTHENTICATION]: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
      [ErrorType.AUTHORIZATION]: 'No tienes permisos para realizar esta acción.',
      [ErrorType.VALIDATION]: 'Los datos ingresados no son válidos.',
      [ErrorType.NOT_FOUND]: 'No se encontró el recurso solicitado.',
      [ErrorType.SERVER]: 'Error del servidor. Por favor, intenta más tarde.',
      [ErrorType.UNKNOWN]: 'Ha ocurrido un error inesperado.',
    };

    // En lugar de mostrar directamente, retornamos el mensaje
    // para que el componente lo use con react-hot-toast
    const message = messages[type] || messages[ErrorType.UNKNOWN];
    
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      logger.warn('Mensaje de error al usuario:', message);
    }
  }

  /**
   * Manejar errores de red/fetch
   */
  handleNetworkError(error: any, context?: Record<string, any>): void {
    const appError = new AppError(
      error.message || 'Error de red',
      ErrorType.NETWORK,
      context
    );
    this.handle(appError);
  }

  /**
   * Manejar errores de Firebase Auth
   */
  handleAuthError(error: any): void {
    let type = ErrorType.AUTHENTICATION;
    let message = 'Error de autenticación';

    // Mapear códigos de error de Firebase a mensajes amigables
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        message = 'Email o contraseña incorrectos';
        break;
      case 'auth/email-already-in-use':
        message = 'Este email ya está registrado';
        break;
      case 'auth/weak-password':
        message = 'La contraseña es muy débil';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/user-disabled':
        message = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos. Intenta más tarde';
        break;
      default:
        message = error.message || 'Error de autenticación';
    }

    const appError = new AppError(message, type, { code: error.code });
    this.handle(appError);
  }

  /**
   * Manejar errores de Firestore
   */
  handleFirestoreError(error: any, context?: Record<string, any>): void {
    let type = ErrorType.SERVER;
    
    if (error.code === 'permission-denied') {
      type = ErrorType.AUTHORIZATION;
    } else if (error.code === 'not-found') {
      type = ErrorType.NOT_FOUND;
    }

    const appError = new AppError(
      error.message || 'Error de base de datos',
      type,
      { ...context, code: error.code }
    );
    this.handle(appError);
  }

  /**
   * Wrapper para async functions con manejo de errores
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    errorContext?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error: any) {
      this.handle(
        new AppError(
          error.message || 'Error en operación asíncrona',
          ErrorType.UNKNOWN,
          errorContext
        )
      );
      return null;
    }
  }
}

// Exportar instancia singleton
export const errorHandler = new ErrorHandler();

// Export por defecto
export default errorHandler;
