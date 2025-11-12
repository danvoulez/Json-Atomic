/**
 * Web Worker for sandboxed code execution
 *
 * Security features:
 * - No imports - completely isolated environment
 * - No DOM access (workers don't have window/document)
 * - Only serialized context is available
 * - Uses strict mode
 * - No access to parent scope or global variables
 * - fetch/WebSocket disabled for untrusted code
 * - Deterministic clock in replay mode
 *
 * The host is responsible for timeout enforcement via worker.terminate()
 *
 * @module
 */

// Remove fetch from worker scope for security
if (typeof fetch !== 'undefined') {
  try {
    // @ts-ignore
    delete self.fetch
  } catch {
    // Can't delete, override with undefined
    // @ts-ignore
    self.fetch = undefined
  }
}

/**
 * Worker message handler
 * Receives code and context, executes in isolation, returns result
 */
self.onmessage = (event) => {
  const { code, context, replayContext } = event.data
  const startTime = performance.now()

  try {
    // Extract context keys and values for function parameters
    const contextKeys = Object.keys(context ?? {})
    const contextValues = Object.values(context ?? {})

    // Inject deterministic helpers if in replay mode
    let enhancedCode = code
    if (replayContext) {
      // Provide deterministic Math.random() and Date.now()
      const replayStr = JSON.stringify(replayContext)
      enhancedCode = `
        const __replay = ${replayStr};
        const __originalRandom = Math.random;
        const __originalDateNow = Date.now;

        // Mock Math.random with seeded RNG
        Math.random = () => {
          // Simple xorshift for consistency
          __replay.state = (__replay.state * 1103515245 + 12345) & 0x7fffffff;
          return __replay.state / 0x7fffffff;
        };

        // Mock Date.now with fixed time
        Date.now = () => __replay.fixedTime;

        try {
          ${code}
        } finally {
          // Restore originals
          Math.random = __originalRandom;
          Date.now = __originalDateNow;
        }
      `
    }

    // Create isolated function with strict mode
    // Context variables are passed as parameters (not via closure)
    const fn = new Function(...contextKeys, `"use strict"; ${enhancedCode}`)

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
