import { afterEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  group: vi.fn(),
  error: vi.fn(),
  groupEnd: vi.fn(),
  warn: vi.fn(),
};

const captureExceptionMock = vi.fn();

vi.mock('../../utils/logger', () => ({
  logger: mockLogger,
}));

vi.mock('../../config/sentry', () => ({
  captureException: captureExceptionMock,
}));

const originalEnv = { ...import.meta.env };

const setEnv = (values: Record<string, any>) => {
  Object.defineProperty(import.meta, 'env', {
    value: { ...import.meta.env, ...values },
    writable: true,
    configurable: true,
  });
};

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  setEnv(originalEnv);
});

describe('errorHandler', () => {
  it('logs structured information in development', async () => {
    setEnv({ DEV: true, MODE: 'development' });

    const { errorHandler, AppError, ErrorType } = await import('../errorHandler');

    errorHandler.setUser('user-123');
    const error = new AppError('Network down', ErrorType.NETWORK, { endpoint: '/api' });

    errorHandler.handle(error);

    expect(mockLogger.group).toHaveBeenCalledWith('Error Handler', true);
    expect(mockLogger.error).toHaveBeenCalledWith('Error:', 'Network down');
    expect(mockLogger.error).toHaveBeenCalledWith('Type:', ErrorType.NETWORK);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Mensaje de error al usuario:',
      'Error de conexión. Por favor, verifica tu internet.',
    );
  });

  it('sends structured payloads to Sentry', async () => {
    const { errorHandler, ErrorType } = await import('../errorHandler');

    const report = {
      message: 'Server exploded',
      type: ErrorType.SERVER,
      timestamp: new Date(),
      userId: 'user-prod',
      url: 'http://localhost/test',
      context: { operation: 'fetch' },
    };

    (errorHandler as any).sendToSentry(report);

    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        type: ErrorType.SERVER,
        userId: 'user-prod',
        url: 'http://localhost/test',
        operation: 'fetch',
      }),
    );
  });

  it('maps Firebase auth errors to friendly messages', async () => {
    const { errorHandler, AppError, ErrorType } = await import('../errorHandler');

    const handleSpy = vi.spyOn(errorHandler, 'handle').mockImplementation(() => {});

    errorHandler.handleAuthError({ code: 'auth/weak-password', message: 'Too weak' });

    expect(handleSpy).toHaveBeenCalledWith(expect.any(AppError));
    const appError = handleSpy.mock.calls[0][0] as InstanceType<typeof AppError>;

    expect(appError.message).toBe('La contraseña es muy débil');
    expect(appError.type).toBe(ErrorType.AUTHENTICATION);
    expect(appError.context).toEqual({ code: 'auth/weak-password' });

    handleSpy.mockRestore();
  });

  it('maps Firestore permission errors to authorization type', async () => {
    const { errorHandler, AppError, ErrorType } = await import('../errorHandler');

    const handleSpy = vi.spyOn(errorHandler, 'handle').mockImplementation(() => {});

    errorHandler.handleFirestoreError(
      { code: 'permission-denied', message: 'Blocked' },
      { collection: 'users' },
    );

    const appError = handleSpy.mock.calls[0][0] as InstanceType<typeof AppError>;

    expect(appError.type).toBe(ErrorType.AUTHORIZATION);
    expect(appError.message).toBe('Blocked');
    expect(appError.context).toEqual({ collection: 'users', code: 'permission-denied' });

    handleSpy.mockRestore();
  });

  it('wrapAsync returns null on failure and forwards context', async () => {
    const { errorHandler, AppError, ErrorType } = await import('../errorHandler');

    const handleSpy = vi.spyOn(errorHandler, 'handle');
    const failing = vi.fn().mockRejectedValue(new Error('Async boom'));

    const result = await errorHandler.wrapAsync(failing, { action: 'save' });

    expect(result).toBeNull();
    expect(handleSpy).toHaveBeenCalledWith(expect.any(AppError));

    const appError = handleSpy.mock.calls[0][0] as InstanceType<typeof AppError>;
    expect(appError.message).toBe('Async boom');
    expect(appError.type).toBe(ErrorType.UNKNOWN);
    expect(appError.context).toEqual({ action: 'save' });
  });

  it('does not throw if sending to Sentry fails', async () => {
    captureExceptionMock.mockImplementation(() => {
      throw new Error('sentry down');
    });

    const { errorHandler, ErrorType } = await import('../errorHandler');

    const report = {
      message: 'Cannot persist',
      type: ErrorType.SERVER,
      timestamp: new Date(),
    };

    expect(() => (errorHandler as any).sendToSentry(report)).not.toThrow();
    expect(mockLogger.error).toHaveBeenCalledWith('Error enviando a Sentry:', expect.any(Error));
  });
});
