/**
 * Hash value object
 * Ensures all hashes are valid hex strings
 */

import { Result } from '../Result.js'
import { InvalidHashError } from '../errors/DomainErrors.js'

export class Hash {
  private static readonly HEX_PATTERN = /^[a-f0-9]{64}$/i // BLAKE3 produces 64 hex chars

  private constructor(private readonly _value: string) {}

  public static create(value: string): Result<Hash, InvalidHashError> {
    if (!this.isValid(value)) {
      return Result.fail(new InvalidHashError(value))
    }
    return Result.ok(new Hash(value))
  }

  public static createUnsafe(value: string): Hash {
    return new Hash(value)
  }

  private static isValid(value: string): boolean {
    return this.HEX_PATTERN.test(value)
  }

  public get value(): string {
    return this._value
  }

  public equals(other: Hash): boolean {
    return this._value.toLowerCase() === other._value.toLowerCase()
  }

  public toString(): string {
    return this._value
  }

  public toShort(length: number = 8): string {
    return this._value.slice(0, length)
  }
}
