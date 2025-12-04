import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useState } from 'react';

const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
};

const captureExceptionMock = vi.fn();

vi.mock('../../utils/logger', () => ({
  logger: mockLogger,
}));

vi.mock('../../config/sentry', () => ({
  captureException: captureExceptionMock,
}));

const Thrower = () => {
  throw new Error('Boom');
};

const Safe = () => <div>Safe content</div>;

const originalEnv = { ...import.meta.env };

const setEnv = (values: Record<string, any>) => {
  Object.defineProperty(import.meta, 'env', {
    value: { ...import.meta.env, ...values },
    writable: true,
    configurable: true,
  });
};

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ErrorBoundary', () => {
  test('renders children when there is no error', async () => {
    setEnv({ DEV: true, MODE: 'development' });
    const ErrorBoundary = (await import('../ErrorBoundary')).default;

    render(
      <ErrorBoundary>
        <Safe />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  test('renders custom fallback and calls onError callback', async () => {
    setEnv({ DEV: true, MODE: 'development' });
    const ErrorBoundary = (await import('../ErrorBoundary')).default;

    const onError = vi.fn();

    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>} onError={onError}>
        <Thrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });

  test('shows debug info in development and can recover after reset', async () => {
    setEnv({ DEV: true, MODE: 'development' });
    const ErrorBoundary = (await import('../ErrorBoundary')).default;

    const Buggy = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Kaboom');
      }
      return <div>Recovered</div>;
    };

    const Harness = () => {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Resolve</button>
          <ErrorBoundary>
            <Buggy shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      );
    };

    render(<Harness />);

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText(/Kaboom/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Resolve'));
    fireEvent.click(screen.getByText('Intentar de nuevo'));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  test('does not send Sentry events during development', async () => {
    setEnv({ DEV: true, MODE: 'development' });
    const ErrorBoundary = (await import('../ErrorBoundary')).default;

    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>,
    );

    expect(captureExceptionMock).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });
});

export {};

export {};
