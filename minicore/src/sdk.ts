/**
 * @logline/minicore - SDK for JSON✯Atomic span execution
 * 
 * A portable, embeddable runtime for executing JSON✯Atomic spans with:
 * - Secure sandboxed execution
 * - Policy enforcement (TTL, slow, throttle, circuit breaker)
 * - Cryptographic signing (BLAKE3 + Ed25519)
 * - Auditable logging and NDJSON export
 * - Browser, Deno, and edge runtime support
 * 
 * @example
 * ```typescript
 * import { Minicore } from '@logline/minicore'
 * 
 * const minicore = new Minicore()
 * const result = await minicore.execute({
 *   kind: 'run_code',
 *   input: { code: 'return 2 + 2' }
 * })
 * console.log(result.output) // 4
 * ```
 * 
 * @module
 */

// Core exports
export { Minicore } from './core.ts'

// Utilities
export { 
  validateSpan, 
  createSpan,
  isSpan
} from './validator.ts'

export {
  generateKeyPair,
  hashSpan,
  signSpan,
  verifySpan,
  verifyHash
} from './signer.ts'

export {
  runInSandbox,
  validateCodeSyntax
} from './sandbox.ts'

export {
  loadFromObject,
  loadFromJSON,
  loadFromNDJSON,
  loadFromURL,
  loadFromFile
} from './loader.ts'

export {
  getEnv,
  getAllEnv,
  loadEnvConfig,
  isBrowser,
  isDeno,
  isNode,
  getRuntime
} from './env.ts'

export {
  verifySingleSpan,
  verifyLedger,
  verifyChain,
  formatVerificationReport
} from './verifyLedger.ts'

// Kernels
export { runCode } from './kernels/run_code.ts'
export { evaluatePrompt } from './kernels/evaluate_prompt.ts'
export { applyPolicy } from './kernels/apply_policy.ts'

// Replay and determinism
export {
  ReplayController,
  seededRandom,
  getEnvFingerprint,
  createDeterministicContext,
  verifyDeterminism,
  getReplayContext
} from './replay.ts'

// Policy registry
export {
  POLICY_REGISTRY,
  getDefaultPolicyOrder,
  getPolicyMetadata,
  getAllPolicies,
  validatePolicyConfig,
  applyPoliciesInOrder,
  createPolicyConfig,
  simulatePolicy
} from './policies/registry.ts'

// UI components (browser only)
export { PolicyStudio } from './ui/policy-studio.ts'
export { LedgerViewer } from './ui/ledger-viewer.ts'
export * as UIUtils from './ui/ui-utils.ts'

// Type exports
export type {
  Span,
  PolicyConfig,
  PolicyResult,
  Signature,
  SignedSpan,
  ExecutionResult,
  MinicoreConfig,
  KeyPair,
  ValidationResult,
  SandboxConfig,
  SandboxResult,
  RunCodeInput,
  RunCodeOutput,
  EvaluatePromptInput,
  EvaluatePromptOutput,
  LoaderOptions,
  EnvironmentConfig
} from './types.ts'

export type {
  ReplayConfig,
  DeterministicContext,
  ReplayMetadata
} from './replay.ts'

export type {
  PolicyMetadata,
  PolicyProfile,
  PolicyMetrics
} from './policies/registry.ts'

export type {
  LedgerFilter
} from './ui/ledger-viewer.ts'

/**
 * Create and run a span in one call
 * Convenience function for quick execution
 * 
 * @param spanInput - Span data
 * @param config - Optional minicore configuration
 * @returns Execution result
 * 
 * @example
 * ```typescript
 * const result = await runSpan({
 *   kind: 'run_code',
 *   input: { code: 'return Math.sqrt(16)' }
 * })
 * ```
 */
export async function runSpan(
  spanInput: Partial<import('./types.ts').Span>,
  config?: import('./types.ts').MinicoreConfig
) {
  const { Minicore } = await import('./core.ts')
  const minicore = new Minicore(config)
  return await minicore.execute(spanInput)
}

/**
 * Create a playground environment for experimenting with spans
 * Useful for interactive exploration and testing
 * 
 * @param config - Optional minicore configuration
 * @returns Minicore instance with helper methods
 * 
 * @example
 * ```typescript
 * const playground = createPlayground()
 * await playground.code('return 2 + 2')
 * await playground.prompt('What is the capital of France?')
 * console.log(playground.history())
 * ```
 */
export async function createPlayground(config?: import('./types.ts').MinicoreConfig) {
  const { Minicore } = await import('./core.ts')
  const minicore = new Minicore(config)
  
  return {
    /**
     * Execute JavaScript code
     */
    async code(code: string, context?: Record<string, unknown>) {
      return await minicore.execute({
        kind: 'run_code',
        input: { code, context }
      })
    },
    
    /**
     * Evaluate a prompt
     */
    async prompt(prompt: string, model?: string) {
      return await minicore.execute({
        kind: 'evaluate_prompt',
        input: { prompt, model }
      })
    },
    
    /**
     * Execute any span
     */
    async run(spanInput: Partial<import('./types.ts').Span>) {
      return await minicore.execute(spanInput)
    },
    
    /**
     * Get execution history
     */
    history() {
      return minicore.getHistory()
    },
    
    /**
     * Export as NDJSON
     */
    export() {
      return minicore.exportNDJSON()
    },
    
    /**
     * Clear history
     */
    clear() {
      minicore.clearHistory()
    },
    
    /**
     * Get raw minicore instance
     */
    core() {
      return minicore
    }
  }
}
