import { readFileSync } from 'fs'
import { blake3 } from '@noble/hashes/blake3'
import { ed25519 } from '@noble/curves/ed25519'
import { canonicalize } from '../canonical'

interface VerificationResult {
  line: number
  valid: boolean
  hash: string
  trace_id?: string
  error?: string
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

  async verifyFile(
    ledgerPath: string,
    options: {
      verbose?: boolean
      stopOnError?: boolean
      publicKeyHex?: string
    } = {}
  ): Promise<{
    total: number
    valid: number
    invalid: number
    unsigned: number
    results: VerificationResult[]
  }> {
    const content = readFileSync(ledgerPath, 'utf-8')
    const lines = content.trim().split('\n')
    const results: VerificationResult[] = []
    
    let valid = 0
    let invalid = 0
    let unsigned = 0
    
    const publicKey = options.publicKeyHex 
      ? Uint8Array.from(Buffer.from(options.publicKeyHex, 'hex'))
      : this.publicKey

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1
      
      try {
        const atomic = JSON.parse(lines[i])
        
        // Se não tem assinatura
        if (!atomic.signature || !atomic.curr_hash) {
          unsigned++
          results.push({
            line: lineNum,
            valid: false,
            hash: atomic.curr_hash || 'missing',
            trace_id: atomic.metadata?.trace_id,
            error: 'unsigned'
          })
          
          if (options.verbose) {
            console.log(`Line ${lineNum}: ⚠️  unsigned (trace_id: ${atomic.metadata?.trace_id})`)
          }
          continue
        }
        
        // Verifica hash
        const atomicForHash = { ...atomic }
        delete atomicForHash.curr_hash
        delete atomicForHash.signature
        
        const canonical = canonicalize(atomicForHash)
        const computedHash = Buffer.from(
          blake3(new TextEncoder().encode(canonical))
        ).toString('hex')
        
        if (computedHash !== atomic.curr_hash) {
          invalid++
          results.push({
            line: lineNum,
            valid: false,
            hash: atomic.curr_hash,
            trace_id: atomic.metadata?.trace_id,
            error: 'hash_mismatch'
          })
          
          if (options.verbose) {
            console.log(`Line ${lineNum}: ❌ hash mismatch (trace_id: ${atomic.metadata?.trace_id})`)
          }
          
          if (options.stopOnError) break
          continue
        }
        
        // Verifica assinatura se temos chave pública
        if (publicKey) {
          const signatureBytes = Uint8Array.from(
            Buffer.from(atomic.signature, 'hex')
          )
          
          const isValidSig = ed25519.verify(
            signatureBytes,
            new TextEncoder().encode(atomic.curr_hash),
            publicKey
          )
          
          if (!isValidSig) {
            invalid++
            results.push({
              line: lineNum,
              valid: false,
              hash: atomic.curr_hash,
              trace_id: atomic.metadata?.trace_id,
              error: 'invalid_signature'
            })
            
            if (options.verbose) {
              console.log(`Line ${lineNum}: ❌ invalid signature (trace_id: ${atomic.metadata?.trace_id})`)
            }
            
            if (options.stopOnError) break
            continue
          }
        }
        
        // Tudo válido
        valid++
        results.push({
          line: lineNum,
          valid: true,
          hash: atomic.curr_hash,
          trace_id: atomic.metadata?.trace_id
        })
        
        if (options.verbose) {
          console.log(`Line ${lineNum}: ✅ valid (blake3:${atomic.curr_hash.slice(0, 8)}...)`)
        }
        
      } catch (error) {
        invalid++
        results.push({
          line: lineNum,
          valid: false,
          hash: 'error',
          error: error.message
        })
        
        if (options.verbose) {
          console.log(`Line ${lineNum}: ❌ parse error: ${error.message}`)
        }
        
        if (options.stopOnError) break
      }
    }
    
    // Sumário
    console.log('\n📊 Verification Summary:')
    console.log(`  Total lines: ${lines.length}`)
    console.log(`  ✅ Valid: ${valid}`)
    console.log(`  ❌ Invalid: ${invalid}`)
    console.log(`  ⚠️  Unsigned: ${unsigned}`)
    
    return {
      total: lines.length,
      valid,
      invalid,
      unsigned,
      results
    }
  }
}

// CLI usage
if (import.meta.main) {
  const verifier = new LedgerVerifier()
  const ledgerPath = Deno.args[0] || './data/ledger.jsonl'
  const publicKey = Deno.env.get('PUBLIC_KEY_HEX')
  
  await verifier.verifyFile(ledgerPath, {
    verbose: true,
    publicKeyHex: publicKey
  })
}