/**
 * Observability module - Logging, Metrics, Tracing, and Health Checks
 * 
 * This module provides comprehensive observability for the JSON✯Atomic platform:
 * - Structured logging with Pino
 * - Metrics collection with Prometheus
 * - Distributed tracing
 * - Health checks for system components
 */

export { Logger, logger, type PinoLogger } from './logger.js';
export { MetricsCollector, metrics } from './metrics.js';
export { Tracer, Span, tracer, type TraceContext } from './tracing.js';
export {
  HealthChecker,
  healthChecker,
  HealthStatus,
  type ComponentHealth,
  type HealthCheckResult,
  type HealthCheckFunction,
} from './health.js';
