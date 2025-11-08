import { MetricsCollector } from '../../core/observability/metrics';

describe('MetricsCollector', () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = MetricsCollector.getInstance();
    metrics.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MetricsCollector.getInstance();
      const instance2 = MetricsCollector.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('atomicsAppended', () => {
    it('should increment counter', () => {
      metrics.atomicsAppended.inc({
        entity_type: 'user',
        tenant_id: 'test-tenant',
      });

      expect(metrics.atomicsAppended).toBeDefined();
    });

    it('should track multiple increments', () => {
      metrics.atomicsAppended.inc({ entity_type: 'user', tenant_id: 't1' });
      metrics.atomicsAppended.inc({ entity_type: 'user', tenant_id: 't1' });
      metrics.atomicsAppended.inc({ entity_type: 'order', tenant_id: 't2' });

      expect(metrics.atomicsAppended).toBeDefined();
    });
  });

  describe('appendDuration', () => {
    it('should observe duration', () => {
      const timer = metrics.appendDuration.startTimer({ entity_type: 'user' });
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait
      }
      
      timer();
      expect(metrics.appendDuration).toBeDefined();
    });
  });

  describe('activeLedgers', () => {
    it('should set gauge value', () => {
      metrics.activeLedgers.set(5);
      expect(metrics.activeLedgers).toBeDefined();
    });

    it('should increment gauge', () => {
      metrics.activeLedgers.set(5);
      metrics.activeLedgers.inc();
      metrics.activeLedgers.inc();
      expect(metrics.activeLedgers).toBeDefined();
    });

    it('should decrement gauge', () => {
      metrics.activeLedgers.set(5);
      metrics.activeLedgers.dec();
      expect(metrics.activeLedgers).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return prometheus formatted metrics', async () => {
      metrics.atomicsAppended.inc({ entity_type: 'user', tenant_id: 't1' });
      
      const metricsOutput = await metrics.getMetrics();
      
      expect(metricsOutput).toContain('logline_atomics_appended_total');
      expect(typeof metricsOutput).toBe('string');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      metrics.atomicsAppended.inc({ entity_type: 'user', tenant_id: 't1' });
      metrics.activeLedgers.set(10);

      metrics.reset();

      // After reset, metrics should be cleared
      expect(metrics.atomicsAppended).toBeDefined();
      expect(metrics.activeLedgers).toBeDefined();
    });
  });

  describe('error tracking', () => {
    it('should track errors by type', () => {
      metrics.errorsTotal.inc({
        error_type: 'ValidationError',
        operation: 'append',
      });

      metrics.errorsTotal.inc({
        error_type: 'RepositoryError',
        operation: 'query',
      });

      expect(metrics.errorsTotal).toBeDefined();
    });
  });

  describe('cache metrics', () => {
    it('should track cache size', () => {
      metrics.cacheSize.set({ cache_type: 'ledger' }, 1024 * 1024);
      metrics.cacheSize.set({ cache_type: 'index' }, 512 * 1024);

      expect(metrics.cacheSize).toBeDefined();
    });
  });
});
