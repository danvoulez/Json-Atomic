/**
 * TraceId value object
 * Ensures all trace IDs are valid UUIDs or custom format
 */

import { Result } from '../Result.js'
import { DomainError } from '../errors/DomainErrors.js'

export class InvalidTraceIdError extends DomainError {
  constructor(traceId: string) {
    super(`Invalid trace ID: ${traceId}`)
  }
}

export class TraceId {
  private static readonly UUID_PATTERN = 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  private constructor(private readonly _value: string) {}

  public static create(value: string): Result<TraceId, InvalidTraceIdError> {
    if (!this.isValid(value)) {
      return Result.fail(new InvalidTraceIdError(value))
    }
    return Result.ok(new TraceId(value))
  }

  public static createUnsafe(value: string): TraceId {
    return new TraceId(value)
  }

  public static generate(): TraceId {
    // Cryptographically secure UUID v4 generation using Node's crypto
    // Note: For browser environments, use crypto.getRandomValues()
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      // Modern Node.js or browser with crypto.randomUUID()
      return new TraceId(crypto.randomUUID())
    } else {
      // Fallback: Use crypto.getRandomValues() for secure random bytes
      const bytes = new Uint8Array(16)
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes)
      } else if (typeof require !== 'undefined') {
        // Node.js fallback
        const nodeCrypto = require('crypto')
        nodeCrypto.randomFillSync(bytes)
      } else {
        throw new Error('No cryptographically secure random source available')
      }
      
      // Set version (4) and variant bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      
      // Convert to UUID string
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
      const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
      return new TraceId(uuid)
    }
  }

  private static isValid(value: string): boolean {
    return this.UUID_PATTERN.test(value) || value.length > 0
  }

  public get value(): string {
    return this._value
  }

  public equals(other: TraceId): boolean {
    return this._value === other._value
  }

  public toString(): string {
    return this._value
  }
}
