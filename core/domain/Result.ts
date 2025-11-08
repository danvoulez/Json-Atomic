/**
 * Result pattern for functional error handling
 * Inspired by Rust's Result<T, E> and functional programming principles
 */

export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  public static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined)
  }

  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error)
  }

  public get isSuccess(): boolean {
    return this._isSuccess
  }

  public get isFailure(): boolean {
    return !this._isSuccess
  }

  public get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from a failed Result')
    }
    return this._value as T
  }

  public get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from a successful Result')
    }
    return this._error as E
  }

  public getValue(): T | undefined {
    return this._value
  }

  public getError(): E | undefined {
    return this._error
  }

  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isSuccess) {
      return Result.ok(fn(this.value))
    }
    return Result.fail(this._error as E)
  }

  public mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isFailure) {
      return Result.fail(fn(this.error))
    }
    return Result.ok(this._value as T)
  }

  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isSuccess) {
      return fn(this.value)
    }
    return Result.fail(this._error as E)
  }

  public match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    return this.isSuccess ? onSuccess(this.value) : onFailure(this.error)
  }

  public async matchAsync<U>(
    onSuccess: (value: T) => Promise<U>,
    onFailure: (error: E) => Promise<U>
  ): Promise<U> {
    return this.isSuccess ? onSuccess(this.value) : onFailure(this.error)
  }

  public unwrapOr(defaultValue: T): T {
    return this.isSuccess ? this.value : defaultValue
  }

  public static combine<T, E = Error>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = []
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail(result.error)
      }
      values.push(result.value)
    }
    return Result.ok(values)
  }
}
