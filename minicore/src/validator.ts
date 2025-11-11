/**
 * Validator for JSON✯Atomic spans
 * Validates span structure and creates valid spans with defaults
 */

import type { Span, ValidationResult } from './types.ts'

/**
 * Validate a span against JSON✯Atomic requirements
 * 
 * @param span - The span to validate
 * @returns Validation result with errors if invalid
 */
export function validateSpan(span: unknown): ValidationResult {
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

  // Validate optional field types
  if (s.kind !== undefined && typeof s.kind !== 'string') {
    errors.push('Field "kind" must be a string')
  }

  if (s.input !== undefined && (typeof s.input !== 'object' || s.input === null || Array.isArray(s.input))) {
    errors.push('Field "input" must be an object')
  }

  if (s.policy !== undefined && (typeof s.policy !== 'object' || s.policy === null || Array.isArray(s.policy))) {
    errors.push('Field "policy" must be an object')
  }

  if (s.meta !== undefined && (typeof s.meta !== 'object' || s.meta === null || Array.isArray(s.meta))) {
    errors.push('Field "meta" must be an object')
  }

  if (s.logs !== undefined && !Array.isArray(s.logs)) {
    errors.push('Field "logs" must be an array')
  }

  if (s.status !== undefined && !['pending', 'ok', 'error'].includes(s.status as string)) {
    errors.push('Field "status" must be one of: pending, ok, error')
  }

  if (s.duration_ms !== undefined && typeof s.duration_ms !== 'number') {
    errors.push('Field "duration_ms" must be a number')
  }

  if (s.span_id !== undefined && typeof s.span_id !== 'string') {
    errors.push('Field "span_id" must be a string')
  }

  if (s.trace_id !== undefined && typeof s.trace_id !== 'string') {
    errors.push('Field "trace_id" must be a string')
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Create a valid span with defaults from partial input
 * 
 * @param partial - Partial span data
 * @returns Complete span with defaults filled in
 */
export function createSpan(partial: Partial<Span>): Span {
  const now = new Date().toISOString()
  const randomId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  const traceId = partial.trace_id 
    || (partial.meta?.trace_id as string | undefined)
    || `trace-${randomId()}`
  
  return {
    type: partial.type || 'execution',
    kind: partial.kind,
    input: partial.input,
    output: partial.output,
    status: partial.status || 'pending',
    duration_ms: partial.duration_ms,
    logs: partial.logs || [],
    span_id: partial.span_id || `span-${randomId()}`,
    trace_id: traceId,
    policy: partial.policy,
    policy_applied: partial.policy_applied,
    meta: {
      ...partial.meta,
      created_at: (partial.meta?.created_at as string | undefined) || now
    }
  }
}

/**
 * Check if a value is a valid span
 * 
 * @param value - Value to check
 * @returns Type predicate indicating if value is a Span
 */
export function isSpan(value: unknown): value is Span {
  return validateSpan(value).valid
}
