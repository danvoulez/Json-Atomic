/**
 * Streaming Ledger Verifier
 * 
 * Verifies ledger integrity with:
 * - Streaming line-by-line processing (no memory exhaustion)
 * - Hash computation and verification
 * - Signature verification
 * - Chain validation (prev hash checking)
 * - Trace ID filtering and fork detection
 * - Structured error reporting
 */

import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { blake3 } from '@noble/hashes/blake3'
import { ed25519 } from '@noble/curves/ed25519'
import { canonicalize } from '../canonical.js'
import type { Atomic, LedgerError, VerificationResult } from '../../types.js'

const MAX_LINE_SIZE = 10 * 1024 * 1024 // 10MB per line
const HASH_CONTEXT = 'JsonAtomic/v1'

export interface VerifyOptions {
  verbose?: boolean
  stopOnError?: boolean
  publicKeyHex?: string
  traceId?: string
  maxLineSize?: number
}

export interface VerifySummary {
  total: number
  valid: number
  invalid: number
  unsigned: number
  results: VerificationResult[]
  forks?: Map<string, string[]> // trace_id -> list of hashes (forks detected)
}

export class LedgerVerifier {
  private publicKey: Uint8Array | null = null
  
  constructor(publicKeyHex?: string) {
    if (publicKeyHex) {
      this.publicKey = Uint8Array.from(
        Buffer.from(publicKeyHex, 'hex')
      )
    }
  }

  /**
   * Verify ledger file with streaming
   */
  async verifyFile(
    ledgerPath: string,
    options: VerifyOptions = {}
  ): Promise<VerifySummary> {
    const results: VerificationResult[] = []
    const chainMap = new Map<string, string>() // trace_id -> last hash
    const forks = new Map<string, string[]>() // trace_id -> list of hashes
    
    let lineNumber = 0
    let valid = 0
    let invalid = 0
    let unsigned = 0
    let prevHash: string | null = null
    
    const publicKey = options.publicKeyHex 
      ? Uint8Array.from(Buffer.from(options.publicKeyHex, 'hex'))
      : this.publicKey
    
    const maxLineSize = options.maxLineSize || MAX_LINE_SIZE

    return new Promise((resolve, reject) => {
      const stream = createReadStream(ledgerPath, { encoding: 'utf-8' })
      const rl = createInterface({ input: stream, crlfDelay: Infinity })
      
      let stopped = false

      rl.on('line', (line: string) => {
        if (stopped) return
        
        lineNumber++
        
        // Check line size
        if (line.length > maxLineSize) {
          const error: LedgerError = {
            code: 'LINE_TOO_LARGE',
            message: `Line exceeds maximum size of ${maxLineSize} bytes`,
            details: { size: line.length }
          }
          
          invalid++
          results.push({
            line: lineNumber,
            valid: false,
            hash: 'error',
            error
          })
          
          if (options.verbose) {
            console.log(`Line ${lineNumber}: ❌ ${error.code} - ${error.message}`)
          }
          
          if (options.stopOnError) {
            stopped = true
            rl.close()
          }
          return
        }
        
        try {
          const atomic: Atomic = JSON.parse(line)
          
          // Filter by trace_id if specified
          if (options.traceId && atomic.trace_id !== options.traceId) {
            return // Skip this line
          }
          
          // Verify hash exists
          if (!atomic.hash) {
            const error: LedgerError = {
              code: 'MISSING_HASH',
              message: 'Atomic does not have hash field'
            }
            
            unsigned++
            results.push({
              line: lineNumber,
              valid: false,
              hash: 'missing',
              trace_id: atomic.trace_id,
              error
            })
            
            if (options.verbose) {
              console.log(`Line ${lineNumber}: ⚠️  unsigned (trace_id: ${atomic.trace_id})`)
            }
            return
          }
          
          // Compute and verify hash
          const atomicForHash = { ...atomic }
          delete (atomicForHash as any).hash
          delete (atomicForHash as any).signature
          
          const canonical = canonicalize(atomicForHash)
          const computedHash = Buffer.from(
            blake3(new TextEncoder().encode(canonical), { context: HASH_CONTEXT })
          ).toString('hex')
          
          if (computedHash !== atomic.hash) {
            const error: LedgerError = {
              code: 'HASH_MISMATCH',
              message: 'Computed hash does not match stored hash',
              details: { expected: atomic.hash, computed: computedHash }
            }
            
            invalid++
            results.push({
              line: lineNumber,
              valid: false,
              hash: atomic.hash,
              trace_id: atomic.trace_id,
              error
            })
            
            if (options.verbose) {
              console.log(`Line ${lineNumber}: ❌ hash mismatch (trace_id: ${atomic.trace_id})`)
            }
            
            if (options.stopOnError) {
              stopped = true
              rl.close()
            }
            return
          }
          
          // Verify prev chain within same file
          if (atomic.prev) {
            if (prevHash && atomic.prev !== prevHash) {
              const error: LedgerError = {
                code: 'CHAIN_BROKEN',
                message: 'Previous hash does not match last atomic hash',
                details: { expected: prevHash, found: atomic.prev }
              }
              
              invalid++
              results.push({
                line: lineNumber,
                valid: false,
                hash: atomic.hash,
                trace_id: atomic.trace_id,
                error
              })
              
              if (options.verbose) {
                console.log(`Line ${lineNumber}: ❌ chain broken (trace_id: ${atomic.trace_id})`)
              }
              
              if (options.stopOnError) {
                stopped = true
                rl.close()
              }
              return
            }
          } else {
            // Genesis: should only be first atomic without prev
            if (lineNumber > 1) {
              const error: LedgerError = {
                code: 'INVALID_GENESIS',
                message: 'Genesis atomic (without prev) found after line 1',
                details: { line: lineNumber }
              }
              
              invalid++
              results.push({
                line: lineNumber,
                valid: false,
                hash: atomic.hash,
                trace_id: atomic.trace_id,
                error
              })
              
              if (options.verbose) {
                console.log(`Line ${lineNumber}: ❌ invalid genesis (trace_id: ${atomic.trace_id})`)
              }
              
              if (options.stopOnError) {
                stopped = true
                rl.close()
              }
              return
            }
          }
          
          // Detect forks by trace_id
          if (atomic.trace_id) {
            const lastHash = chainMap.get(atomic.trace_id)
            if (lastHash) {
              // Check if this continues the chain or is a fork
              if (atomic.prev && atomic.prev !== lastHash) {
                // Fork detected!
                if (!forks.has(atomic.trace_id)) {
                  forks.set(atomic.trace_id, [lastHash])
                }
                forks.get(atomic.trace_id)!.push(atomic.hash)
                
                const error: LedgerError = {
                  code: 'FORK_DETECTED',
                  message: 'Multiple chains detected for same trace_id',
                  details: { trace_id: atomic.trace_id, hashes: forks.get(atomic.trace_id) }
                }
                
                invalid++
                results.push({
                  line: lineNumber,
                  valid: false,
                  hash: atomic.hash,
                  trace_id: atomic.trace_id,
                  error
                })
                
                if (options.verbose) {
                  console.log(`Line ${lineNumber}: ❌ fork detected (trace_id: ${atomic.trace_id})`)
                }
                
                if (options.stopOnError) {
                  stopped = true
                  rl.close()
                }
                return
              }
            }
            chainMap.set(atomic.trace_id, atomic.hash)
          }
          
          // Verify signature if present
          if (atomic.signature) {
            if (!atomic.signature.alg || atomic.signature.alg !== 'Ed25519') {
              const error: LedgerError = {
                code: 'INVALID_SIGNATURE_ALG',
                message: 'Invalid or missing signature algorithm',
                details: { alg: atomic.signature.alg }
              }
              
              invalid++
              results.push({
                line: lineNumber,
                valid: false,
                hash: atomic.hash,
                trace_id: atomic.trace_id,
                error
              })
              
              if (options.verbose) {
                console.log(`Line ${lineNumber}: ❌ invalid signature algorithm (trace_id: ${atomic.trace_id})`)
              }
              
              if (options.stopOnError) {
                stopped = true
                rl.close()
              }
              return
            }
            
            const keyToUse = publicKey || (atomic.signature.public_key 
              ? Uint8Array.from(Buffer.from(atomic.signature.public_key, 'hex'))
              : null)
            
            if (keyToUse) {
              try {
                const signatureBytes = Uint8Array.from(Buffer.from(atomic.signature.sig, 'hex'))
                const isValidSig = ed25519.verify(
                  signatureBytes,
                  new TextEncoder().encode(atomic.hash),
                  keyToUse
                )
                
                if (!isValidSig) {
                  const error: LedgerError = {
                    code: 'INVALID_SIGNATURE',
                    message: 'Signature verification failed'
                  }
                  
                  invalid++
                  results.push({
                    line: lineNumber,
                    valid: false,
                    hash: atomic.hash,
                    trace_id: atomic.trace_id,
                    error
                  })
                  
                  if (options.verbose) {
                    console.log(`Line ${lineNumber}: ❌ invalid signature (trace_id: ${atomic.trace_id})`)
                  }
                  
                  if (options.stopOnError) {
                    stopped = true
                    rl.close()
                  }
                  return
                }
              } catch (err) {
                const error: LedgerError = {
                  code: 'SIGNATURE_VERIFY_ERROR',
                  message: 'Error during signature verification',
                  details: { error: String(err) }
                }
                
                invalid++
                results.push({
                  line: lineNumber,
                  valid: false,
                  hash: atomic.hash,
                  trace_id: atomic.trace_id,
                  error
                })
                
                if (options.verbose) {
                  console.log(`Line ${lineNumber}: ❌ signature error (trace_id: ${atomic.trace_id})`)
                }
                
                if (options.stopOnError) {
                  stopped = true
                  rl.close()
                }
                return
              }
            } else {
              // Signature present but no key to verify
              unsigned++
              results.push({
                line: lineNumber,
                valid: false,
                hash: atomic.hash,
                trace_id: atomic.trace_id,
                error: {
                  code: 'NO_PUBLIC_KEY',
                  message: 'Signature present but no public key provided for verification'
                }
              })
              
              if (options.verbose) {
                console.log(`Line ${lineNumber}: ⚠️  cannot verify signature - no key (trace_id: ${atomic.trace_id})`)
              }
              return
            }
          } else {
            unsigned++
          }
          
          // All checks passed
          valid++
          results.push({
            line: lineNumber,
            valid: true,
            hash: atomic.hash,
            trace_id: atomic.trace_id
          })
          
          if (options.verbose) {
            console.log(`Line ${lineNumber}: ✅ valid (hash: ${atomic.hash.slice(0, 12)}...)`)
          }
          
          // Update prev for next iteration
          prevHash = atomic.hash
          
        } catch (error) {
          const ledgerError: LedgerError = {
            code: 'PARSE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown parse error',
            details: { error: String(error) }
          }
          
          invalid++
          results.push({
            line: lineNumber,
            valid: false,
            hash: 'error',
            error: ledgerError
          })
          
          if (options.verbose) {
            console.log(`Line ${lineNumber}: ❌ parse error: ${ledgerError.message}`)
          }
          
          if (options.stopOnError) {
            stopped = true
            rl.close()
          }
        }
      })
      
      rl.on('close', () => {
        // Summary
        console.log('\n📊 Verification Summary:')
        console.log(`  Total lines: ${lineNumber}`)
        console.log(`  ✅ Valid: ${valid}`)
        console.log(`  ❌ Invalid: ${invalid}`)
        console.log(`  ⚠️  Unsigned: ${unsigned}`)
        
        if (forks.size > 0) {
          console.log(`  🔀 Forks detected: ${forks.size}`)
          for (const [traceId, hashes] of forks.entries()) {
            console.log(`     - ${traceId}: ${hashes.length} branches`)
          }
        }
        
        resolve({
          total: lineNumber,
          valid,
          invalid,
          unsigned,
          results,
          forks: forks.size > 0 ? forks : undefined
        })
      })
      
      rl.on('error', (err) => {
        reject(err)
      })
      
      stream.on('error', (err) => {
        reject(err)
      })
    })
  }
}