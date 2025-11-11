/**
 * Validator for JSON✯Atomic spans using atomic.schema.json
 */

export interface SpanValidationResult {
  valid: boolean
  errors?: string[]
}

export interface Span {
  type: string
  kind?: string
  input?: Record<string, unknown>
  output?: unknown
  status?: string
  duration_ms?: number
  logs?: string[]
  span_id?: string
  trace_id?: string
  policy?: Record<string, unknown>
  policy_applied?: string[]
  meta?: Record<string, unknown>
}

/**
 * Validate a span against basic structure requirements
 * In production, this would validate against atomic.schema.json
 */
export function validateSpan(span: unknown): SpanValidationResult {
  if (!span || typeof span !== 'object') {
    return {
      valid: false,
      errors: ['Span must be an object']
    }
  }

  const s = span as Record<string, unknown>
  const errors: string[] = []

  // Check required fields
  if (!s.type || typeof s.type !== 'string') {
    errors.push('Span must have a "type" field (string)')
  }

  // Validate optional fields types
  if (s.kind && typeof s.kind !== 'string') {
    errors.push('Field "kind" must be a string')
  }

  if (s.input && typeof s.input !== 'object') {
    errors.push('Field "input" must be an object')
  }

  if (s.policy && typeof s.policy !== 'object') {
    errors.push('Field "policy" must be an object')
  }

  if (s.meta && typeof s.meta !== 'object') {
    errors.push('Field "meta" must be an object')
  }

  if (s.logs && !Array.isArray(s.logs)) {
    errors.push('Field "logs" must be an array')
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Create a valid span with defaults
 */
export function createSpan(partial: Partial<Span>): Span {
  const now = new Date().toISOString()
  const traceId = partial.trace_id || partial.meta?.trace_id as string || `trace-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  return {
    type: partial.type || 'execution',
    kind: partial.kind,
    input: partial.input,
    output: partial.output,
    status: partial.status || 'pending',
    duration_ms: partial.duration_ms,
    logs: partial.logs || [],
    span_id: partial.span_id || `span-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    trace_id: traceId,
    policy: partial.policy,
    policy_applied: partial.policy_applied,
    meta: {
      ...partial.meta,
      created_at: now
    }
  }
}
