/**
 * Minicore - Portable runtime for JSON✯Atomic spans
 * 
 * A mini-instance of LogLineOS that can execute spans locally with:
 * - Full validation via atomic.schema.json
 * - Computational policies (ttl, slow, throttle, circuit_breaker)
 * - Loadable kernels (run_code, evaluate_prompt, apply_policy)
 * - Secure sandbox with timeout
 * - Auditable logs with BLAKE3 + Ed25519
 * - NDJSON export
 */

import { validateSpan, createSpan, type Span } from './validator.ts'
import { signSpan, verifySpan, generateKeyPair, type SignedSpan } from './signer.ts'
import { runCode, type RunCodeInput } from './kernels/run_code.ts'
import { evaluatePrompt, type EvaluatePromptInput } from './kernels/evaluate_prompt.ts'
import { applyPolicy, type PolicyConfig } from './kernels/apply_policy.ts'

export interface MinicoreConfig {
  privateKey?: string
  publicKey?: string
  timeout?: number
  dry_run?: boolean
}

export interface ExecutionResult extends Span {
  hash?: string
  signature?: {
    alg: string
    public_key: string
    sig: string
    signed_at: string
  }
}

export class Minicore {
  private config: MinicoreConfig
  private executionHistory: ExecutionResult[] = []
  
  constructor(config: MinicoreConfig = {}) {
    this.config = config
    
    // Generate keys if not provided
    if (!config.privateKey || !config.publicKey) {
      const keys = generateKeyPair()
      this.config.privateKey = config.privateKey || keys.privateKey
      this.config.publicKey = config.publicKey || keys.publicKey
    }
  }
  
  /**
   * Execute a span based on its kind
   */
  async execute(spanInput: Partial<Span>): Promise<ExecutionResult> {
    const startTime = Date.now()
    const logs: string[] = []
    
    // Create and validate span
    const span = createSpan(spanInput)
    logs.push('Span created')
    
    const validation = validateSpan(span)
    if (!validation.valid) {
      return this.createErrorResult(span, validation.errors?.join('; ') || 'Invalid span', logs)
    }
    logs.push('Span validated')
    
    // Apply policies if configured
    if (span.policy) {
      const policyResult = applyPolicy(span, span.policy as PolicyConfig)
      logs.push(`Policy applied: ${policyResult.policy_applied.join(', ')}`)
      
      if (policyResult.decision === 'deny') {
        return this.createErrorResult(
          span,
          `Policy denied: ${policyResult.reason}`,
          logs,
          policyResult.policy_applied
        )
      }
      
      span.policy_applied = policyResult.policy_applied
    }
    
    // Execute based on kind
    let output: unknown
    let error: string | undefined
    
    try {
      switch (span.kind) {
        case 'run_code':
          logs.push('Executing code kernel')
          output = await this.executeRunCode(span, logs)
          break
          
        case 'evaluate_prompt':
          logs.push('Executing prompt evaluation kernel')
          output = await this.executeEvaluatePrompt(span, logs)
          break
          
        case 'apply_policy':
          logs.push('Applying policy kernel')
          output = this.executeApplyPolicy(span, logs)
          break
          
        case 'dry_run':
          logs.push('Dry run mode - no execution')
          output = { message: 'Dry run completed', span }
          break
          
        default:
          logs.push(`Unknown kernel: ${span.kind || 'none'}`)
          error = `Unknown kernel: ${span.kind}`
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
      logs.push(`Execution error: ${error}`)
    }
    
    const duration_ms = Date.now() - startTime
    
    // Create result span
    const result: Span = {
      ...span,
      output,
      status: error ? 'error' : 'ok',
      duration_ms,
      logs
    }
    
    // Sign if not in dry run mode and keys are available
    let signedResult: ExecutionResult = result
    if (!this.config.dry_run && this.config.privateKey) {
      logs.push('Signing span')
      const signed = signSpan(result, this.config.privateKey)
      signedResult = signed as ExecutionResult
    }
    
    // Store in history
    this.executionHistory.push(signedResult)
    
    return signedResult
  }
  
  /**
   * Execute run_code kernel
   */
  private async executeRunCode(span: Span, logs: string[]): Promise<unknown> {
    const input = span.input as RunCodeInput
    if (!input?.code) {
      throw new Error('run_code requires input.code')
    }
    
    const result = await runCode(
      {
        code: input.code,
        context: input.context,
        timeout: input.timeout || this.config.timeout
      },
      this.config.dry_run
    )
    
    if (result.error) {
      logs.push(`Code execution error: ${result.error}`)
      throw new Error(result.error)
    }
    
    if (result.timedOut) {
      logs.push('Code execution timed out')
      throw new Error('Execution timeout')
    }
    
    logs.push(`Code executed in ${result.duration_ms}ms`)
    return result.result
  }
  
  /**
   * Execute evaluate_prompt kernel
   */
  private async executeEvaluatePrompt(span: Span, logs: string[]): Promise<unknown> {
    const input = span.input as EvaluatePromptInput
    if (!input?.prompt) {
      throw new Error('evaluate_prompt requires input.prompt')
    }
    
    const result = await evaluatePrompt(input, this.config.dry_run)
    
    if (result.error) {
      logs.push(`Prompt evaluation error: ${result.error}`)
      throw new Error(result.error)
    }
    
    logs.push(`Prompt evaluated in ${result.duration_ms}ms`)
    return result
  }
  
  /**
   * Execute apply_policy kernel
   */
  private executeApplyPolicy(span: Span, logs: string[]): unknown {
    const policyConfig = span.input as PolicyConfig
    const policyResult = applyPolicy(span, policyConfig)
    
    logs.push(`Policy decision: ${policyResult.decision}`)
    return policyResult
  }
  
  /**
   * Create error result
   */
  private createErrorResult(
    span: Span,
    error: string,
    logs: string[],
    policy_applied?: string[]
  ): ExecutionResult {
    return {
      ...span,
      output: { error },
      status: 'error',
      duration_ms: 0,
      logs,
      policy_applied
    }
  }
  
  /**
   * Verify a signed span
   */
  verify(signedSpan: SignedSpan): boolean {
    return verifySpan(signedSpan, this.config.publicKey)
  }
  
  /**
   * Export execution history as NDJSON
   */
  exportNDJSON(): string {
    return this.executionHistory
      .map(span => JSON.stringify(span))
      .join('\n') + '\n'
  }
  
  /**
   * Get execution history
   */
  getHistory(): ExecutionResult[] {
    return [...this.executionHistory]
  }
  
  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = []
  }
  
  /**
   * Get configuration
   */
  getConfig(): MinicoreConfig {
    return { ...this.config }
  }
}

// Export all types and functions
export {
  validateSpan,
  createSpan,
  signSpan,
  verifySpan,
  generateKeyPair,
  runCode,
  evaluatePrompt,
  applyPolicy
}

export type {
  Span,
  SignedSpan,
  MinicoreConfig,
  ExecutionResult,
  RunCodeInput,
  EvaluatePromptInput,
  PolicyConfig
}
