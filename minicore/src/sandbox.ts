/**
 * Sandbox for secure code execution with timeout and resource limits
 * Automatically routes to the appropriate implementation based on runtime:
 * - Browser: Web Worker (true isolation, no DOM access)
 * - Deno/Node: Function constructor (fallback for server environments)
 */

import type { SandboxAdapter, SandboxConfig, SandboxResult } from './types.ts'
import { isBrowser } from './env.ts'

/**
 * Lazy-loaded sandbox adapter
 * Selected based on runtime environment
 */
let adapter: SandboxAdapter | null = null

/**
 * Get or initialize the sandbox adapter
 * Loads the appropriate implementation based on environment
 */
async function getAdapter(): Promise<SandboxAdapter> {
  if (adapter) return adapter

  if (isBrowser()) {
    // Browser: use Web Worker for true isolation
    const { BrowserSandbox } = await import('./adapters/sandbox.browser.ts')
    adapter = BrowserSandbox
  } else {
    // Deno/Node: use Function constructor (fallback)
    adapter = {
      async run(
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
    }
  }

  return adapter
}

/**
 * Execute code in a sandboxed environment with timeout
 * Automatically selects the best isolation mechanism for the current runtime
 *
 * Browser: Uses Web Worker for true isolation (no DOM, no network, separate thread)
 * Deno/Node: Uses Function constructor (suitable for trusted code)
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
  const sandboxAdapter = await getAdapter()
  return await sandboxAdapter.run(code, context, config)
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
