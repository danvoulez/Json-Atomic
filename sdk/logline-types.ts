/**
 * 27. Exportação Typescript Types & SDK (logline-sdk)
 * Tipos fortes e cliente para integração segura em apps externos.
 */

export type Atomic = {
  entity_type: string
  intent?: string
  this: string
  prev?: string
  input?: Record<string, any>
  output?: Record<string, any>
  payload?: any
  when?: {
    started_at?: string
    completed_at?: string
    scheduled_at?: string
  }
  did?: { actor: string; action: string; reason?: string }
  status?: { state: string; result?: string; message?: string }
  policy?: Record<string, any>
  metadata?: {
    owner_id?: string
    tenant_id?: string
    trace_id?: string
    parent_id?: string
    tags?: string[]
    created_at?: string
    version?: string
  }
  curr_hash?: string
  signature?: string
}

export type VerificationResult = {
  line: number
  valid: boolean
  hash: string
  trace_id?: string
  error?: string
}

export type ExecutionResult = {
  output: any
  stdout: string
  stderr: string
  error?: string
  duration_ms: number
}

export type Contract = {
  id: string
  agent: string
  action: string
  path_pattern?: string
  input_schema?: any
  output_schema?: any
  policies?: {
    max_duration?: number
    required_tags?: string[]
    allowed_tenants?: string[]
  }
}