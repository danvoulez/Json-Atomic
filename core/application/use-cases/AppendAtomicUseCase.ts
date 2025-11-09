/**
 * Use Case: Append Atomic to Ledger
 * Implements the business logic for appending an atomic with validation
 */

import { Result } from '../../domain/Result.js'
import { Cursor } from '../../domain/value-objects/Cursor.js'
import { Hash } from '../../domain/value-objects/Hash.js'
import { 
  InvalidAtomicError, 
  ValidationError,
  RepositoryError 
} from '../../domain/errors/DomainErrors.js'
import { hashAtomic, signAtomic } from '../../crypto.js'
import type { Atomic } from '../../../types.js'
import type { ILedgerRepository } from '../../infrastructure/repositories/ILedgerRepository.js'

export interface AppendAtomicCommand {
  atomic: Atomic
  signWithKey?: string
  validateOnly?: boolean
}

export interface AppendAtomicResult {
  cursor: Cursor
  hash: Hash
  signed: boolean
}

export class AppendAtomicUseCase {
  constructor(
    private readonly ledgerRepository: ILedgerRepository
  ) {}

  async execute(command: AppendAtomicCommand): Promise<Result<AppendAtomicResult, InvalidAtomicError | ValidationError | RepositoryError>> {
    // Validate atomic structure
    const validationResult = this.validateAtomic(command.atomic)
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error)
    }

    // If validation only, return early
    if (command.validateOnly) {
      const hash = Hash.createUnsafe(hashAtomic(command.atomic))
      return Result.ok({
        cursor: Cursor.createUnsafe('0'),
        hash,
        signed: false
      })
    }

    // Ensure atomic has a hash
    if (!command.atomic.hash) {
      command.atomic.hash = hashAtomic(command.atomic)
    }

    const hash = Hash.createUnsafe(command.atomic.hash)

    // Sign if key provided
    let signed = false
    if (command.signWithKey) {
      const signResult = await signAtomic(command.atomic, command.signWithKey)
      command.atomic.hash = signResult.hash
      command.atomic.signature = signResult.signature
      signed = true
    }

    // Append to ledger
    const appendResult = await this.ledgerRepository.append(command.atomic)
    if (appendResult.isFailure) {
      return Result.fail(appendResult.error)
    }

    return Result.ok({
      cursor: appendResult.value,
      hash,
      signed
    })
  }

  private validateAtomic(atomic: Atomic): Result<void, ValidationError> {
    const errors: string[] = []

    // Required fields
    if (!atomic.entity_type) {
      errors.push('entity_type is required')
    } else {
      const validTypes = ['file', 'function', 'law', 'decision', 'agent', 'contract']
      if (!validTypes.includes(atomic.entity_type)) {
        errors.push(`entity_type must be one of: ${validTypes.join(', ')}`)
      }
    }

    if (!atomic.this) {
      errors.push('this field is required')
    }

    if (!atomic.did) {
      errors.push('did is required')
    } else {
      if (!atomic.did.actor) {
        errors.push('did.actor is required')
      }
      if (!atomic.did.action) {
        errors.push('did.action is required')
      }
    }

    if (!atomic.trace_id) {
      errors.push('trace_id is required')
    }

    if (!atomic.metadata) {
      errors.push('metadata is required')
    } else {
      if (!atomic.metadata.created_at) {
        errors.push('metadata.created_at is required')
      }
    }

    if (errors.length > 0) {
      return Result.fail(new ValidationError('Atomic validation failed', errors))
    }

    return Result.ok(undefined)
  }
}
