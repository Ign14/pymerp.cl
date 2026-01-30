import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('publicweb-seo');

export const withSpan = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
};

