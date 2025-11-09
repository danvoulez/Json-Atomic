/**
 * Canonical JSON serialization for deterministic hashing
 * 
 * This implementation follows a simplified approach similar to RFC 8785 (JCS)
 * with the following rules:
 * 
 * 1. Object keys are sorted lexicographically
 * 2. No whitespace between elements
 * 3. Consistent string escaping via JSON.stringify
 * 4. Numbers are serialized as-is (finite numbers only)
 * 5. Arrays preserve order
 * 
 * IMPORTANT NOTES:
 * - Unicode normalization: Strings are NOT normalized to NFC/NFD.
 *   Applications should normalize input before canonicalization if needed.
 * - Floating point: Numbers are converted to strings using JavaScript's
 *   default toString(), which may produce platform-specific representations
 *   for edge cases. For cross-platform determinism, consider using integers
 *   or string representations for precise numeric values.
 * - This is a custom implementation, NOT fully RFC 8785 compliant.
 * 
 * For production cross-language compatibility, consider using a standard
 * JCS library or documenting exact serialization requirements.
 */

export function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null'
  }

  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false'
  }

  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) {
      throw new Error('Cannot canonicalize non-finite number')
    }
    return String(obj)
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj)
  }

  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalize(item))
    return '[' + items.join(',') + ']'
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort()
    const pairs = keys.map(key => {
      const value = (obj as Record<string, unknown>)[key]
      return JSON.stringify(key) + ':' + canonicalize(value)
    })
    return '{' + pairs.join(',') + '}'
  }

  throw new Error(`Cannot canonicalize type: ${typeof obj}`)
}
