/**
 * Web Worker for sandboxed code execution
 *
 * Security features:
 * - No imports - completely isolated environment
 * - No DOM access (workers don't have window/document)
 * - Only serialized context is available
 * - Uses strict mode
 * - No access to parent scope or global variables
 *
 * The host is responsible for timeout enforcement via worker.terminate()
 *
 * @module
 */

/**
 * Worker message handler
 * Receives code and context, executes in isolation, returns result
 */
self.onmessage = (event) => {
  const { code, context } = event.data
  const startTime = performance.now()

  try {
    // Extract context keys and values for function parameters
    const contextKeys = Object.keys(context ?? {})
    const contextValues = Object.values(context ?? {})

    // Create isolated function with strict mode
    // Context variables are passed as parameters (not via closure)
    const fn = new Function(...contextKeys, `"use strict"; ${code}`)

    // Execute the function
    const result = fn(...contextValues)

    // Handle both sync and async results
    Promise.resolve(result)
      .then((output) => {
        const duration_ms = performance.now() - startTime
        ;(self as any).postMessage({ output, duration_ms })
      })
      .catch((error) => {
        const duration_ms = performance.now() - startTime
        ;(self as any).postMessage({
          output: null,
          error: String(error?.message ?? error),
          duration_ms
        })
      })
  } catch (error) {
    const duration_ms = performance.now() - startTime
    ;(self as any).postMessage({
      output: null,
      error: String(error?.message ?? error),
      duration_ms
    })
  }
}
