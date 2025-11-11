/**
 * Core - Main Minicore class
 * Central API for executing JSON✯Atomic spans
 */

import { generateKeyPair, verifySpan } from './signer.ts'
import { executeSpan } from './runner.ts'
import type {
  Span,
  ExecutionResult,
  MinicoreConfig,
  SignedSpan
} from './types.ts'

/**
 * Minicore - Portable runtime for JSON✯Atomic spans
 * 
 * Execute spans locally with:
 * - Full validation
 * - Policy enforcement
 * - Secure sandboxed execution
 * - Cryptographic signing
 * - Auditable logging
 */
export class Minicore {
  private config: MinicoreConfig
  private executionHistory: ExecutionResult[] = []
  
  /**
   * Create a new Minicore instance
   * 
   * @param config - Configuration options
   */
  constructor(config: MinicoreConfig = {}) {
    this.config = config
    
    // Auto-generate keypair if not provided
    if (!config.privateKey || !config.publicKey) {
      const keys = generateKeyPair()
      this.config.privateKey = config.privateKey || keys.privateKey
      this.config.publicKey = config.publicKey || keys.publicKey
    }
  }
  
  /**
   * Execute a span
   * 
   * @param spanInput - Span data to execute
   * @returns Execution result with signature
   */
  async execute(spanInput: Partial<Span>): Promise<ExecutionResult> {
    const result = await executeSpan(spanInput, this.config)
    this.executionHistory.push(result)
    return result
  }
  
  /**
   * Verify a signed span's signature
   * 
   * @param signedSpan - Signed span to verify
   * @returns True if signature is valid
   */
  verify(signedSpan: SignedSpan): boolean {
    return verifySpan(signedSpan, this.config.publicKey)
  }
  
  /**
   * Export execution history as NDJSON
   * 
   * @returns NDJSON string with all executed spans
   */
  exportNDJSON(): string {
    return this.executionHistory
      .map(span => JSON.stringify(span))
      .join('\n') + '\n'
  }
  
  /**
   * Get execution history
   * 
   * @returns Array of all executed spans
   */
  getHistory(): ExecutionResult[] {
    return [...this.executionHistory]
  }
  
  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = []
  }
  
  /**
   * Get current configuration
   * 
   * @returns Minicore configuration (copy)
   */
  getConfig(): MinicoreConfig {
    return { ...this.config }
  }
}
