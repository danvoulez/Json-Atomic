import { TraceId } from '../domain/value-objects/TraceId.js';
import { logger } from './logger.js';

/**
 * Trace context for distributed tracing
 */
export interface TraceContext {
  traceId: TraceId;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

/**
 * Span for tracing operations
 */
export class Span {
  private context: TraceContext;
  private finished: boolean = false;

  constructor(
    traceId: TraceId,
    operation: string,
    parentSpanId?: string,
    metadata?: Record<string, unknown>
  ) {
    this.context = {
      traceId,
      spanId: this.generateSpanId(),
      parentSpanId,
      operation,
      startTime: Date.now(),
      metadata,
    };

    logger.debug({
      msg: 'Span started',
      traceId: this.context.traceId.toString(),
      spanId: this.context.spanId,
      operation: this.context.operation,
    });
  }

  /**
   * Generate a unique span ID
   */
  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Set an attribute on the span
   */
  public setAttribute(key: string, value: unknown): void {
    if (!this.context.metadata) {
      this.context.metadata = {};
    }
    this.context.metadata[key] = value;
  }

  /**
   * Record an event in the span
   */
  public addEvent(name: string, attributes?: Record<string, unknown>): void {
    logger.debug({
      msg: 'Span event',
      traceId: this.context.traceId.toString(),
      spanId: this.context.spanId,
      event: name,
      attributes,
    });
  }

  /**
   * Record an error in the span
   */
  public recordError(error: Error): void {
    logger.error({
      msg: 'Span error',
      traceId: this.context.traceId.toString(),
      spanId: this.context.spanId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }

  /**
   * Get the trace context
   */
  public getContext(): TraceContext {
    return this.context;
  }

  /**
   * Finish the span
   */
  public finish(): void {
    if (this.finished) {
      return;
    }

    const duration = Date.now() - this.context.startTime;
    this.finished = true;

    logger.debug({
      msg: 'Span finished',
      traceId: this.context.traceId.toString(),
      spanId: this.context.spanId,
      operation: this.context.operation,
      duration,
      metadata: this.context.metadata,
    });
  }
}

/**
 * Tracer for creating and managing spans
 */
export class Tracer {
  private static instance: Tracer;

  private constructor() {}

  /**
   * Get the singleton tracer instance
   */
  public static getInstance(): Tracer {
    if (!Tracer.instance) {
      Tracer.instance = new Tracer();
    }
    return Tracer.instance;
  }

  /**
   * Start a new trace with a root span
   */
  public startTrace(operation: string, metadata?: Record<string, unknown>): Span {
    const traceId = TraceId.generate();
    return new Span(traceId, operation, undefined, metadata);
  }

  /**
   * Start a child span from a parent span
   */
  public startSpan(
    parentSpan: Span,
    operation: string,
    metadata?: Record<string, unknown>
  ): Span {
    const parentContext = parentSpan.getContext();
    return new Span(
      parentContext.traceId,
      operation,
      parentContext.spanId,
      metadata
    );
  }

  /**
   * Execute a function within a traced span
   */
  public async trace<T>(
    operation: string,
    fn: (span: Span) => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const span = this.startTrace(operation, metadata);
    try {
      const result = await fn(span);
      span.finish();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordError(error);
      }
      span.finish();
      throw error;
    }
  }

  /**
   * Execute a function within a child span
   */
  public async traceChild<T>(
    parentSpan: Span,
    operation: string,
    fn: (span: Span) => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const span = this.startSpan(parentSpan, operation, metadata);
    try {
      const result = await fn(span);
      span.finish();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordError(error);
      }
      span.finish();
      throw error;
    }
  }
}

/**
 * Convenience function to get the tracer
 */
export const tracer = Tracer.getInstance();
