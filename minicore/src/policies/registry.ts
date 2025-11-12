/**
 * Policy registry with deterministic ordering
 * Central registry for all available policies with metadata
 *
 * @module
 */

import type { Span, PolicyConfig, PolicyResult } from '../types.ts'
import { applyPolicy } from '../kernels/apply_policy.ts'

/**
 * Policy metadata for UI and documentation
 */
export interface PolicyMetadata {
  /** Policy identifier */
  id: string
  /** Display name */
  name: string
  /** Description of what the policy does */
  description: string
  /** Default configuration */
  defaultConfig: Record<string, unknown>
  /** Whether this policy can deny execution */
  canDeny: boolean
  /** Recommended execution order (lower = earlier) */
  order: number
}

/**
 * Registry of all available policies
 */
export const POLICY_REGISTRY: Record<string, PolicyMetadata> = {
  ttl: {
    id: 'ttl',
    name: 'Time To Live',
    description: 'Rejects spans older than the specified age',
    defaultConfig: { ttl: '5m' },
    canDeny: true,
    order: 1
  },
  slow: {
    id: 'slow',
    name: 'Slow Detection',
    description: 'Marks spans that exceed execution time threshold',
    defaultConfig: { slow: '100ms' },
    canDeny: false,
    order: 2
  },
  throttle: {
    id: 'throttle',
    name: 'Rate Limiting',
    description: 'Limits request rate within a time window',
    defaultConfig: {
      throttle: { max_requests: 100, window_ms: 60000 }
    },
    canDeny: true,
    order: 3
  },
  circuit_breaker: {
    id: 'circuit_breaker',
    name: 'Circuit Breaker',
    description: 'Opens circuit after threshold failures',
    defaultConfig: {
      circuit_breaker: { threshold: 5, timeout_ms: 30000 }
    },
    canDeny: true,
    order: 4
  }
}

/**
 * Get default policy order based on registry metadata
 *
 * @returns Array of policy IDs in recommended order
 */
export function getDefaultPolicyOrder(): string[] {
  return Object.values(POLICY_REGISTRY)
    .sort((a, b) => a.order - b.order)
    .map((p) => p.id)
}

/**
 * Get policy metadata by ID
 *
 * @param policyId - Policy identifier
 * @returns Policy metadata or undefined if not found
 */
export function getPolicyMetadata(policyId: string): PolicyMetadata | undefined {
  return POLICY_REGISTRY[policyId]
}

/**
 * Get all registered policies
 *
 * @returns Array of all policy metadata
 */
export function getAllPolicies(): PolicyMetadata[] {
  return Object.values(POLICY_REGISTRY).sort((a, b) => a.order - b.order)
}

/**
 * Validate policy configuration
 *
 * @param config - Policy configuration to validate
 * @returns Validation result with errors if any
 */
export function validatePolicyConfig(config: PolicyConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate TTL format
  if (config.ttl !== undefined) {
    const ttl = config.ttl
    if (typeof ttl !== 'number' && typeof ttl !== 'string') {
      errors.push('ttl must be a number or string')
    } else if (typeof ttl === 'string' && !/^\d+(ms|s|m|h)$/.test(ttl)) {
      errors.push('ttl string must match format: <number>(ms|s|m|h)')
    }
  }

  // Validate slow format
  if (config.slow !== undefined) {
    const slow = config.slow
    if (typeof slow !== 'number' && typeof slow !== 'string') {
      errors.push('slow must be a number or string')
    } else if (typeof slow === 'string' && !/^\d+(ms|s|m|h)$/.test(slow)) {
      errors.push('slow string must match format: <number>(ms|s|m|h)')
    }
  }

  // Validate throttle
  if (config.throttle !== undefined) {
    const throttle = config.throttle
    if (
      typeof throttle !== 'object' ||
      throttle === null ||
      typeof throttle.max_requests !== 'number' ||
      typeof throttle.window_ms !== 'number'
    ) {
      errors.push('throttle must be { max_requests: number, window_ms: number }')
    } else if (throttle.max_requests <= 0 || throttle.window_ms <= 0) {
      errors.push('throttle values must be positive')
    }
  }

  // Validate circuit_breaker
  if (config.circuit_breaker !== undefined) {
    const cb = config.circuit_breaker
    if (
      typeof cb !== 'object' ||
      cb === null ||
      typeof cb.threshold !== 'number' ||
      typeof cb.timeout_ms !== 'number'
    ) {
      errors.push('circuit_breaker must be { threshold: number, timeout_ms: number }')
    } else if (cb.threshold <= 0 || cb.timeout_ms <= 0) {
      errors.push('circuit_breaker values must be positive')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Apply policies in deterministic order
 *
 * @param span - Span to apply policies to
 * @param config - Policy configuration
 * @param order - Explicit policy order (optional, uses default if not provided)
 * @param now - Current timestamp for testing
 * @returns Policy result with applied policies in order
 */
export function applyPoliciesInOrder(
  span: Span,
  config: PolicyConfig,
  order?: string[],
  now?: number
): PolicyResult {
  const policyOrder = order ?? getDefaultPolicyOrder()

  // Filter to only policies that are configured
  const applicablePolicies = policyOrder.filter((policyId) => {
    return config[policyId as keyof PolicyConfig] !== undefined
  })

  // If no policies configured, allow
  if (applicablePolicies.length === 0) {
    return {
      decision: 'allow',
      policy_applied: []
    }
  }

  // Apply using the existing applyPolicy function which handles all policies
  // The order doesn't affect the result since policies are independent,
  // but we track the order for determinism verification
  const result = applyPolicy(span, config, now)

  // Ensure policy_applied reflects the specified order
  result.policy_applied = applicablePolicies.filter((p) =>
    result.policy_applied.includes(p)
  )

  return result
}

/**
 * Create policy configuration from UI inputs
 * Converts string inputs to proper PolicyConfig format
 *
 * @param inputs - Policy inputs from UI
 * @returns Policy configuration
 */
export function createPolicyConfig(inputs: {
  ttl?: string
  slow?: string
  throttle?: { max_requests: number; window_ms: number }
  circuit_breaker?: { threshold: number; timeout_ms: number }
}): PolicyConfig {
  const config: PolicyConfig = {}

  if (inputs.ttl) {
    config.ttl = inputs.ttl
  }

  if (inputs.slow) {
    config.slow = inputs.slow
  }

  if (inputs.throttle) {
    config.throttle = inputs.throttle
  }

  if (inputs.circuit_breaker) {
    config.circuit_breaker = inputs.circuit_breaker
  }

  return config
}

/**
 * Simulate policy application without executing span
 * Useful for Policy Studio preview
 *
 * @param span - Span to simulate (can be partial/mock)
 * @param config - Policy configuration
 * @param order - Policy execution order
 * @returns Simulated policy result
 */
export function simulatePolicy(
  span: Partial<Span>,
  config: PolicyConfig,
  order?: string[]
): PolicyResult & { metrics: PolicyMetrics } {
  // Create mock span with defaults
  const mockSpan: Span = {
    type: 'execution',
    kind: span.kind ?? 'run_code',
    input: span.input ?? {},
    status: 'pending',
    duration_ms: span.duration_ms ?? 0,
    meta: {
      created_at: span.meta?.created_at ?? new Date().toISOString(),
      ...span.meta
    }
  }

  const startTime = Date.now()
  const result = applyPoliciesInOrder(mockSpan, config, order)
  const evaluationTime = Date.now() - startTime

  return {
    ...result,
    metrics: {
      evaluationTime,
      policiesEvaluated: result.policy_applied.length,
      canDeny: result.policy_applied.some((p) => POLICY_REGISTRY[p]?.canDeny ?? false)
    }
  }
}

/**
 * Metrics from policy evaluation
 */
export interface PolicyMetrics {
  /** Time taken to evaluate policies (ms) */
  evaluationTime: number
  /** Number of policies evaluated */
  policiesEvaluated: number
  /** Whether any deny-capable policy was applied */
  canDeny: boolean
}
