/**
 * apply_policy kernel - Apply computational policies to spans
 */

import type { Span } from '../validator.ts'

export interface PolicyConfig {
  ttl?: string | number  // e.g., "5m" or 300000 (ms)
  slow?: string | number  // e.g., "100ms" or 100
  throttle?: {
    max_requests: number
    window_ms: number
  }
  circuit_breaker?: {
    threshold: number
    timeout_ms: number
  }
}

export interface PolicyResult {
  decision: 'allow' | 'deny'
  reason?: string
  policy_applied: string[]
}

/**
 * Parse time string to milliseconds
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
 */
function applyTTL(span: Span, ttl: string | number, now = Date.now()): PolicyResult {
  const ttlMs = parseTime(ttl)
  const createdAt = span.meta?.created_at as string
  
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
 * Apply slow policy (mark if execution took longer than threshold)
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
 * Apply throttle policy (simple implementation - would need state in production)
 */
function applyThrottle(
  _span: Span,
  config: { max_requests: number; window_ms: number }
): PolicyResult {
  // This is a stub - in production would track request counts
  // For now, always allow but mark as applied
  return {
    decision: 'allow',
    reason: `Throttle policy: ${config.max_requests} req/${config.window_ms}ms (stub)`,
    policy_applied: ['throttle']
  }
}

/**
 * Apply circuit breaker policy (stub)
 */
function applyCircuitBreaker(
  _span: Span,
  _config: { threshold: number; timeout_ms: number }
): PolicyResult {
  // Stub implementation
  return {
    decision: 'allow',
    reason: 'Circuit breaker: closed (stub)',
    policy_applied: ['circuit_breaker']
  }
}

/**
 * Main policy application function
 */
export function applyPolicy(span: Span, config: PolicyConfig, now = Date.now()): PolicyResult {
  const results: PolicyResult[] = []
  
  // Apply TTL if configured
  if (config.ttl) {
    results.push(applyTTL(span, config.ttl, now))
  }
  
  // Apply slow if configured
  if (config.slow) {
    results.push(applySlow(span, config.slow))
  }
  
  // Apply throttle if configured
  if (config.throttle) {
    results.push(applyThrottle(span, config.throttle))
  }
  
  // Apply circuit breaker if configured
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
