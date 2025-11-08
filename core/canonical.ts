/**
 * Canonical JSON serialization
 * Ensures deterministic representation for hashing
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
