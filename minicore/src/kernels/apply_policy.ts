/**
 * apply_policy kernel - Apply computational policies to spans
 */

import type { Span, PolicyConfig, PolicyResult } from '../types.ts'

/**
 * Parse time string to milliseconds
 * Supports: "100ms", "5s", "10m", "2h" or raw numbers
 * 
 * @param time - Time string or number in milliseconds
 * @returns Time in milliseconds
 */
function parseTime(time: string | number): number {
  if (typeof time === 'number') return time
  
  const match = time.match(/^(\d+)(ms|s|m|h)?$/)
  if (!match) return 0
  
  const value = parseInt(match[1])
  const unit = match[2] || 'ms'
  
  const multipliers: Record<string, number> = {
    'ms': 1,
    's': 1000,
    'm': 60000,
    'h': 3600000
  }
  
  return value * (multipliers[unit] || 1)
}

/**
 * Apply TTL (Time To Live) policy
 * Denies spans that are older than the specified TTL
 * 
 * @param span - Span to check
 * @param ttl - Time to live
 * @param now - Current timestamp (for testing)
 * @returns Policy result
 */
function applyTTL(span: Span, ttl: string | number, now = Date.now()): PolicyResult {
  const ttlMs = parseTime(ttl)
  const createdAt = span.meta?.created_at as string | undefined
  
  if (!createdAt) {
    return {
      decision: 'deny',
      reason: 'Span has no created_at timestamp',
      policy_applied: ['ttl']
    }
  }
  
  const spanTime = new Date(createdAt).getTime()
  const age = now - spanTime
  
  if (age > ttlMs) {
    return {
      decision: 'deny',
      reason: `Span expired (age: ${age}ms, ttl: ${ttlMs}ms)`,
      policy_applied: ['ttl']
    }
  }
  
  return {
    decision: 'allow',
    policy_applied: ['ttl']
  }
}

/**
 * Apply slow policy
 * Marks spans that took longer than the threshold but doesn't deny them
 * 
 * @param span - Span to check
 * @param slow - Slow threshold
 * @returns Policy result
 */
function applySlow(span: Span, slow: string | number): PolicyResult {
  const slowMs = parseTime(slow)
  const durationMs = span.duration_ms || 0
  
  if (durationMs > slowMs) {
    return {
      decision: 'allow',
      reason: `Slow execution detected (${durationMs}ms > ${slowMs}ms)`,
      policy_applied: ['slow']
    }
  }
  
  return {
    decision: 'allow',
    policy_applied: ['slow']
  }
}

/**
 * Apply throttle policy
 * Stub implementation - in production would need persistent state
 * 
 * @param _span - Span (unused in stub)
 * @param config - Throttle configuration
 * @returns Policy result
 */
function applyThrottle(
  _span: Span,
  config: { max_requests: number; window_ms: number }
): PolicyResult {
  // Stub - in production would track request counts in a store
  return {
    decision: 'allow',
    reason: `Throttle policy: ${config.max_requests} req/${config.window_ms}ms (stub)`,
    policy_applied: ['throttle']
  }
}

/**
 * Apply circuit breaker policy
 * Stub implementation - in production would need persistent state
 * 
 * @param _span - Span (unused in stub)
 * @param _config - Circuit breaker configuration
 * @returns Policy result
 */
function applyCircuitBreaker(
  _span: Span,
  _config: { threshold: number; timeout_ms: number }
): PolicyResult {
  // Stub - in production would track failure counts and circuit state
  return {
    decision: 'allow',
    reason: 'Circuit breaker: closed (stub)',
    policy_applied: ['circuit_breaker']
  }
}

/**
 * Apply all configured policies to a span
 * 
 * @param span - Span to apply policies to
 * @param config - Policy configuration
 * @param now - Current timestamp (for testing)
 * @returns Combined policy result
 */
export function applyPolicy(
  span: Span,
  config: PolicyConfig,
  now = Date.now()
): PolicyResult {
  const results: PolicyResult[] = []
  
  // Apply each configured policy
  if (config.ttl) {
    results.push(applyTTL(span, config.ttl, now))
  }
  
  if (config.slow) {
    results.push(applySlow(span, config.slow))
  }
  
  if (config.throttle) {
    results.push(applyThrottle(span, config.throttle))
  }
  
  if (config.circuit_breaker) {
    results.push(applyCircuitBreaker(span, config.circuit_breaker))
  }
  
  // If no policies configured, allow
  if (results.length === 0) {
    return {
      decision: 'allow',
      policy_applied: []
    }
  }
  
  // If any policy denies, deny the span
  const denied = results.find(r => r.decision === 'deny')
  if (denied) {
    return denied
  }
  
  // All policies allow - merge results
  const allPolicies = results.flatMap(r => r.policy_applied)
  const reasons = results.map(r => r.reason).filter(Boolean)
  
  return {
    decision: 'allow',
    reason: reasons.length > 0 ? reasons.join('; ') : undefined,
    policy_applied: allPolicies
  }
}
