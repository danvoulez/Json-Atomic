/**
 * Core type definitions for LogLineOS
 */

export interface Atomic {
  entity_type: 'file' | 'function' | 'law' | 'decision' | 'agent' | 'contract'
  intent?: string
  this: string
  did: {
    actor: string
    action: string
  }
  input?: unknown
  output?: unknown
  status?: 'pending' | 'running' | 'success' | 'error'
  metadata: {
    trace_id: string
    created_at: string
    owner_id?: string
    tenant_id?: string
    parent_span_id?: string
  }
  curr_hash?: string
  signature?: string
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
