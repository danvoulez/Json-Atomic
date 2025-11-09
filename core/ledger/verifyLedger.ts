import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { blake3 } from '@noble/hashes/blake3'
import { ed25519 } from '@noble/curves/ed25519'
import { canonicalize } from '../canonical.js'
import type { LedgerError, Signature } from '../../types.js'

// Domain separation context for BLAKE3 hashing
const HASH_CONTEXT = 'JsonAtomic/v1'

// Maximum line size (10MB)
const MAX_LINE_SIZE = 10 * 1024 * 1024

interface VerificationResult {
  line: number
  valid: boolean
  hash: string
  trace_id?: string
  error?: LedgerError
}

interface ChainState {
  prevHash: string | null
  traceChains: Map<string, string[]> // trace_id -> array of hashes
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
   * Verify ledger file using streaming (line-by-line) for memory efficiency
   */
  async verifyFile(
    ledgerPath: string,
    options: {
      verbose?: boolean
      stopOnError?: boolean
      publicKeyHex?: string
      traceId?: string  // Filter by specific trace_id
      checkPrevChain?: boolean  // Validate prev field chain
    } = {}
  ): Promise<{
    total: number
    valid: number
    invalid: number
    unsigned: number
    errors: LedgerError[]
    results: VerificationResult[]
  }> {
    const results: VerificationResult[] = []
    const errors: LedgerError[] = []
    const chainState: ChainState = {
      prevHash: null,
      traceChains: new Map()
    }
    
    let lineNum = 0
    let valid = 0
    let invalid = 0
    let unsigned = 0
    
    const publicKey = options.publicKeyHex 
      ? Uint8Array.from(Buffer.from(options.publicKeyHex, 'hex'))
      : this.publicKey

    const fileStream = createReadStream(ledgerPath, { encoding: 'utf-8' })
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })

    for await (const line of rl) {
      lineNum++
      
      // Check line size
      if (line.length > MAX_LINE_SIZE) {
        const error: LedgerError = {
          line: lineNum,
          code: 'LINE_TOO_LARGE',
          message: `Line exceeds maximum size of ${MAX_LINE_SIZE} bytes`
        }
        errors.push(error)
        invalid++
        results.push({
          line: lineNum,
          valid: false,
          hash: 'error',
          error
        })
        
        if (options.verbose) {
          console.log(`Line ${lineNum}: ❌ ${error.code}: ${error.message}`)
        }
        
        if (options.stopOnError) break
        continue
      }
      
      // Skip empty lines
      if (!line.trim()) {
        continue
      }
      
      try {
        const atomic = JSON.parse(line)
        const trace_id = atomic.metadata?.trace_id
        
        // Filter by trace_id if specified
        if (options.traceId && trace_id !== options.traceId) {
          continue
        }
        
        // Validate prev chain if enabled
        if (options.checkPrevChain) {
          const prevError = this.validatePrevChain(atomic, chainState, lineNum)
          if (prevError) {
            errors.push(prevError)
            invalid++
            results.push({
              line: lineNum,
              valid: false,
              hash: atomic.hash || atomic.curr_hash || 'missing',
              trace_id,
              error: prevError
            })
            
            if (options.verbose) {
              console.log(`Line ${lineNum}: ❌ ${prevError.code}: ${prevError.message}`)
            }
            
            if (options.stopOnError) break
            continue
          }
        }
        
        // Check if unsigned
        if (!atomic.signature || (!atomic.hash && !atomic.curr_hash)) {
          unsigned++
          results.push({
            line: lineNum,
            valid: false,
            hash: atomic.hash || atomic.curr_hash || 'missing',
            trace_id,
            error: {
              line: lineNum,
              code: 'UNSIGNED',
              message: 'Atomic is not signed',
              trace_id
            }
          })
          
          if (options.verbose) {
            console.log(`Line ${lineNum}: ⚠️  unsigned (trace_id: ${trace_id})`)
          }
          continue
        }
        
        // Verify hash
        const atomicForHash = { ...atomic }
        delete atomicForHash.curr_hash
        delete atomicForHash.hash
        delete atomicForHash.signature
        
        const canonical = canonicalize(atomicForHash)
        const computedHash = Buffer.from(
          blake3(new TextEncoder().encode(canonical), { context: HASH_CONTEXT })
        ).toString('hex')
        
        const storedHash = atomic.hash || atomic.curr_hash
        
        if (computedHash !== storedHash) {
          const error: LedgerError = {
            line: lineNum,
            code: 'HASH_MISMATCH',
            message: `Computed hash ${computedHash.slice(0, 8)}... does not match stored hash ${storedHash.slice(0, 8)}...`,
            trace_id
          }
          errors.push(error)
          invalid++
          results.push({
            line: lineNum,
            valid: false,
            hash: storedHash,
            trace_id,
            error
          })
          
          if (options.verbose) {
            console.log(`Line ${lineNum}: ❌ ${error.code} (trace_id: ${trace_id})`)
          }
          
          if (options.stopOnError) break
          continue
        }
        
        // Verify signature if public key available
        if (publicKey && atomic.signature) {
          const sigError = this.verifyAtomicSignature(atomic, publicKey, lineNum, trace_id)
          if (sigError) {
            errors.push(sigError)
            invalid++
            results.push({
              line: lineNum,
              valid: false,
              hash: storedHash,
              trace_id,
              error: sigError
            })
            
            if (options.verbose) {
              console.log(`Line ${lineNum}: ❌ ${sigError.code} (trace_id: ${trace_id})`)
            }
            
            if (options.stopOnError) break
            continue
          }
        }
        
        // Track chain state
        if (options.checkPrevChain) {
          chainState.prevHash = storedHash
          
          // Track trace chains for fork detection
          if (trace_id) {
            if (!chainState.traceChains.has(trace_id)) {
              chainState.traceChains.set(trace_id, [])
            }
            chainState.traceChains.get(trace_id)!.push(storedHash)
          }
        }
        
        // All valid
        valid++
        results.push({
          line: lineNum,
          valid: true,
          hash: storedHash,
          trace_id
        })
        
        if (options.verbose) {
          console.log(`Line ${lineNum}: ✅ valid (blake3:${storedHash.slice(0, 8)}...)`)
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const ledgerError: LedgerError = {
          line: lineNum,
          code: 'PARSE_ERROR',
          message: errorMessage
        }
        errors.push(ledgerError)
        invalid++
        results.push({
          line: lineNum,
          valid: false,
          hash: 'error',
          error: ledgerError
        })
        
        if (options.verbose) {
          console.log(`Line ${lineNum}: ❌ parse error: ${errorMessage}`)
        }
        
        if (options.stopOnError) break
      }
    }
    
    // Check for forks in trace chains
    if (options.checkPrevChain && options.traceId) {
      const forks = this.detectForks(chainState, options.traceId)
      if (forks.length > 0) {
        console.log(`\n⚠️  Warning: Detected ${forks.length} potential fork(s) for trace_id ${options.traceId}`)
        forks.forEach(fork => {
          console.log(`  Fork at hashes: ${fork.join(', ')}`)
        })
      }
    }
    
    // Summary
    if (options.verbose) {
      console.log('\n📊 Verification Summary:')
      console.log(`  Total lines: ${lineNum}`)
      console.log(`  ✅ Valid: ${valid}`)
      console.log(`  ❌ Invalid: ${invalid}`)
      console.log(`  ⚠️  Unsigned: ${unsigned}`)
    }
    
    return {
      total: lineNum,
      valid,
      invalid,
      unsigned,
      errors,
      results
    }
  }

  private validatePrevChain(atomic: any, chainState: ChainState, lineNum: number): LedgerError | null {
    const trace_id = atomic.metadata?.trace_id
    
    // First atomic in file should not have prev
    if (chainState.prevHash === null) {
      if (atomic.prev) {
        return {
          line: lineNum,
          code: 'INVALID_GENESIS',
          message: 'First atomic in ledger should not have prev field',
          trace_id
        }
      }
      return null
    }
    
    // Subsequent atomics should have prev
    if (!atomic.prev) {
      return {
        line: lineNum,
        code: 'MISSING_PREV',
        message: 'Non-genesis atomic must have prev field',
        trace_id
      }
    }
    
    // Prev should match previous hash
    if (atomic.prev !== chainState.prevHash) {
      return {
        line: lineNum,
        code: 'PREV_MISMATCH',
        message: `prev field ${atomic.prev.slice(0, 8)}... does not match previous hash ${chainState.prevHash.slice(0, 8)}...`,
        trace_id
      }
    }
    
    return null
  }

  private verifyAtomicSignature(
    atomic: any, 
    publicKey: Uint8Array, 
    lineNum: number,
    trace_id?: string
  ): LedgerError | null {
    const signature = atomic.signature
    
    // Handle both old string format and new structured format
    if (typeof signature === 'string') {
      // Old format: signature is hex string
      try {
        const signatureBytes = Uint8Array.from(Buffer.from(signature, 'hex'))
        const hash = atomic.hash || atomic.curr_hash
        
        const isValidSig = ed25519.verify(
          signatureBytes,
          new TextEncoder().encode(hash),
          publicKey
        )
        
        if (!isValidSig) {
          return {
            line: lineNum,
            code: 'INVALID_SIGNATURE',
            message: 'Signature verification failed',
            trace_id
          }
        }
      } catch (err) {
        return {
          line: lineNum,
          code: 'SIGNATURE_ERROR',
          message: `Signature verification error: ${err instanceof Error ? err.message : 'unknown'}`,
          trace_id
        }
      }
    } else if (typeof signature === 'object' && signature !== null) {
      // New format: structured signature
      const sig = signature as Signature
      
      if (sig.alg !== 'Ed25519') {
        return {
          line: lineNum,
          code: 'UNSUPPORTED_ALGORITHM',
          message: `Unsupported signature algorithm: ${sig.alg}`,
          trace_id
        }
      }
      
      try {
        const sigPublicKey = Uint8Array.from(Buffer.from(sig.public_key, 'hex'))
        const signatureBytes = Uint8Array.from(Buffer.from(sig.sig, 'hex'))
        const hash = atomic.hash || atomic.curr_hash
        
        // Use public key from signature
        const isValidSig = ed25519.verify(
          signatureBytes,
          new TextEncoder().encode(hash),
          sigPublicKey
        )
        
        if (!isValidSig) {
          return {
            line: lineNum,
            code: 'INVALID_SIGNATURE',
            message: 'Signature verification failed',
            trace_id
          }
        }
      } catch (err) {
        return {
          line: lineNum,
          code: 'SIGNATURE_ERROR',
          message: `Signature verification error: ${err instanceof Error ? err.message : 'unknown'}`,
          trace_id
        }
      }
    } else {
      return {
        line: lineNum,
        code: 'INVALID_SIGNATURE_FORMAT',
        message: 'Signature must be string or Signature object',
        trace_id
      }
    }
    
    return null
  }

  private detectForks(chainState: ChainState, traceId: string): string[][] {
    const forks: string[][] = []
    const chain = chainState.traceChains.get(traceId)
    
    if (!chain) {
      return forks
    }
    
    // Simple fork detection: check for duplicate hashes or breaks in chain
    const seen = new Set<string>()
    for (const hash of chain) {
      if (seen.has(hash)) {
        forks.push([hash])
      }
      seen.add(hash)
    }
    
    return forks
  }
}

// Export for programmatic use
export type { VerificationResult, ChainState }
export { MAX_LINE_SIZE }
