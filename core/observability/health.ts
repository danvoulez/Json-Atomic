import { logger } from './logger.js';

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Health check result for a component
 */
export interface ComponentHealth {
  status: HealthStatus;
  message?: string;
  lastCheck: Date;
  details?: Record<string, unknown>;
}

/**
 * Overall health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  components: Record<string, ComponentHealth>;
}

/**
 * Health check function type
 */
export type HealthCheckFunction = () => Promise<ComponentHealth>;

/**
 * Health checker for monitoring system health
 */
export class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, HealthCheckFunction>;
  private startTime: number;

  private constructor() {
    this.checks = new Map();
    this.startTime = Date.now();
    this.registerDefaultChecks();
  }

  /**
   * Get the singleton health checker instance
   */
  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  /**
   * Register default health checks
   */
  private registerDefaultChecks(): void {
    // Memory check
    this.registerCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

      let status = HealthStatus.HEALTHY;
      if (heapUsagePercent > 90) {
        status = HealthStatus.UNHEALTHY;
      } else if (heapUsagePercent > 75) {
        status = HealthStatus.DEGRADED;
      }

      return {
        status,
        message: `Heap usage: ${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(2)}MB (${heapUsagePercent.toFixed(2)}%)`,
        lastCheck: new Date(),
        details: {
          heapUsed: heapUsedMB,
          heapTotal: heapTotalMB,
          heapUsagePercent,
          rss: memUsage.rss / 1024 / 1024,
          external: memUsage.external / 1024 / 1024,
        },
      };
    });

    // Event loop lag check
    this.registerCheck('event_loop', async () => {
      const start = Date.now();
      await new Promise((resolve) => setImmediate(resolve));
      const lag = Date.now() - start;

      let status = HealthStatus.HEALTHY;
      if (lag > 100) {
        status = HealthStatus.UNHEALTHY;
      } else if (lag > 50) {
        status = HealthStatus.DEGRADED;
      }

      return {
        status,
        message: `Event loop lag: ${lag}ms`,
        lastCheck: new Date(),
        details: { lag },
      };
    });
  }

  /**
   * Register a health check
   */
  public registerCheck(name: string, checkFn: HealthCheckFunction): void {
    this.checks.set(name, checkFn);
    logger.debug({ msg: 'Health check registered', component: name });
  }

  /**
   * Unregister a health check
   */
  public unregisterCheck(name: string): void {
    this.checks.delete(name);
    logger.debug({ msg: 'Health check unregistered', component: name });
  }

  /**
   * Run a specific health check
   */
  public async checkComponent(name: string): Promise<ComponentHealth> {
    const checkFn = this.checks.get(name);
    if (!checkFn) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Component '${name}' not found`,
        lastCheck: new Date(),
      };
    }

    try {
      return await checkFn();
    } catch (error) {
      logger.error({
        msg: 'Health check failed',
        component: name,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Run all health checks
   */
  public async check(): Promise<HealthCheckResult> {
    const components: Record<string, ComponentHealth> = {};
    let overallStatus = HealthStatus.HEALTHY;

    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.keys()).map(async (name) => {
      const result = await this.checkComponent(name);
      components[name] = result;

      // Update overall status (unhealthy takes precedence over degraded)
      if (result.status === HealthStatus.UNHEALTHY) {
        overallStatus = HealthStatus.UNHEALTHY;
      } else if (
        result.status === HealthStatus.DEGRADED &&
        overallStatus !== HealthStatus.UNHEALTHY
      ) {
        overallStatus = HealthStatus.DEGRADED;
      }
    });

    await Promise.all(checkPromises);

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      components,
    };
  }

  /**
   * Get a simple liveness check (always returns healthy if the process is running)
   */
  public liveness(): { status: HealthStatus; timestamp: Date } {
    return {
      status: HealthStatus.HEALTHY,
      timestamp: new Date(),
    };
  }

  /**
   * Get readiness check (checks if the system is ready to serve requests)
   */
  public async readiness(): Promise<{ status: HealthStatus; timestamp: Date }> {
    const health = await this.check();
    return {
      status: health.status === HealthStatus.UNHEALTHY ? HealthStatus.UNHEALTHY : HealthStatus.HEALTHY,
      timestamp: health.timestamp,
    };
  }
}

/**
 * Convenience function to get the health checker
 */
export const healthChecker = HealthChecker.getInstance();
