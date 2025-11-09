import type { Atomic, ValidationResult } from '../../types.js'

interface Contract {
  id: string
  agent: string
  action: string
  path_pattern?: string
  input_schema?: unknown
  output_schema?: unknown
  policies?: {
    max_duration?: number
    required_tags?: string[]
    allowed_tenants?: string[]
    ttl?: number  // Time to live in seconds
    throttle?: {
      max_calls: number
      window_seconds: number
    }
    circuit_breaker?: {
      error_threshold: number
      timeout_seconds: number
    }
  }
}

/**
 * Policy enforcement results
 */
interface PolicyResult {
  allowed: boolean
  reason?: string
  retry_after?: number
}

/**
 * Contract validator with policy enforcement
 */
export class ContractValidator {
  private contracts: Map<string, Contract> = new Map()
  private throttleState: Map<string, { count: number; window_start: number }> = new Map()
  private circuitState: Map<string, { errors: number; broken_until: number }> = new Map()

  constructor(contracts: Contract[] = []) {
    contracts.forEach(c => this.contracts.set(c.id, c))
  }

  validate(atomic: Atomic): ValidationResult {
    const errors: string[] = []

    // Basic validation
    if (!atomic.entity_type) {
      errors.push('Missing entity_type')
    }

    if (!atomic.this) {
      errors.push('Missing this field')
    }

    if (!atomic.metadata?.trace_id) {
      errors.push('Missing trace_id in metadata')
    }
    
    if (!atomic.did?.actor || !atomic.did?.action) {
      errors.push('Missing or invalid did field (must have actor and action)')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
  
  /**
   * Enforce TTL policy
   */
  enforceTTL(atomic: Atomic, ttl_seconds: number): PolicyResult {
    if (!atomic.metadata?.created_at) {
      return { allowed: false, reason: 'No created_at timestamp' }
    }
    
    const created = new Date(atomic.metadata.created_at).getTime()
    const now = Date.now()
    const age_seconds = (now - created) / 1000
    
    if (age_seconds > ttl_seconds) {
      return {
        allowed: false,
        reason: `Atomic expired (age: ${age_seconds.toFixed(0)}s > ttl: ${ttl_seconds}s)`
      }
    }
    
    return { allowed: true }
  }
  
  /**
   * Enforce throttle policy
   */
  enforceThrottle(
    key: string,
    max_calls: number,
    window_seconds: number
  ): PolicyResult {
    const now = Date.now() / 1000
    const state = this.throttleState.get(key)
    
    if (!state || now - state.window_start > window_seconds) {
      // New window
      this.throttleState.set(key, { count: 1, window_start: now })
      return { allowed: true }
    }
    
    if (state.count >= max_calls) {
      const retry_after = Math.ceil(window_seconds - (now - state.window_start))
      return {
        allowed: false,
        reason: `Throttle limit exceeded (${state.count}/${max_calls} calls)`,
        retry_after
      }
    }
    
    state.count++
    return { allowed: true }
  }
  
  /**
   * Enforce circuit breaker policy
   */
  enforceCircuitBreaker(
    key: string,
    error_threshold: number,
    timeout_seconds: number
  ): PolicyResult {
    const now = Date.now() / 1000
    const state = this.circuitState.get(key)
    
    if (!state) {
      this.circuitState.set(key, { errors: 0, broken_until: 0 })
      return { allowed: true }
    }
    
    // Check if circuit is broken
    if (state.broken_until > now) {
      const retry_after = Math.ceil(state.broken_until - now)
      return {
        allowed: false,
        reason: 'Circuit breaker is open',
        retry_after
      }
    }
    
    // Check error threshold
    if (state.errors >= error_threshold) {
      state.broken_until = now + timeout_seconds
      return {
        allowed: false,
        reason: `Circuit breaker triggered (${state.errors} errors)`,
        retry_after: timeout_seconds
      }
    }
    
    return { allowed: true }
  }
  
  /**
   * Record error for circuit breaker
   */
  recordError(key: string): void {
    const state = this.circuitState.get(key)
    if (state) {
      state.errors++
    } else {
      this.circuitState.set(key, { errors: 1, broken_until: 0 })
    }
  }
  
  /**
   * Record success for circuit breaker (resets error count)
   */
  recordSuccess(key: string): void {
    const state = this.circuitState.get(key)
    if (state) {
      state.errors = 0
      state.broken_until = 0
    }
  }
  
  /**
   * Validate law_test atomics
   */
  validateLawTest(atomic: Atomic): ValidationResult {
    const errors: string[] = []
    
    if (atomic.entity_type !== 'law') {
      errors.push('entity_type must be "law" for law_test intent')
    }
    
    if (atomic.intent !== 'law_test') {
      errors.push('intent must be "law_test"')
    }
    
    // Law tests should have test criteria
    if (!atomic.payload) {
      errors.push('Law test must have payload with test criteria')
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
  
  /**
   * Enforce slow run policy (max duration)
   */
  enforceSlowRun(duration_ms: number, max_duration_ms: number): PolicyResult {
    if (duration_ms > max_duration_ms) {
      return {
        allowed: false,
        reason: `Execution too slow (${duration_ms}ms > ${max_duration_ms}ms limit)`
      }
    }
    return { allowed: true }
  }
}

export const CORE_CONTRACTS: Contract[] = [
  {
    id: 'core_function',
    agent: 'system',
    action: 'execute',
    path_pattern: '/functions/*',
    policies: {
      max_duration: 30000, // 30 seconds
      ttl: 3600 // 1 hour
    }
  },
  {
    id: 'core_law',
    agent: 'system',
    action: 'enforce',
    path_pattern: '/laws/*',
    policies: {
      max_duration: 10000, // 10 seconds
    }
  },
  {
    id: 'core_law_test',
    agent: 'system',
    action: 'test',
    path_pattern: '/laws/*/test',
    policies: {
      max_duration: 5000, // 5 seconds
      throttle: {
        max_calls: 100,
        window_seconds: 60
      }
    }
  }
]