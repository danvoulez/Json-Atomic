/**
 * Sandbox for secure code execution with timeout and resource limits
 */

export interface SandboxConfig {
  timeout?: number  // milliseconds, default 3000
  maxMemory?: number  // not enforced yet, placeholder
}

export interface SandboxResult {
  output?: unknown
  error?: string
  timedOut?: boolean
  duration_ms: number
}

/**
 * Execute code in a sandbox with timeout
 * Uses a simple eval-based approach for Deno
 * In production, would use Deno.permissions or Web Workers
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
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      timedOut = true
      reject(new Error(`Execution timeout after ${timeoutMs}ms`))
    }, timeoutMs)
  })
  
  // Create execution promise
  const execPromise = new Promise((resolve, reject) => {
    try {
      // Create function with context
      const contextKeys = Object.keys(context)
      const contextValues = Object.values(context)
      
      // Wrap code in async function to support await
      const wrappedCode = `
        (async () => {
          ${code}
        })()
      `
      
      // Create and execute function
      // deno-lint-ignore no-explicit-any
      const fn = new Function(...contextKeys, `return ${wrappedCode}`) as any
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
 * Dry run - validate code syntax without executing
 */
export function dryRunCode(code: string): { valid: boolean; error?: string } {
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
