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
 * - **Unicode normalization**: Strings SHOULD be normalized to NFC (Normalization Form Canonical)
 *   before being passed to this function for maximum cross-platform compatibility.
 *   This function does NOT automatically normalize strings. Applications must ensure
 *   input strings are pre-normalized if deterministic hashing across different Unicode
 *   representations is required.
 * 
 * - **Floating point**: Numbers are converted to strings using JavaScript's
 *   default toString(), which may produce platform-specific representations
 *   for edge cases (e.g., -0, very large exponents). For cross-platform determinism,
 *   consider using integers or string representations for precise numeric values.
 * 
 * - **RFC 8785 Compliance**: This is a custom implementation, NOT fully RFC 8785 compliant.
 *   Main differences:
 *   - No automatic Unicode normalization (must be done by caller)
 *   - Numbers use JavaScript toString() instead of IEEE 754 number serialization
 *   - No special handling for -0 vs +0
 * 
 * For production cross-language compatibility, consider:
 * 1. Using a standard JCS library, OR
 * 2. Documenting exact serialization requirements, OR
 * 3. Using integers/strings for all numeric values
 * 
 * @example
 * // Recommended: Normalize strings before canonicalization
 * const input = { name: "café" }; // May be represented different ways in Unicode
 * const normalized = { name: input.name.normalize('NFC') };
 * const canonical = canonicalize(normalized);
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
