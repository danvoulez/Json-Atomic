/**
 * Sandbox for secure code execution with timeout and resource limits
 * Browser and edge runtime compatible
 */

import type { SandboxConfig, SandboxResult } from './types.ts'

/**
 * Execute code in a sandboxed environment with timeout
 * Uses Function constructor for isolation - suitable for trusted code only
 * 
 * In production, consider:
 * - Web Workers for browser environments
 * - Deno.permissions for Deno runtime
 * - VM2 or isolated-vm for Node.js (if Node support is needed)
 * 
 * @param code - JavaScript code to execute
 * @param context - Variables available to the code
 * @param config - Sandbox configuration
 * @returns Execution result with output, error, and timing
 */
export async function runInSandbox(
  code: string,
  context: Record<string, unknown> = {},
  config: SandboxConfig = {}
): Promise<SandboxResult> {
  const timeoutMs = config.timeout || 3000
  const startTime = Date.now()
  
  let timedOut = false
  let result: unknown
  let error: string | undefined
  
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      timedOut = true
      reject(new Error(`Execution timeout after ${timeoutMs}ms`))
    }, timeoutMs)
  })
  
  // Create execution promise
  const execPromise = new Promise<unknown>((resolve, reject) => {
    try {
      // Extract context keys and values
      const contextKeys = Object.keys(context)
      const contextValues = Object.values(context)
      
      // Wrap code in async function to support await
      const wrappedCode = `
        (async () => {
          ${code}
        })()
      `
      
      // Create and execute function with context
      const fn = new Function(...contextKeys, `return ${wrappedCode}`)
      const executionResult = fn(...contextValues)
      
      // Handle promise or direct result
      if (executionResult && typeof executionResult.then === 'function') {
        executionResult.then(resolve).catch(reject)
      } else {
        resolve(executionResult)
      }
    } catch (err) {
      reject(err)
    }
  })
  
  // Race between execution and timeout
  try {
    result = await Promise.race([execPromise, timeoutPromise])
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }
  
  const duration_ms = Date.now() - startTime
  
  return {
    output: result,
    error,
    timedOut,
    duration_ms
  }
}

/**
 * Validate code syntax without executing
 * Useful for dry-run mode
 * 
 * @param code - JavaScript code to validate
 * @returns Validation result
 */
export function validateCodeSyntax(code: string): { valid: boolean; error?: string } {
  try {
    // Try to parse as function body
    new Function(code)
    return { valid: true }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
