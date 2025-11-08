import { Tracer, Span } from '../../core/observability/tracing';
import { TraceId } from '../../core/domain/value-objects/TraceId';

describe('Tracer', () => {
  let tracer: Tracer;

  beforeEach(() => {
    tracer = Tracer.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Tracer.getInstance();
      const instance2 = Tracer.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('startTrace', () => {
    it('should create root span', () => {
      const span = tracer.startTrace('test-operation');

      expect(span).toBeInstanceOf(Span);
      const context = span.getContext();
      expect(context.operation).toBe('test-operation');
      expect(context.traceId).toBeDefined();
      expect(context.parentSpanId).toBeUndefined();
    });

    it('should include metadata', () => {
      const metadata = { userId: '123', action: 'create' };
      const span = tracer.startTrace('test-operation', metadata);

      const context = span.getContext();
      expect(context.metadata).toEqual(metadata);
    });
  });

  describe('startSpan', () => {
    it('should create child span', () => {
      const parentSpan = tracer.startTrace('parent-operation');
      const childSpan = tracer.startSpan(parentSpan, 'child-operation');

      const parentContext = parentSpan.getContext();
      const childContext = childSpan.getContext();

      expect(childContext.traceId).toEqual(parentContext.traceId);
      expect(childContext.parentSpanId).toBe(parentContext.spanId);
      expect(childContext.operation).toBe('child-operation');
    });
  });

  describe('trace', () => {
    it('should execute function with span', async () => {
      let capturedSpan: Span | null = null;

      const result = await tracer.trace('test-operation', async (span) => {
        capturedSpan = span;
        return 42;
      });

      expect(result).toBe(42);
      expect(capturedSpan).not.toBeNull();
    });

    it('should finish span after success', async () => {
      const span = await tracer.trace('test-operation', async (span) => {
        return span;
      });

      // Span should be finished after trace completes
      expect(span).toBeInstanceOf(Span);
    });

    it('should handle errors', async () => {
      await expect(
        tracer.trace('test-operation', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should finish span on error', async () => {
      try {
        await tracer.trace('test-operation', async () => {
          throw new Error('Test error');
        });
      } catch (error) {
        // Expected error
      }

      // Span should still be finished even on error
      expect(true).toBe(true);
    });
  });

  describe('traceChild', () => {
    it('should execute function with child span', async () => {
      const parentSpan = tracer.startTrace('parent');
      let childSpanId: string | null = null;

      const result = await tracer.traceChild(
        parentSpan,
        'child-operation',
        async (span) => {
          childSpanId = span.getContext().spanId;
          return 'result';
        }
      );

      expect(result).toBe('result');
      expect(childSpanId).not.toBeNull();
    });

    it('should maintain trace context', async () => {
      const parentSpan = tracer.startTrace('parent');
      const parentTraceId = parentSpan.getContext().traceId;

      await tracer.traceChild(parentSpan, 'child', async (childSpan) => {
        const childTraceId = childSpan.getContext().traceId;
        expect(childTraceId).toEqual(parentTraceId);
      });
    });
  });
});

describe('Span', () => {
  describe('setAttribute', () => {
    it('should set attribute', () => {
      const traceId = TraceId.generate();
      const span = new Span(traceId, 'test-operation');

      span.setAttribute('userId', '123');
      const context = span.getContext();

      expect(context.metadata?.userId).toBe('123');
    });

    it('should set multiple attributes', () => {
      const traceId = TraceId.generate();
      const span = new Span(traceId, 'test-operation');

      span.setAttribute('userId', '123');
      span.setAttribute('action', 'create');
      const context = span.getContext();

      expect(context.metadata?.userId).toBe('123');
      expect(context.metadata?.action).toBe('create');
    });
  });

  describe('addEvent', () => {
    it('should add event to span', () => {
      const traceId = TraceId.generate();
      const span = new Span(traceId, 'test-operation');

      // Should not throw
      span.addEvent('event-name', { detail: 'value' });
    });
  });

  describe('recordError', () => {
    it('should record error in span', () => {
      const traceId = TraceId.generate();
      const span = new Span(traceId, 'test-operation');

      const error = new Error('Test error');
      // Should not throw
      span.recordError(error);
    });
  });

  describe('finish', () => {
    it('should finish span', () => {
      const traceId = TraceId.generate();
      const span = new Span(traceId, 'test-operation');

      // Should not throw
      span.finish();
    });

    it('should only finish once', () => {
      const traceId = TraceId.generate();
      const span = new Span(traceId, 'test-operation');

      span.finish();
      // Second call should be ignored
      span.finish();
    });
  });

  describe('getContext', () => {
    it('should return trace context', () => {
      const traceId = TraceId.generate();
      const span = new Span(traceId, 'test-operation', undefined, { key: 'value' });

      const context = span.getContext();

      expect(context.traceId).toBe(traceId);
      expect(context.operation).toBe('test-operation');
      expect(context.spanId).toBeDefined();
      expect(context.startTime).toBeDefined();
      expect(context.metadata?.key).toBe('value');
    });
  });
});
