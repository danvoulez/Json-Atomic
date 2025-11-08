/**
 * Configuration system with environment validation
 */

import { z } from 'zod'

const ConfigSchema = z.object({
  app: z.object({
    environment: z.enum(['development', 'staging', 'production', 'test']).default('production'),
    name: z.string().default('logline-os'),
  }),
  database: z.object({
    url: z.string().optional(),
    poolSize: z.number().min(1).max(100).default(10),
    connectionTimeout: z.number().min(1000).default(5000),
  }),
  ledger: z.object({
    path: z.string().default('./data/ledger.jsonl'),
    rotationPolicy: z.enum(['daily', 'weekly', 'monthly', 'size']).default('monthly'),
    maxSizeBytes: z.number().optional(),
  }),
  security: z.object({
    apiKey: z.string().min(8).optional(),
    jwtSecret: z.string().min(32).optional(),
    bcryptRounds: z.number().min(10).max(20).default(12),
    rateLimitWindow: z.number().default(60000),
    rateLimitMaxRequests: z.number().default(100),
    signingKeyHex: z.string().optional(),
    publicKeyHex: z.string().optional(),
  }),
  observability: z.object({
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    metricsPort: z.number().default(9090),
    tracingEnabled: z.boolean().default(false),
  }),
  server: z.object({
    port: z.number().min(1).max(65535).default(8000),
    host: z.string().default('0.0.0.0'),
  }),
})

export type Config = z.infer<typeof ConfigSchema>

/**
 * Load and validate configuration from environment
 */
export function loadConfig(): Config {
  const rawConfig = {
    app: {
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production' | 'test') || 'production',
      name: process.env.APP_NAME || 'logline-os',
    },
    database: {
      url: process.env.DATABASE_URL,
      poolSize: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE) : undefined,
      connectionTimeout: process.env.DB_TIMEOUT ? parseInt(process.env.DB_TIMEOUT) : undefined,
    },
    ledger: {
      path: process.env.LEDGER_PATH || './data/ledger.jsonl',
      rotationPolicy: process.env.LEDGER_ROTATION || 'monthly',
      maxSizeBytes: process.env.LEDGER_MAX_SIZE ? parseInt(process.env.LEDGER_MAX_SIZE) : undefined,
    },
    security: {
      apiKey: process.env.API_KEY,
      jwtSecret: process.env.JWT_SECRET,
      bcryptRounds: process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : undefined,
      rateLimitWindow: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : undefined,
      rateLimitMaxRequests: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : undefined,
      signingKeyHex: process.env.SIGNING_KEY_HEX,
      publicKeyHex: process.env.PUBLIC_KEY_HEX,
    },
    observability: {
      logLevel: process.env.LOG_LEVEL || 'info',
      metricsPort: process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT) : undefined,
      tracingEnabled: process.env.TRACING_ENABLED === 'true',
    },
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
      host: process.env.HOST,
    },
  }

  const result = ConfigSchema.safeParse(rawConfig)

  if (!result.success) {
    console.error('Configuration validation failed:')
    console.error(result.error.format())
    throw new Error('Invalid configuration')
  }

  return result.data
}

// Singleton instance
let configInstance: Config | null = null

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig()
  }
  return configInstance
}

// Reset config (useful for testing)
export function resetConfig(): void {
  configInstance = null
}

// Export a getter that returns config when accessed
// This delays config loading until it's actually needed
export const config = new Proxy({} as Config, {
  get(_target, prop) {
    return getConfig()[prop as keyof Config]
  }
})

