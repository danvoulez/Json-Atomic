/**
 * run_code kernel - Execute JavaScript code safely in sandbox
 */

import { runInSandbox, validateCodeSyntax } from '../sandbox.ts'
import type { RunCodeInput, RunCodeOutput } from '../types.ts'

/**
 * Execute JavaScript code in a sandboxed environment
 * 
 * @param input - Code execution input
 * @param dry_run - If true, validate syntax only without execution
 * @returns Execution result with output or error
 */
export async function runCode(
  input: RunCodeInput,
  dry_run = false
): Promise<RunCodeOutput> {
  const { code, context = {}, timeout = 3000 } = input
  
  // Dry run mode - just validate syntax
  if (dry_run) {
    const validation = validateCodeSyntax(code)
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
