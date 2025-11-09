/**
 * Core type definitions for LogLineOS
 */

/**
 * Signature structure for signed atomics
 */
export interface Signature {
  alg: 'Ed25519'
  public_key: string  // 64 hex chars
  sig: string         // 128 hex chars
  signed_at?: string  // ISO 8601 date-time
}

/**
 * DID (Decentralized Identifier) structure
 */
export interface Did {
  actor: string   // Who performed the action
  action: string  // What action was performed
  reason?: string // Why the action was performed
}

/**
 * Main Atomic interface aligned with schema v1.1.0
 */
export interface Atomic {
  schema_version?: '1.1.0'
  entity_type: 'file' | 'function' | 'law' | 'decision' | 'agent' | 'contract' | 'test'
  intent?: 'run_code' | 'shell_cmd' | 'law_test' | 'contract_eval' | 'file_write' | 'file_read' | 'http_call'
  this: string
  prev?: string  // Hash of previous atomic in chain
  did: Did
  input?: unknown
  payload?: unknown
  output?: unknown
  when?: {
    started_at: string
    completed_at?: string
  }
  status?: {
    state: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    result?: 'ok' | 'doubt' | 'not' | 'error'
    message?: string
  }
  policy?: {
    if_ok?: unknown
    if_doubt?: unknown
    if_not?: unknown
  }
  metadata: {
    trace_id: string  // UUID
    created_at: string // ISO 8601 date-time
    owner_id?: string
    tenant_id?: string
    parent_id?: string  // UUID
    tags?: string[]
    version?: string
  }
  hash?: string       // BLAKE3 hash (64 hex chars)
  curr_hash?: string  // Alias for hash (backwards compatibility)
  signature?: Signature
}

/**
 * Atomic with signature applied
 */
export interface SignedAtomic extends Atomic {
  hash: string
  signature: Signature
}

export interface Contract {
  name: string
  version: string
  schema: unknown
  validator: (atomic: Atomic) => ValidationResult
}

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Verification result for ledger validation
 */
export interface VerificationResult {
  line: number
  valid: boolean
  hash: string
  trace_id?: string
  error?: string
}

/**
 * Ledger error structure
 */
export interface LedgerError {
  line: number
  code: string
  message: string
  trace_id?: string
}

export interface ExecutionResult {
  status: 'success' | 'error'
  output?: unknown
  error?: string
  duration_ms?: number
}

export interface VerificationResult {
  line: number
  valid: boolean
  hash: string
  trace_id?: string
  error?: string
}

export interface LedgerScanOptions {
  limit?: number
  cursor?: string
  status?: string
  trace_id?: string
}

export interface LedgerQueryOptions {
  trace_id?: string
  entity_type?: string
  owner_id?: string
  tenant_id?: string
}
