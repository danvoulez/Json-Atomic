/**
 * Core type definitions for JSON✯Atomic
 */

export interface Signature {
  alg: 'Ed25519'
  public_key: string
  sig: string
  signed_at?: string
}

export interface Atomic {
  schema_version: '1.1.0'
  entity_type: 'file' | 'function' | 'law' | 'decision' | 'agent' | 'contract' | 'test'
  intent?: 'run_code' | 'shell_cmd' | 'law_test' | 'contract_eval' | 'file_write' | 'file_read' | 'http_call'
  trace_id?: string
  this: string
  prev?: string
  hash?: string
  signature?: Signature
  did: {
    actor: string
    action: string
    reason?: string
  }
  input?: {
    content?: string
    bytes_b64?: string
    args?: unknown[]
    env?: Record<string, unknown>
    [key: string]: unknown
  }
  payload?: Record<string, unknown>
  output?: {
    stdout?: string
    stderr?: string
    result?: unknown
    error?: string
    [key: string]: unknown
  }
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
    if_ok?: PolicyAction
    if_doubt?: PolicyAction
    if_not?: PolicyAction
  }
  metadata?: {
    owner_id?: string
    tenant_id?: string
    parent_id?: string
    tags?: string[]
    created_at: string
    version?: string
  }
}

export type PolicyAction = string | {
  action: string
  target?: string
  params?: Record<string, unknown>
}

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
  error?: LedgerError
}

export interface LedgerError {
  code: string
  message: string
  details?: Record<string, unknown>
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
