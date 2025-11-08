import type { Atomic, ExecutionResult as ExecResult } from '../../types.js'

export class CodeExecutor {
  async execute(_code: string, _context: Record<string, unknown> = {}): Promise<ExecResult> {
    // Stub implementation - in production would use vm2 or isolated-vm
    console.warn('CodeExecutor.execute is not implemented')
    return {
      status: 'error',
      error: 'Code execution not implemented',
      duration_ms: 0
    }
  }
}

export class AtomicExecutor {
  async execute(_atomic: Atomic): Promise<ExecResult> {
    // Stub implementation - in production would execute based on entity_type
    console.warn('AtomicExecutor.execute is not implemented')
    return {
      status: 'error',
      error: 'Atomic execution not implemented',
      duration_ms: 0
    }
  }
}