/**
 * File System implementation of Ledger Repository
 * Uses JSONL files for storage
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { Result } from '../../domain/Result.js'
import { Cursor } from '../../domain/value-objects/Cursor.js'
import { TraceId } from '../../domain/value-objects/TraceId.js'
import { Hash } from '../../domain/value-objects/Hash.js'
import { 
  RepositoryError, 
  DuplicateAtomicError
} from '../../domain/errors/DomainErrors.js'
import { hashAtomic } from '../../crypto.js'
import type { Atomic } from '../../../types.js'
import type { 
  ILedgerRepository, 
  ScanOptions, 
  ScanResult, 
  QueryOptions,
  LedgerStats 
} from './ILedgerRepository.js'

export class FileSystemLedgerRepository implements ILedgerRepository {
  private ledgerPath: string
  private cache: Map<string, Atomic> = new Map()
  private cacheEnabled: boolean = false

  constructor(ledgerPath: string = './data/ledger.jsonl', enableCache: boolean = false) {
    this.ledgerPath = ledgerPath
    this.cacheEnabled = enableCache
    
    // Ensure directory exists
    const dir = dirname(ledgerPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }

  async append(atomic: Atomic): Promise<Result<Cursor, RepositoryError>> {
    try {
      // Validate atomic
      if (!atomic.entity_type || !atomic.this || !atomic.trace_id) {
        return Result.fail(
          new RepositoryError('Invalid atomic: missing required fields')
        )
      }

      // Add hash if not present
      if (!atomic.hash) {
        atomic.hash = hashAtomic(atomic)
      }

      const hash = Hash.createUnsafe(atomic.hash)

      // Check for duplicates
      const existsResult = await this.exists(hash)
      if (existsResult.isSuccess && existsResult.value) {
        return Result.fail(
          new RepositoryError(
            `Duplicate atomic: ${hash.toShort()}`,
            new DuplicateAtomicError(hash.value)
          )
        )
      }

      // Get current line count
      const lineCount = this.getLineCount()

      // Append to file
      const line = JSON.stringify(atomic) + '\n'
      appendFileSync(this.ledgerPath, line, 'utf-8')

      // Update cache if enabled
      if (this.cacheEnabled) {
        this.cache.set(atomic.hash, atomic)
      }

      return Result.ok(Cursor.createUnsafe(lineCount + 1))
    } catch (error) {
      return Result.fail(
        new RepositoryError('Failed to append atomic', error)
      )
    }
  }

  async findByHash(hash: Hash): Promise<Result<Atomic | null, RepositoryError>> {
    try {
      // Check cache first
      if (this.cacheEnabled && this.cache.has(hash.value)) {
        return Result.ok(this.cache.get(hash.value) || null)
      }

      if (!existsSync(this.ledgerPath)) {
        return Result.ok(null)
      }

      const content = readFileSync(this.ledgerPath, 'utf-8')
      const lines = content.trim().split('\n').filter(line => line.length > 0)

      for (const line of lines) {
        try {
          const atomic = JSON.parse(line)
          if (atomic.curr_hash === hash.value) {
            if (this.cacheEnabled) {
              this.cache.set(hash.value, atomic)
            }
            return Result.ok(atomic)
          }
        } catch {
          // Skip invalid lines
        }
      }

      return Result.ok(null)
    } catch (error) {
      return Result.fail(
        new RepositoryError('Failed to find atomic by hash', error)
      )
    }
  }

  async findByTraceId(traceId: TraceId): Promise<Result<Atomic[], RepositoryError>> {
    return this.query({ traceId })
  }

  async scan(options: ScanOptions): Promise<Result<ScanResult, RepositoryError>> {
    try {
      if (!existsSync(this.ledgerPath)) {
        return Result.ok({
          atomics: [],
          hasMore: false
        })
      }

      const content = readFileSync(this.ledgerPath, 'utf-8')
      const lines = content.trim().split('\n').filter(line => line.length > 0)

      const limit = options.limit || 10
      const startIdx = options.cursor ? options.cursor.toNumber() : 0

      const atomics: Atomic[] = []

      for (let i = startIdx; i < lines.length && atomics.length < limit; i++) {
        try {
          const atomic = JSON.parse(lines[i])

          // Apply filters
          if (options.status && atomic.status !== options.status) {
            continue
          }

          if (options.entityType && atomic.entity_type !== options.entityType) {
            continue
          }

          atomics.push(atomic)
        } catch {
          // Skip invalid lines
        }
      }

      const nextIdx = startIdx + atomics.length
      const hasMore = nextIdx < lines.length

      return Result.ok({
        atomics,
        nextCursor: hasMore ? Cursor.createUnsafe(nextIdx) : undefined,
        hasMore
      })
    } catch (error) {
      return Result.fail(
        new RepositoryError('Failed to scan ledger', error)
      )
    }
  }

  async query(options: QueryOptions): Promise<Result<Atomic[], RepositoryError>> {
    try {
      if (!existsSync(this.ledgerPath)) {
        return Result.ok([])
      }

      const content = readFileSync(this.ledgerPath, 'utf-8')
      const lines = content.trim().split('\n').filter(line => line.length > 0)

      const results: Atomic[] = []

      for (const line of lines) {
        try {
          const atomic = JSON.parse(line)

          let matches = true

          if (options.traceId && atomic.metadata?.trace_id !== options.traceId.value) {
            matches = false
          }

          if (options.entityType && atomic.entity_type !== options.entityType) {
            matches = false
          }

          if (options.ownerId && atomic.metadata?.owner_id !== options.ownerId) {
            matches = false
          }

          if (options.tenantId && atomic.metadata?.tenant_id !== options.tenantId) {
            matches = false
          }

          if (options.fromDate && atomic.metadata?.created_at) {
            const createdAt = new Date(atomic.metadata.created_at)
            if (createdAt < options.fromDate) {
              matches = false
            }
          }

          if (options.toDate && atomic.metadata?.created_at) {
            const createdAt = new Date(atomic.metadata.created_at)
            if (createdAt > options.toDate) {
              matches = false
            }
          }

          if (matches) {
            results.push(atomic)
          }
        } catch {
          // Skip invalid lines
        }
      }

      return Result.ok(results)
    } catch (error) {
      return Result.fail(
        new RepositoryError('Failed to query ledger', error)
      )
    }
  }

  async getStats(): Promise<Result<LedgerStats, RepositoryError>> {
    try {
      if (!existsSync(this.ledgerPath)) {
        return Result.ok({
          total: 0,
          byType: new Map(),
          byStatus: new Map()
        })
      }

      const content = readFileSync(this.ledgerPath, 'utf-8')
      const lines = content.trim().split('\n').filter(line => line.length > 0)

      const byType = new Map<string, number>()
      const byStatus = new Map<string, number>()
      let oldestTimestamp: Date | undefined
      let newestTimestamp: Date | undefined

      for (const line of lines) {
        try {
          const atomic = JSON.parse(line)

          // Count by type
          const typeCount = byType.get(atomic.entity_type) || 0
          byType.set(atomic.entity_type, typeCount + 1)

          // Count by status
          if (atomic.status) {
            const statusCount = byStatus.get(atomic.status) || 0
            byStatus.set(atomic.status, statusCount + 1)
          }

          // Track timestamps
          if (atomic.metadata?.created_at) {
            const timestamp = new Date(atomic.metadata.created_at)
            if (!oldestTimestamp || timestamp < oldestTimestamp) {
              oldestTimestamp = timestamp
            }
            if (!newestTimestamp || timestamp > newestTimestamp) {
              newestTimestamp = timestamp
            }
          }
        } catch {
          // Skip invalid lines
        }
      }

      return Result.ok({
        total: lines.length,
        byType,
        byStatus,
        oldestTimestamp,
        newestTimestamp
      })
    } catch (error) {
      return Result.fail(
        new RepositoryError('Failed to get stats', error)
      )
    }
  }

  async exists(hash: Hash): Promise<Result<boolean, RepositoryError>> {
    const result = await this.findByHash(hash)
    if (result.isFailure) {
      return Result.fail(result.error)
    }
    return Result.ok(result.value !== null)
  }

  private getLineCount(): number {
    if (!existsSync(this.ledgerPath)) {
      return 0
    }
    const content = readFileSync(this.ledgerPath, 'utf-8')
    return content.trim().split('\n').filter(line => line.length > 0).length
  }

  // Cache management
  public clearCache(): void {
    this.cache.clear()
  }

  public getCacheSize(): number {
    return this.cache.size
  }
}
