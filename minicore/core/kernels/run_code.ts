/**
 * run_code kernel - Execute JavaScript code safely in sandbox
 */

import { runInSandbox, dryRunCode } from '../sandbox.ts'
import type { Span } from '../validator.ts'

export interface RunCodeInput {
  code: string
  context?: Record<string, unknown>
  timeout?: number
}

export interface RunCodeOutput {
  result?: unknown
  error?: string
  timedOut?: boolean
  duration_ms: number
}

/**
 * Execute code kernel
 */
export async function runCode(
  input: RunCodeInput,
  dry_run = false
): Promise<RunCodeOutput> {
  const { code, context = {}, timeout = 3000 } = input
  
  // Dry run mode - just validate syntax
  if (dry_run) {
    const validation = dryRunCode(code)
    return {
      result: validation.valid ? 'Syntax valid (dry run)' : undefined,
      error: validation.error,
      duration_ms: 0
    }
  }
  
  // Execute in sandbox
  const sandboxResult = await runInSandbox(code, context, { timeout })
  
  return {
    result: sandboxResult.output,
    error: sandboxResult.error,
    timedOut: sandboxResult.timedOut,
    duration_ms: sandboxResult.duration_ms
  }
}

/**
 * Create a span for code execution
 */
export function createRunCodeSpan(input: RunCodeInput): Span {
  return {
    type: 'execution',
    kind: 'run_code',
    input: {
      code: input.code,
      context: input.context,
      timeout: input.timeout
    },
    status: 'pending',
    logs: []
  }
}
