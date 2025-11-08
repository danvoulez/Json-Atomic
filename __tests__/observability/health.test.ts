import { HealthChecker, HealthStatus } from '../../core/observability/health';

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    healthChecker = HealthChecker.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = HealthChecker.getInstance();
      const instance2 = HealthChecker.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('liveness', () => {
    it('should always return healthy', () => {
      const result = healthChecker.liveness();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('readiness', () => {
    it('should return health status', async () => {
      const result = await healthChecker.readiness();

      expect(result.status).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('check', () => {
    it('should run all health checks', async () => {
      const result = await healthChecker.check();

      expect(result.status).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.components).toBeDefined();
    });

    it('should include default checks', async () => {
      const result = await healthChecker.check();

      expect(result.components.memory).toBeDefined();
      expect(result.components.event_loop).toBeDefined();
    });

    it('should have valid memory check', async () => {
      const result = await healthChecker.check();
      const memoryCheck = result.components.memory;

      expect(memoryCheck.status).toBeDefined();
      expect(memoryCheck.lastCheck).toBeInstanceOf(Date);
      expect(memoryCheck.details).toBeDefined();
    });

    it('should have valid event loop check', async () => {
      const result = await healthChecker.check();
      const eventLoopCheck = result.components.event_loop;

      expect(eventLoopCheck.status).toBeDefined();
      expect(eventLoopCheck.lastCheck).toBeInstanceOf(Date);
      expect(eventLoopCheck.details).toBeDefined();
    });
  });

  describe('custom checks', () => {
    it('should register custom check', async () => {
      healthChecker.registerCheck('test', async () => ({
        status: HealthStatus.HEALTHY,
        message: 'Test is healthy',
        lastCheck: new Date(),
      }));

      const result = await healthChecker.check();
      expect(result.components.test).toBeDefined();
      expect(result.components.test.status).toBe(HealthStatus.HEALTHY);
    });

    it('should unregister custom check', async () => {
      healthChecker.registerCheck('test', async () => ({
        status: HealthStatus.HEALTHY,
        message: 'Test is healthy',
        lastCheck: new Date(),
      }));

      healthChecker.unregisterCheck('test');

      const result = await healthChecker.check();
      expect(result.components.test).toBeUndefined();
    });

    it('should handle failing check', async () => {
      healthChecker.registerCheck('failing', async () => ({
        status: HealthStatus.UNHEALTHY,
        message: 'Service is down',
        lastCheck: new Date(),
      }));

      const result = await healthChecker.check();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.components.failing.status).toBe(HealthStatus.UNHEALTHY);
    });

    it('should handle degraded check', async () => {
      healthChecker.registerCheck('degraded', async () => ({
        status: HealthStatus.DEGRADED,
        message: 'Service is slow',
        lastCheck: new Date(),
      }));

      const result = await healthChecker.check();
      // Overall status should be degraded if no unhealthy components
      expect(result.components.degraded.status).toBe(HealthStatus.DEGRADED);
    });

    it('should handle check that throws error', async () => {
      healthChecker.registerCheck('error', async () => {
        throw new Error('Check failed');
      });

      const result = await healthChecker.checkComponent('error');
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toBe('Check failed');
    });
  });

  describe('checkComponent', () => {
    it('should check single component', async () => {
      const result = await healthChecker.checkComponent('memory');

      expect(result.status).toBeDefined();
      expect(result.lastCheck).toBeInstanceOf(Date);
    });

    it('should return unhealthy for non-existent component', async () => {
      const result = await healthChecker.checkComponent('nonexistent');

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toContain('not found');
    });
  });
});
