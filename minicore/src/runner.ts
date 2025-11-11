/**
 * Runner - Span execution lifecycle manager
 * Orchestrates validation, policy application, kernel execution, and signing
 */

import { validateSpan, createSpan } from './validator.ts'
import { signSpan } from './signer.ts'
import { applyPolicy } from './kernels/apply_policy.ts'
import { runCode } from './kernels/run_code.ts'
import { evaluatePrompt } from './kernels/evaluate_prompt.ts'
import type {
  Span,
  ExecutionResult,
  MinicoreConfig,
  PolicyConfig,
  RunCodeInput,
  EvaluatePromptInput
} from './types.ts'

/**
 * Execute a span through its complete lifecycle
 * 
 * @param spanInput - Partial span data
 * @param config - Minicore configuration
 * @returns Execution result with signature
 */
export async function executeSpan(
  spanInput: Partial<Span>,
  config: MinicoreConfig
): Promise<ExecutionResult> {
  const startTime = Date.now()
  const logs: string[] = []
  
  // Step 1: Create and validate span
  const span = createSpan(spanInput)
  logs.push('Span created')
  
  const validation = validateSpan(span)
  if (!validation.valid) {
    return createErrorResult(
      span,
      validation.errors?.join('; ') || 'Invalid span',
      logs,
      Date.now() - startTime,
      config
    )
  }
  logs.push('Span validated')
  
  // Step 2: Apply policies if configured
  if (span.policy) {
    const policyResult = applyPolicy(span, span.policy as PolicyConfig)
    logs.push(`Policy applied: ${policyResult.policy_applied.join(', ')}`)
    
    if (policyResult.decision === 'deny') {
      return createErrorResult(
        span,
        `Policy denied: ${policyResult.reason}`,
        logs,
        Date.now() - startTime,
        config,
        policyResult.policy_applied
      )
    }
    
    span.policy_applied = policyResult.policy_applied
  }
  
  // Step 3: Execute kernel based on kind
  let output: unknown
  let error: string | undefined
  
  try {
    switch (span.kind) {
      case 'run_code':
        logs.push('Executing run_code kernel')
        output = await executeRunCode(span, config, logs)
        break
        
      case 'evaluate_prompt':
        logs.push('Executing evaluate_prompt kernel')
        output = await executeEvaluatePrompt(span, config, logs)
        break
        
      case 'apply_policy':
        logs.push('Executing apply_policy kernel')
        output = executeApplyPolicy(span, logs)
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
  
  // Step 4: Create result span
  const result: Span = {
    ...span,
    output,
    status: error ? 'error' : 'ok',
    duration_ms,
    logs
  }
  
  // Step 5: Sign if not in dry run mode and keys are available
  if (!config.dry_run && config.privateKey) {
    logs.push('Signing span')
    const signed = signSpan(result, config.privateKey)
    return signed as ExecutionResult
  }
  
  // Return unsigned result in dry run mode
  return {
    ...result,
    hash: '',
    status: result.status as 'ok' | 'error',
    duration_ms,
    logs
  }
}

/**
 * Execute run_code kernel
 */
async function executeRunCode(
  span: Span,
  config: MinicoreConfig,
  logs: string[]
): Promise<unknown> {
  const input = span.input as RunCodeInput
  if (!input?.code) {
    throw new Error('run_code requires input.code')
  }
  
  const result = await runCode(
    {
      code: input.code,
      context: input.context,
      timeout: input.timeout || config.timeout
    },
    config.dry_run
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
async function executeEvaluatePrompt(
  span: Span,
  config: MinicoreConfig,
  logs: string[]
): Promise<unknown> {
  const input = span.input as EvaluatePromptInput
  if (!input?.prompt) {
    throw new Error('evaluate_prompt requires input.prompt')
  }
  
  const result = await evaluatePrompt(input, config.dry_run)
  
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
function executeApplyPolicy(span: Span, logs: string[]): unknown {
  const policyConfig = span.input as PolicyConfig
  const policyResult = applyPolicy(span, policyConfig)
  
  logs.push(`Policy decision: ${policyResult.decision}`)
  return policyResult
}

/**
 * Create error result
 */
function createErrorResult(
  span: Span,
  error: string,
  logs: string[],
  duration_ms: number,
  config: MinicoreConfig,
  policy_applied?: string[]
): ExecutionResult {
  const result: Span = {
    ...span,
    output: { error },
    status: 'error',
    duration_ms,
    logs,
    policy_applied
  }
  
  // Sign errors if configured
  if (!config.dry_run && config.privateKey) {
    return signSpan(result, config.privateKey) as ExecutionResult
  }
  
  return {
    ...result,
    hash: '',
    status: 'error',
    duration_ms,
    logs
  }
}
