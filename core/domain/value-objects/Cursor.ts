/**
 * Cursor value object for pagination
 */

import { Result } from '../Result.js'
import { DomainError } from '../errors/DomainErrors.js'

export class InvalidCursorError extends DomainError {
  constructor(cursor: string) {
    super(`Invalid cursor: ${cursor}`)
  }
}

export class Cursor {
  private constructor(private readonly _value: string) {}

  public static create(value: string | number): Result<Cursor, InvalidCursorError> {
    const stringValue = String(value)
    
    if (stringValue.length === 0) {
      return Result.fail(new InvalidCursorError(stringValue))
    }

    return Result.ok(new Cursor(stringValue))
  }

  public static createUnsafe(value: string | number): Cursor {
    return new Cursor(String(value))
  }

  public get value(): string {
    return this._value
  }

  public toNumber(): number {
    return parseInt(this._value, 10)
  }

  public equals(other: Cursor): boolean {
    return this._value === other._value
  }

  public toString(): string {
    return this._value
  }
}
