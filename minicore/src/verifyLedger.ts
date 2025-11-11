/**
 * Ledger verification utilities
 * Verifies NDJSON ledgers with spans, signatures, and structural integrity
 */

import { verifySpan, verifyHash } from './signer.ts'
import { validateSpan } from './validator.ts'
import type { SignedSpan } from './types.ts'

/**
 * Verification result for a single span
 */
export interface SpanVerificationResult {
  /** Span index in ledger */
  index: number
  /** Whether span is valid */
  valid: boolean
  /** Span ID if available */
  span_id?: string
  /** Trace ID if available */
  trace_id?: string
  /** Verification errors */
  errors: string[]
  /** Hash verification status */
  hashValid?: boolean
  /** Signature verification status */
  signatureValid?: boolean
  /** Schema validation status */
  schemaValid?: boolean
}

/**
 * Ledger verification result
 */
export interface LedgerVerificationResult {
  /** Whether entire ledger is valid */
  valid: boolean
  /** Total number of spans */
  totalSpans: number
  /** Number of valid spans */
  validSpans: number
  /** Number of invalid spans */
  invalidSpans: number
  /** Individual span results */
  spans: SpanVerificationResult[]
  /** Overall errors */
  errors: string[]
}

/**
 * Verify a single signed span
 * Checks hash, signature, and schema validation
 * 
 * @param span - Signed span to verify
 * @param publicKey - Optional public key to verify against
 * @returns Verification result
 */
export function verifySingleSpan(
  span: SignedSpan,
  publicKey?: string
): SpanVerificationResult {
  const errors: string[] = []
  let hashValid = false
  let signatureValid = false
  let schemaValid = false
  
  // Verify hash matches content
  try {
    hashValid = verifyHash(span)
    if (!hashValid) {
      errors.push('Hash does not match span content')
    }
  } catch (err) {
    errors.push(`Hash verification error: ${err instanceof Error ? err.message : String(err)}`)
  }
  
  // Verify signature
  try {
    signatureValid = verifySpan(span, publicKey)
    if (!signatureValid) {
      errors.push('Invalid signature')
    }
  } catch (err) {
    errors.push(`Signature verification error: ${err instanceof Error ? err.message : String(err)}`)
  }
  
  // Validate against schema
  try {
    const validation = validateSpan(span)
    schemaValid = validation.valid
    if (!schemaValid && validation.errors) {
      errors.push(...validation.errors)
    }
  } catch (err) {
    errors.push(`Schema validation error: ${err instanceof Error ? err.message : String(err)}`)
  }
  
  return {
    index: -1,
    valid: hashValid && signatureValid && schemaValid,
    span_id: span.span_id as string | undefined,
    trace_id: span.trace_id as string | undefined,
    errors,
    hashValid,
    signatureValid,
    schemaValid
  }
}

/**
 * Verify an NDJSON ledger
 * Parses and verifies each span in the ledger
 * 
 * @param ndjson - NDJSON string with one span per line
 * @param publicKey - Optional public key to verify signatures
 * @returns Ledger verification result
 */
export function verifyLedger(
  ndjson: string,
  publicKey?: string
): LedgerVerificationResult {
  const lines = ndjson.split('\n').filter(line => line.trim().length > 0)
  const spans: SpanVerificationResult[] = []
  const errors: string[] = []
  let validSpans = 0
  let invalidSpans = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    try {
      const span = JSON.parse(line) as SignedSpan
      const result = verifySingleSpan(span, publicKey)
      result.index = i
      
      if (result.valid) {
        validSpans++
      } else {
        invalidSpans++
      }
      
      spans.push(result)
    } catch (err) {
      // JSON parsing error
      const error = `Line ${i + 1}: Invalid JSON - ${err instanceof Error ? err.message : String(err)}`
      errors.push(error)
      spans.push({
        index: i,
        valid: false,
        errors: [error],
        hashValid: false,
        signatureValid: false,
        schemaValid: false
      })
      invalidSpans++
    }
  }
  
  return {
    valid: invalidSpans === 0 && errors.length === 0,
    totalSpans: lines.length,
    validSpans,
    invalidSpans,
    spans,
    errors
  }
}

/**
 * Verify ledger chain integrity
 * Checks that spans form a valid chain with prev hashes
 * 
 * @param ndjson - NDJSON ledger
 * @returns Chain verification result
 */
export function verifyChain(ndjson: string): {
  valid: boolean
  errors: string[]
  chainLength: number
} {
  const lines = ndjson.split('\n').filter(line => line.trim().length > 0)
  const errors: string[] = []
  let prevHash: string | null = null
  
  for (let i = 0; i < lines.length; i++) {
    try {
      const span = JSON.parse(lines[i]) as SignedSpan & { prev?: string }
      
      // Check if this span references the previous hash
      if (i > 0 && span.prev && span.prev !== prevHash) {
        errors.push(`Span ${i}: prev hash mismatch (expected ${prevHash}, got ${span.prev})`)
      }
      
      prevHash = span.hash
    } catch (err) {
      errors.push(`Span ${i}: JSON parse error - ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    chainLength: lines.length
  }
}

/**
 * Generate a verification report in human-readable format
 * 
 * @param result - Ledger verification result
 * @returns Formatted report string
 */
export function formatVerificationReport(result: LedgerVerificationResult): string {
  const lines: string[] = []
  
  lines.push('═'.repeat(60))
  lines.push('LEDGER VERIFICATION REPORT')
  lines.push('═'.repeat(60))
  lines.push('')
  lines.push(`Status: ${result.valid ? '✓ VALID' : '✗ INVALID'}`)
  lines.push(`Total Spans: ${result.totalSpans}`)
  lines.push(`Valid: ${result.validSpans}`)
  lines.push(`Invalid: ${result.invalidSpans}`)
  lines.push('')
  
  if (result.errors.length > 0) {
    lines.push('Overall Errors:')
    result.errors.forEach(err => lines.push(`  • ${err}`))
    lines.push('')
  }
  
  if (result.spans.length > 0) {
    lines.push('Span Details:')
    lines.push('─'.repeat(60))
    
    result.spans.forEach(span => {
      const status = span.valid ? '✓' : '✗'
      const id = span.span_id || `Span ${span.index + 1}`
      lines.push(`${status} ${id}`)
      
      if (span.trace_id) {
        lines.push(`  Trace: ${span.trace_id}`)
      }
      
      if (span.hashValid !== undefined) {
        lines.push(`  Hash: ${span.hashValid ? '✓' : '✗'}`)
      }
      
      if (span.signatureValid !== undefined) {
        lines.push(`  Signature: ${span.signatureValid ? '✓' : '✗'}`)
      }
      
      if (span.schemaValid !== undefined) {
        lines.push(`  Schema: ${span.schemaValid ? '✓' : '✗'}`)
      }
      
      if (span.errors.length > 0) {
        lines.push(`  Errors:`)
        span.errors.forEach(err => lines.push(`    • ${err}`))
      }
      
      lines.push('')
    })
  }
  
  lines.push('═'.repeat(60))
  
  return lines.join('\n')
}
