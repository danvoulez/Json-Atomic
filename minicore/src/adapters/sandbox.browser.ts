/**
 * Browser sandbox adapter using Web Worker for secure code execution
 *
 * Security features:
 * - Code runs in a separate Worker thread (no DOM access)
 * - Real timeout enforcement with worker.terminate()
 * - No network access (worker doesn't expose fetch)
 * - Isolated scope with only provided context variables
 *
 * @module
 */

import type { SandboxAdapter, SandboxConfig, SandboxResult } from '../types.ts'

/**
 * Browser sandbox adapter using Web Workers
 * Provides true isolation and timeout enforcement
 */
export const BrowserSandbox: SandboxAdapter = {
  async run(
    code: string,
    context: Record<string, unknown> = {},
    config: SandboxConfig = {}
  ): Promise<SandboxResult> {
    const startTime = performance.now()
    const timeout = config.timeout ?? 3000

    return new Promise((resolve) => {
      // Create dedicated worker
      const worker = new Worker(
        new URL('../workers/sandbox.worker.ts', import.meta.url),
        { type: 'module' }
      )

      let finished = false

      const done = (result: SandboxResult) => {
        if (finished) return
        finished = true

        // Clean up worker
        try {
          worker.terminate()
        } catch {
          // Worker already terminated or cleanup failed
        }

        resolve(result)
      }

      // Timeout enforcement
      const timer = setTimeout(() => {
        done({
          output: null,
          error: `Execution timeout after ${timeout}ms`,
          timedOut: true,
          duration_ms: performance.now() - startTime
        })
      }, timeout)

      // Success handler
      worker.onmessage = (event) => {
        clearTimeout(timer)
        const { output, error, duration_ms } = event.data
        done({
          output,
          error,
          timedOut: false,
          duration_ms: duration_ms ?? performance.now() - startTime
        })
      }

      // Error handler
      worker.onerror = (event) => {
        clearTimeout(timer)
        done({
          output: null,
          error: String(event.message || event),
          timedOut: false,
          duration_ms: performance.now() - startTime
        })
      }

      // Start execution
      worker.postMessage({ code, context })
    })
  }
}
