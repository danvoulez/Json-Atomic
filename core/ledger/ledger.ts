/**
 * Ledger implementation for append-only atomic storage
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import type { Atomic, LedgerScanOptions, LedgerQueryOptions } from '../../types.js'
import { hashAtomic } from '../crypto.js'

export class Ledger {
  private ledgerPath: string
  private cursor: number = 0
  
  constructor(ledgerPath: string = './data/ledger.jsonl') {
    this.ledgerPath = ledgerPath
    
    // Ensure directory exists
    const dir = dirname(ledgerPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    
    // Initialize cursor
    if (existsSync(ledgerPath)) {
      const content = readFileSync(ledgerPath, 'utf-8')
      const lines = content.trim().split('\n').filter(line => line.length > 0)
      this.cursor = lines.length
    }
  }
  
  /**
   * Append an atomic to the ledger
   */
  async append(atomic: Atomic): Promise<string> {
    // Validate atomic has required fields
    if (!atomic.entity_type || !atomic.this || !atomic.trace_id) {
      throw new Error('Invalid atomic: missing required fields')
    }
    
    // Add hash if not present
    if (!atomic.hash) {
      atomic.hash = hashAtomic(atomic)
    }
    
    // Check for duplicates
    const existing = await this.query({ trace_id: atomic.trace_id })
    if (existing.length > 0 && existing.some(a => a.hash === atomic.hash)) {
      throw new Error('Duplicate atomic detected')
    }
    
    // Append to file
    const line = JSON.stringify(atomic) + '\n'
    appendFileSync(this.ledgerPath, line, 'utf-8')
    
    this.cursor++
    return String(this.cursor)
  }
  
  /**
   * Scan ledger with pagination
   */
  async scan(options: LedgerScanOptions = {}): Promise<{
    atomics: Atomic[]
    next_cursor?: string
  }> {
    if (!existsSync(this.ledgerPath)) {
      return { atomics: [] }
    }
    
    const content = readFileSync(this.ledgerPath, 'utf-8')
    const lines = content.trim().split('\n').filter(line => line.length > 0)
    
    const limit = options.limit || 10
    const startIdx = options.cursor ? parseInt(options.cursor) : 0
    
    let atomics: Atomic[] = []
    
    for (let i = startIdx; i < lines.length && atomics.length < limit; i++) {
      try {
        const atomic = JSON.parse(lines[i])
        
        // Apply filters
        if (options.status && atomic.status !== options.status) {
          continue
        }
        
        atomics.push(atomic)
      } catch (err) {
        console.error(`Error parsing line ${i + 1}:`, err)
      }
    }
    
    const nextIdx = startIdx + atomics.length
    const hasMore = nextIdx < lines.length
    
    return {
      atomics,
      next_cursor: hasMore ? String(nextIdx) : undefined
    }
  }
  
  /**
   * Query ledger by filters
   */
  async query(options: LedgerQueryOptions): Promise<Atomic[]> {
    if (!existsSync(this.ledgerPath)) {
      return []
    }
    
    const content = readFileSync(this.ledgerPath, 'utf-8')
    const lines = content.trim().split('\n').filter(line => line.length > 0)
    
    const results: Atomic[] = []
    
    for (const line of lines) {
      try {
        const atomic = JSON.parse(line)
        
        let matches = true
        
        if (options.trace_id && atomic.metadata?.trace_id !== options.trace_id) {
          matches = false
        }
        
        if (options.entity_type && atomic.entity_type !== options.entity_type) {
          matches = false
        }
        
        if (options.owner_id && atomic.metadata?.owner_id !== options.owner_id) {
          matches = false
        }
        
        if (options.tenant_id && atomic.metadata?.tenant_id !== options.tenant_id) {
          matches = false
        }
        
        if (matches) {
          results.push(atomic)
        }
      } catch (err) {
        console.error('Error parsing line:', err)
      }
    }
    
    return results
  }
  
  /**
   * Get ledger statistics
   */
  async getStats(): Promise<{
    total: number
    by_type: Record<string, number>
    by_status: Record<string, number>
  }> {
    if (!existsSync(this.ledgerPath)) {
      return { total: 0, by_type: {}, by_status: {} }
    }
    
    const content = readFileSync(this.ledgerPath, 'utf-8')
    const lines = content.trim().split('\n').filter(line => line.length > 0)
    
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    
    for (const line of lines) {
      try {
        const atomic = JSON.parse(line)
        
        byType[atomic.entity_type] = (byType[atomic.entity_type] || 0) + 1
        
        if (atomic.status) {
          byStatus[atomic.status] = (byStatus[atomic.status] || 0) + 1
        }
      } catch (err) {
        // Skip invalid lines
      }
    }
    
    return {
      total: lines.length,
      by_type: byType,
      by_status: byStatus
    }
  }
}
