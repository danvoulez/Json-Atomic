/**
 * Environment configuration utilities
 * Browser and edge runtime compatible (no Node.js-specific APIs)
 */

import type { EnvironmentConfig } from './types.ts'

/**
 * Get environment variable value
 * Works in Deno, Node.js, and browsers (with limitations)
 * 
 * @param key - Environment variable name
 * @param defaultValue - Default value if not found
 * @returns Environment variable value or default
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  // Try Deno
  if (typeof Deno !== 'undefined' && Deno.env) {
    try {
      return Deno.env.get(key) || defaultValue
    } catch {
      return defaultValue
    }
  }
  
  // Try Node.js/process
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue
  }
  
  // Browser - no environment variables
  return defaultValue
}

/**
 * Get all environment variables as an object
 * Limited to Deno and Node.js environments
 * 
 * @returns Environment variables object
 */
export function getAllEnv(): Record<string, string> {
  // Try Deno
  if (typeof Deno !== 'undefined' && Deno.env) {
    try {
      return Deno.env.toObject()
    } catch {
      return {}
    }
  }
  
  // Try Node.js/process
  if (typeof process !== 'undefined' && process.env) {
    return { ...process.env } as Record<string, string>
  }
  
  // Browser - no environment variables
  return {}
}

/**
 * Create environment configuration from environment variables
 * Reads MINICORE_* prefixed variables
 * 
 * @returns Environment configuration
 */
export function loadEnvConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    env: getEnv('NODE_ENV') || getEnv('DENO_ENV') || 'development'
  }
  
  // Load MINICORE_* variables
  const allEnv = getAllEnv()
  for (const [key, value] of Object.entries(allEnv)) {
    if (key.startsWith('MINICORE_')) {
      const configKey = key.substring(9).toLowerCase()
      config[configKey] = value
    }
  }
  
  return config
}

/**
 * Check if running in browser environment
 * 
 * @returns True if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Check if running in Deno environment
 * 
 * @returns True if running in Deno
 */
export function isDeno(): boolean {
  return typeof Deno !== 'undefined'
}

/**
 * Check if running in Node.js environment
 * 
 * @returns True if running in Node.js
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null
}

/**
 * Get runtime environment name
 * 
 * @returns Runtime name ("deno", "node", "browser", or "unknown")
 */
export function getRuntime(): 'deno' | 'node' | 'browser' | 'unknown' {
  if (isDeno()) return 'deno'
  if (isNode()) return 'node'
  if (isBrowser()) return 'browser'
  return 'unknown'
}
