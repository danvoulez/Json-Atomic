/**
 * Domain errors for JSON✯Atomic
 */

export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Atomic Errors
export class InvalidAtomicError extends DomainError {
  constructor(reason: string) {
    super(`Invalid atomic: ${reason}`)
  }
}

export class DuplicateAtomicError extends DomainError {
  constructor(hash: string) {
    super(`Duplicate atomic with hash: ${hash}`)
  }
}

export class InvalidHashError extends DomainError {
  constructor(hash: string) {
    super(`Invalid hash format: ${hash}`)
  }
}

export class InvalidSignatureError extends DomainError {
  constructor(message: string = 'Invalid signature') {
    super(message)
  }
}

// Ledger Errors
export class LedgerError extends DomainError {
  constructor(message: string) {
    super(`Ledger error: ${message}`)
  }
}

export class LedgerNotFoundError extends DomainError {
  constructor(path: string) {
    super(`Ledger not found: ${path}`)
  }
}

export class LedgerCorruptedError extends DomainError {
  constructor(line: number, reason: string) {
    super(`Ledger corrupted at line ${line}: ${reason}`)
  }
}

// Repository Errors
export class RepositoryError extends DomainError {
  constructor(message: string, public readonly cause?: unknown) {
    super(`Repository error: ${message}`)
  }
}

// Validation Errors
export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly errors: string[] = []
  ) {
    super(message)
  }
}

// Authorization Errors
export class AuthenticationError extends DomainError {
  constructor(message: string = 'Authentication failed') {
    super(message)
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid credentials')
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('Token expired')
  }
}

// Configuration Errors
export class ConfigurationError extends DomainError {
  constructor(message: string) {
    super(`Configuration error: ${message}`)
  }
}
