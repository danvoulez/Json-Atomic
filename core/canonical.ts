/**
 * Canonical JSON serialization
 * Ensures deterministic representation for hashing
 * 
 * CANONICALIZATION STRATEGY:
 * This implementation follows a simplified approach similar to RFC 8785 (JCS)
 * with the following characteristics:
 * 
 * 1. Object keys are sorted lexicographically
 * 2. No whitespace between tokens
 * 3. Unicode strings are preserved as-is (not normalized to NFC)
 * 4. Numbers are converted using JavaScript's String() function
 * 5. Booleans and null use lowercase representation
 * 
 * DIFFERENCES FROM RFC 8785:
 * - Unicode: This implementation does NOT normalize to NFC. Strings are used as provided.
 *   For full RFC 8785 compliance, apply .normalize('NFC') to all string values.
 * - Numbers: Uses JavaScript's default string conversion. For scientific notation
 *   and edge cases, this may differ from RFC 8785's ES6 serialization.
 * 
 * RECOMMENDATION: If cross-language compatibility is critical, consider:
 * - Normalizing all Unicode strings to NFC before canonicalization
 * - Using a full RFC 8785 implementation
 * 
 * For now, this implementation prioritizes simplicity and determinism within
 * the TypeScript/JavaScript ecosystem.
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
