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
    // Simple UUID v4 generation
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    return new TraceId(uuid)
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
