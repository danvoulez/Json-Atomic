/**
 * Type definitions for Minicore SDK
 * Strict typing for JSON✯Atomic span execution
 */

/**
 * Base span structure following JSON✯Atomic specification
 */
export interface Span {
  /** Span type (e.g., "execution", "install", "schedule") */
  type: string
  /** Kernel to execute (e.g., "run_code", "evaluate_prompt") */
  kind?: string
  /** Input data for the kernel */
  input?: Record<string, unknown>
  /** Output from execution */
  output?: unknown
  /** Execution status */
  status?: 'pending' | 'ok' | 'error'
  /** Execution duration in milliseconds */
  duration_ms?: number
  /** Execution logs */
  logs?: string[]
  /** Unique span identifier */
  span_id?: string
  /** Trace identifier for correlation */
  trace_id?: string
  /** Policy configuration */
  policy?: PolicyConfig
  /** Applied policies */
  policy_applied?: string[]
  /** Metadata */
  meta?: Record<string, unknown>
  /** Allow additional properties */
  [key: string]: unknown
}

/**
 * Policy configuration for span execution
 */
export interface PolicyConfig {
  /** Time to live - reject if span is older than this */
  ttl?: string | number
  /** Mark as slow if execution exceeds this threshold */
  slow?: string | number
  /** Rate limiting configuration */
  throttle?: {
    max_requests: number
    window_ms: number
  }
  /** Circuit breaker configuration */
  circuit_breaker?: {
    threshold: number
    timeout_ms: number
  }
}

/**
 * Policy evaluation result
 */
export interface PolicyResult {
  /** Policy decision */
  decision: 'allow' | 'deny'
  /** Reason for the decision */
  reason?: string
  /** List of applied policies */
  policy_applied: string[]
}

/**
 * Cryptographic signature structure
 */
export interface Signature {
  /** Signature algorithm */
  alg: 'Ed25519'
  /** Public key in hex format */
  public_key: string
  /** Signature in hex format */
  sig: string
  /** Signature timestamp */
  signed_at: string
}

/**
 * Signed span with hash and signature
 */
export interface SignedSpan extends Span {
  /** BLAKE3 hash of the span */
  hash: string
  /** Ed25519 signature */
  signature?: Signature
}

/**
 * Execution result with optional signature
 */
export interface ExecutionResult extends SignedSpan {
  /** Always includes hash */
  hash: string
  /** Status is always set after execution */
  status: 'ok' | 'error'
  /** Duration is always measured */
  duration_ms: number
  /** Logs are always present */
  logs: string[]
}

/**
 * Minicore configuration
 */
export interface MinicoreConfig {
  /** Ed25519 private key (hex) - auto-generated if not provided */
  privateKey?: string
  /** Ed25519 public key (hex) - auto-generated if not provided */
  publicKey?: string
  /** Default execution timeout in milliseconds */
  timeout?: number
  /** Dry run mode - validate but don't execute */
  dry_run?: boolean
}

/**
 * Keypair for Ed25519 signing
 */
export interface KeyPair {
  /** Private key in hex format */
  privateKey: string
  /** Public key in hex format */
  publicKey: string
}

/**
 * Span validation result
 */
export interface ValidationResult {
  /** Whether the span is valid */
  valid: boolean
  /** Validation errors if any */
  errors?: string[]
}

/**
 * Sandbox execution configuration
 */
export interface SandboxConfig {
  /** Execution timeout in milliseconds */
  timeout?: number
  /** Maximum memory (not yet enforced) */
  maxMemory?: number
}

/**
 * Sandbox execution result
 */
export interface SandboxResult {
  /** Execution output */
  output?: unknown
  /** Error message if execution failed */
  error?: string
  /** Whether execution timed out */
  timedOut?: boolean
  /** Execution duration in milliseconds */
  duration_ms: number
}

/**
 * Input for run_code kernel
 */
export interface RunCodeInput {
  /** JavaScript code to execute */
  code: string
  /** Context variables available to the code */
  context?: Record<string, unknown>
  /** Execution timeout in milliseconds */
  timeout?: number
}

/**
 * Output from run_code kernel
 */
export interface RunCodeOutput {
  /** Execution result */
  result?: unknown
  /** Error message if execution failed */
  error?: string
  /** Whether execution timed out */
  timedOut?: boolean
  /** Execution duration in milliseconds */
  duration_ms: number
}

/**
 * Input for evaluate_prompt kernel
 */
export interface EvaluatePromptInput {
  /** Prompt text */
  prompt: string
  /** Context for the prompt */
  context?: Record<string, unknown>
  /** Model name (e.g., "gpt-4") */
  model?: string
  /** Sampling temperature */
  temperature?: number
  /** Maximum tokens to generate */
  max_tokens?: number
}

/**
 * Output from evaluate_prompt kernel
 */
export interface EvaluatePromptOutput {
  /** Generated response */
  response?: string
  /** Error message if evaluation failed */
  error?: string
  /** Evaluation duration in milliseconds */
  duration_ms: number
  /** Number of tokens used */
  tokens_used?: number
}

/**
 * Span loader options
 */
export interface LoaderOptions {
  /** Validate span after loading */
  validate?: boolean
  /** Parse as NDJSON */
  ndjson?: boolean
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  /** Environment name (e.g., "development", "production") */
  env?: string
  /** Additional configuration */
  [key: string]: unknown
}
