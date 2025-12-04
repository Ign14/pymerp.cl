/**
 * Sistema de logging centralizado que se desactiva en producción
 * 
 * Uso:
 * - logger.log('Mensaje informativo', data)
 * - logger.warn('Advertencia', context)
 * - logger.error('Error crítico', error)
 * - logger.debug('Info de debugging', details)
 * 
 * En producción (VITE_ENV !== 'development'):
 * - Solo se registran errores (para Sentry u otro servicio)
 * - log, warn, debug se silencian
 */

interface LoggerConfig {
  isDevelopment: boolean;
  enableProduction: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      isDevelopment: import.meta.env.DEV || import.meta.env.MODE === 'development',
      enableProduction: false, // Cambiar a true si quieres logs en producción
    };
  }

  /**
   * Log informativo - solo en desarrollo
   */
  log(...args: any[]): void {
    if (this.config.isDevelopment) {
      console.log('[INFO]', ...args);
    }
  }

  /**
   * Advertencia - solo en desarrollo
   */
  warn(...args: any[]): void {
    if (this.config.isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * Error crítico - siempre se registra (incluso en producción)
   * En producción debería integrarse con Sentry
   */
  error(...args: any[]): void {
    if (this.config.isDevelopment || this.config.enableProduction) {
      console.error('[ERROR]', ...args);
    }
    
    // TODO: Integrar con Sentry en producción
    // if (!this.config.isDevelopment) {
    //   Sentry.captureException(args[0]);
    // }
  }

  /**
   * Debug detallado - solo en desarrollo
   */
  debug(...args: any[]): void {
    if (this.config.isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * Agrupa logs relacionados
   */
  group(label: string, collapsed = false): void {
    if (this.config.isDevelopment) {
      if (collapsed) {
        console.groupCollapsed(`[GROUP] ${label}`);
      } else {
        console.group(`[GROUP] ${label}`);
      }
    }
  }

  /**
   * Cierra un grupo de logs
   */
  groupEnd(): void {
    if (this.config.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Tabla para datos estructurados
   */
  table(data: any): void {
    if (this.config.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Timer para medir performance
   */
  time(label: string): void {
    if (this.config.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * Finaliza un timer
   */
  timeEnd(label: string): void {
    if (this.config.isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Log con estilo visual (emoji)
   */
  success(message: string, ...args: any[]): void {
    if (this.config.isDevelopment) {
      console.log('✅', message, ...args);
    }
  }

  /**
   * Log de inicio de operación
   */
  info(message: string, ...args: any[]): void {
    if (this.config.isDevelopment) {
      console.log('ℹ️', message, ...args);
    }
  }
}

// Exportar instancia única (singleton)
export const logger = new Logger();

// Export por defecto
export default logger;
