import pino from 'pino';
import { config } from '../config/index.js';

/**
 * Structured logger using Pino for Node.js environments
 * Provides JSON-formatted logs with configurable levels and pretty printing for development
 */
export class Logger {
  private static instance: pino.Logger;

  /**
   * Get the singleton logger instance
   */
  public static getInstance(): pino.Logger {
    if (!Logger.instance) {
      const pinoConfig: pino.LoggerOptions = {
        level: config.observability.logLevel,
        base: {
          service: 'logline-os',
          environment: config.app.environment,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      };

      // Pretty print for development
      if (config.app.environment === 'development') {
        Logger.instance = pino({
          ...pinoConfig,
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        });
      } else {
        Logger.instance = pino(pinoConfig);
      }
    }

    return Logger.instance;
  }

  /**
   * Create a child logger with additional context
   */
  public static child(bindings: pino.Bindings): pino.Logger {
    return Logger.getInstance().child(bindings);
  }

  /**
   * Log with trace context
   */
  public static withTrace(traceId: string, bindings?: pino.Bindings): pino.Logger {
    return Logger.child({ traceId, ...bindings });
  }
}

/**
 * Convenience function to get the logger
 */
export const logger = Logger.getInstance();

/**
 * Export types for use in other modules
 */
export type { Logger as PinoLogger } from 'pino';
