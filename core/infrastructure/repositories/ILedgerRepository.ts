/**
 * Ledger Repository Interface
 * Defines the contract for ledger storage operations
 */

import { Result } from '../../domain/Result.js'
import { Cursor } from '../../domain/value-objects/Cursor.js'
import { TraceId } from '../../domain/value-objects/TraceId.js'
import { Hash } from '../../domain/value-objects/Hash.js'
import { RepositoryError } from '../../domain/errors/DomainErrors.js'
import type { Atomic } from '../../../types.js'

export interface ScanOptions {
  limit?: number
  cursor?: Cursor
  status?: string
  entityType?: string
}

export interface ScanResult {
  atomics: Atomic[]
  nextCursor?: Cursor
  hasMore: boolean
}

export interface QueryOptions {
  traceId?: TraceId
  entityType?: string
  ownerId?: string
  tenantId?: string
  fromDate?: Date
  toDate?: Date
}

export interface LedgerStats {
  total: number
  byType: Map<string, number>
  byStatus: Map<string, number>
  oldestTimestamp?: Date
  newestTimestamp?: Date
}

/**
 * Repository interface for ledger operations
 * Implementations can use file system, PostgreSQL, or any other storage
 */
export interface ILedgerRepository {
  /**
   * Append an atomic to the ledger
   * @returns Cursor pointing to the appended atomic
   */
  append(atomic: Atomic): Promise<Result<Cursor, RepositoryError>>

  /**
   * Find an atomic by its hash
   */
  findByHash(hash: Hash): Promise<Result<Atomic | null, RepositoryError>>

  /**
   * Find atomics by trace ID
   */
  findByTraceId(traceId: TraceId): Promise<Result<Atomic[], RepositoryError>>

  /**
   * Scan atomics with pagination and filters
   */
  scan(options: ScanOptions): Promise<Result<ScanResult, RepositoryError>>

  /**
   * Query atomics with complex filters
   */
  query(options: QueryOptions): Promise<Result<Atomic[], RepositoryError>>

  /**
   * Get ledger statistics
   */
  getStats(): Promise<Result<LedgerStats, RepositoryError>>

  /**
   * Check if an atomic with the given hash exists
   */
  exists(hash: Hash): Promise<Result<boolean, RepositoryError>>
}
