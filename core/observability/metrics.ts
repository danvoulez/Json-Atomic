import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { config } from '../config/index.js';

/**
 * Metrics collector using Prometheus client
 * Provides standardized metrics for monitoring application health and performance
 */
export class MetricsCollector {
  private static instance: MetricsCollector;
  private registry: Registry;

  // Counters
  public atomicsAppended: Counter;
  public atomicsQueried: Counter;
  public errorsTotal: Counter;

  // Histograms
  public appendDuration: Histogram;
  public queryDuration: Histogram;
  public verificationDuration: Histogram;

  // Gauges
  public activeLedgers: Gauge;
  public cacheSize: Gauge;

  private constructor() {
    this.registry = new Registry();

    // Set default labels
    this.registry.setDefaultLabels({
      app: config.app.name,
      environment: config.app.environment,
    });

    // Initialize metrics
    this.atomicsAppended = new Counter({
      name: 'logline_atomics_appended_total',
      help: 'Total number of atomics appended to ledger',
      labelNames: ['entity_type', 'tenant_id'],
      registers: [this.registry],
    });

    this.atomicsQueried = new Counter({
      name: 'logline_atomics_queried_total',
      help: 'Total number of atomic queries executed',
      labelNames: ['query_type'],
      registers: [this.registry],
    });

    this.errorsTotal = new Counter({
      name: 'logline_errors_total',
      help: 'Total number of errors',
      labelNames: ['error_type', 'operation'],
      registers: [this.registry],
    });

    this.appendDuration = new Histogram({
      name: 'logline_append_duration_seconds',
      help: 'Duration of append operations',
      labelNames: ['entity_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.queryDuration = new Histogram({
      name: 'logline_query_duration_seconds',
      help: 'Duration of query operations',
      labelNames: ['query_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.verificationDuration = new Histogram({
      name: 'logline_verification_duration_seconds',
      help: 'Duration of ledger verification',
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
      registers: [this.registry],
    });

    this.activeLedgers = new Gauge({
      name: 'logline_active_ledgers',
      help: 'Number of active ledger files',
      registers: [this.registry],
    });

    this.cacheSize = new Gauge({
      name: 'logline_cache_size_bytes',
      help: 'Size of in-memory cache in bytes',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });
  }

  /**
   * Get the singleton metrics collector instance
   */
  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Get the Prometheus registry for scraping
   */
  public getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  public reset(): void {
    this.registry.resetMetrics();
  }
}

/**
 * Convenience function to get the metrics collector
 */
export const metrics = MetricsCollector.getInstance();
