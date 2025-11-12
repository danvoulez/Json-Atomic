/**
 * Deterministic replay controller for Minicore
 *
 * Provides:
 * - Seeded RNG for deterministic execution
 * - Fixed clock for time-sensitive operations
 * - Policy order enforcement
 * - Environment fingerprinting
 *
 * @module
 */

import type { Span, ExecutionResult, MinicoreConfig, PolicyConfig } from './types.ts'
import { executeSpan } from './runner.ts'

/**
 * Replay configuration for deterministic execution
 */
export interface ReplayConfig {
  /** Seed for deterministic RNG */
  seed: string
  /** Explicit policy execution order */
  policyOrder: string[]
  /** Fixed timestamp for deterministic time operations */
  fixedTimestamp?: number
  /** Environment fingerprint for verification */
  envFingerprint?: string
}

/**
 * Context for deterministic execution
 */
export interface DeterministicContext {
  /** Seeded random number generator */
  random: () => number
  /** Fixed timestamp provider */
  now: () => number
  /** Replay seed */
  seed: string
  /** Policy execution order */
  policyOrder: string[]
  /** Environment fingerprint */
  envFingerprint: string
}

/**
 * Seeded random number generator using xorshift128+
 * Provides deterministic pseudo-random numbers
 *
 * @param seed - String seed for RNG initialization
 * @returns Function that returns deterministic random numbers [0, 1)
 */
export function seededRandom(seed: string): () => number {
  // Convert seed string to BigInt state
  let x = 0n
  for (const char of seed) {
    x = (x << 5n) - x + BigInt(char.charCodeAt(0))
    x = x & 0xffffffffffffffffn // Keep 64-bit
  }

  // xorshift128+ algorithm for quality random numbers
  let state0 = x
  let state1 = x ^ 0x123456789abcdef0n

  return () => {
    let s1 = state0
    const s0 = state1
    state0 = s0
    s1 ^= s1 << 23n
    s1 ^= s1 >> 17n
    s1 ^= s0
    s1 ^= s0 >> 26n
    state1 = s1

    const result = (state0 + state1) & 0xffffffffn
    const normalized = Number(result) / 0x100000000
    return normalized
  }
}

/**
 * Generate environment fingerprint
 * Creates a stable identifier for the execution environment
 *
 * @returns Environment fingerprint string
 */
export function getEnvFingerprint(): string {
  const parts: string[] = []

  // Runtime detection
  if (typeof Deno !== 'undefined') {
    parts.push('deno', Deno.version.deno)
  } else if (typeof process !== 'undefined' && process.versions?.node) {
    parts.push('node', process.versions.node)
  } else if (typeof navigator !== 'undefined') {
    parts.push('browser', navigator.userAgent.split(' ').pop() || 'unknown')
  } else {
    parts.push('unknown')
  }

  // Platform
  if (typeof Deno !== 'undefined') {
    parts.push(Deno.build.os, Deno.build.arch)
  } else if (typeof process !== 'undefined') {
    parts.push(process.platform, process.arch)
  }

  return parts.join(':')
}

/**
 * Create deterministic context for replay
 *
 * @param config - Replay configuration
 * @returns Deterministic execution context
 */
export function createDeterministicContext(config: ReplayConfig): DeterministicContext {
  const random = seededRandom(config.seed)
  const fixedTime = config.fixedTimestamp ?? Date.now()
  let timeIncrement = 0

  return {
    random,
    now: () => {
      // Increment time slightly on each call to avoid identical timestamps
      timeIncrement += 1
      return fixedTime + timeIncrement
    },
    seed: config.seed,
    policyOrder: config.policyOrder,
    envFingerprint: config.envFingerprint ?? getEnvFingerprint()
  }
}

/**
 * Replay controller for deterministic span execution
 * Ensures that given the same inputs and environment, execution produces identical results
 */
export class ReplayController {
  private context: DeterministicContext

  constructor(public config: ReplayConfig) {
    this.context = createDeterministicContext(config)
  }

  /**
   * Execute a span with deterministic replay
   *
   * @param span - Span to execute
   * @param minicoreConfig - Minicore configuration
   * @returns Execution result with replay metadata
   */
  async execute(
    span: Partial<Span>,
    minicoreConfig: MinicoreConfig
  ): Promise<ExecutionResult & { replayMetadata: ReplayMetadata }> {
    // Inject replay context into span
    const replaySpan: Partial<Span> = {
      ...span,
      meta: {
        ...span.meta,
        created_at: span.meta?.created_at ?? new Date(this.context.now()).toISOString(),
        replay_seed: this.context.seed,
        env_fingerprint: this.context.envFingerprint
      }
    }

    // Enforce policy order if policies are configured
    if (replaySpan.policy && this.config.policyOrder.length > 0) {
      replaySpan.policy = this.reorderPolicies(
        replaySpan.policy as PolicyConfig,
        this.config.policyOrder
      )
    }

    // Execute with deterministic context available
    // @ts-ignore - inject replay context for kernels to use
    globalThis.__minicore_replay_context = this.context

    try {
      const result = await executeSpan(replaySpan, minicoreConfig)

      // Attach replay metadata
      return {
        ...result,
        replayMetadata: {
          seed: this.context.seed,
          policyOrder: this.config.policyOrder,
          envFingerprint: this.context.envFingerprint,
          deterministic: true
        }
      }
    } finally {
      // Clean up global context
      // @ts-ignore
      delete globalThis.__minicore_replay_context
    }
  }

  /**
   * Reorder policies according to specified order
   * Only includes policies that are present in the order array
   */
  private reorderPolicies(
    policies: PolicyConfig,
    order: string[]
  ): PolicyConfig {
    const reordered: PolicyConfig = {}

    for (const policyName of order) {
      if (policyName in policies) {
        // @ts-ignore - dynamic property access
        reordered[policyName] = policies[policyName]
      }
    }

    return reordered
  }

  /**
   * Get current deterministic context
   */
  getContext(): DeterministicContext {
    return this.context
  }
}

/**
 * Replay metadata attached to execution results
 */
export interface ReplayMetadata {
  /** Seed used for deterministic execution */
  seed: string
  /** Policy execution order */
  policyOrder: string[]
  /** Environment fingerprint */
  envFingerprint: string
  /** Whether execution was deterministic */
  deterministic: boolean
}

/**
 * Verify that two execution results are identical (deterministic)
 *
 * @param result1 - First execution result
 * @param result2 - Second execution result
 * @returns True if results are identical
 */
export function verifyDeterminism(
  result1: ExecutionResult,
  result2: ExecutionResult
): boolean {
  // Compare critical fields that should be identical in deterministic execution
  return (
    result1.hash === result2.hash &&
    result1.status === result2.status &&
    JSON.stringify(result1.output) === JSON.stringify(result2.output) &&
    result1.signature?.sig === result2.signature?.sig
  )
}

/**
 * Get replay context if currently in replay mode
 * Used by kernels to access deterministic RNG and time
 *
 * @returns Replay context or null if not in replay mode
 */
export function getReplayContext(): DeterministicContext | null {
  // @ts-ignore
  return globalThis.__minicore_replay_context ?? null
}
