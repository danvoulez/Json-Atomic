/**
 * Cryptographic operations for atomic signatures
 */

import { blake3 } from '@noble/hashes/blake3'
import { ed25519 } from '@noble/curves/ed25519'
import { canonicalize } from './canonical.js'
import type { Atomic, SignedAtomic, Signature } from '../types.js'

// Domain separation context for BLAKE3 hashing
const HASH_CONTEXT = 'JsonAtomic/v1'

/**
 * Generate a deterministic hash for an atomic using domain-separated BLAKE3
 */
export function hashAtomic(atomic: Atomic): string {
  const atomicForHash = { ...atomic }
  delete (atomicForHash as any).curr_hash
  delete (atomicForHash as any).hash
  delete (atomicForHash as any).signature
  
  const canonical = canonicalize(atomicForHash)
  // Use domain separation with context
  const hashBytes = blake3(new TextEncoder().encode(canonical), { 
    context: HASH_CONTEXT 
  })
  return Buffer.from(hashBytes).toString('hex')
}

/**
 * Sign an atomic with a private key and return structured signature
 */
export async function signAtomic(
  atomic: Atomic,
  privateKeyHex?: string
): Promise<SignedAtomic> {
  const hash = hashAtomic(atomic)
  
  if (!privateKeyHex) {
    // Return unsigned if no key provided
    throw new Error('Private key required for signing')
  }
  
  const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'))
  const publicKey = ed25519.getPublicKey(privateKey)
  const signatureBytes = ed25519.sign(
    new TextEncoder().encode(hash),
    privateKey
  )
  
  const signature: Signature = {
    alg: 'Ed25519',
    public_key: Buffer.from(publicKey).toString('hex'),
    sig: Buffer.from(signatureBytes).toString('hex'),
    signed_at: new Date().toISOString()
  }
  
  return {
    ...atomic,
    hash,
    signature
  } as SignedAtomic
}

/**
 * Verify an atomic's signature using structured signature
 */
export function verifySignature(
  atomic: Atomic
): boolean {
  if (!atomic.hash && !atomic.curr_hash) {
    return false
  }
  
  if (!atomic.signature || typeof atomic.signature !== 'object') {
    return false
  }
  
  const sig = atomic.signature as Signature
  
  if (sig.alg !== 'Ed25519') {
    return false
  }
  
  const hash = atomic.hash || atomic.curr_hash
  if (!hash) {
    return false
  }
  
  try {
    const publicKey = Uint8Array.from(Buffer.from(sig.public_key, 'hex'))
    const signatureBytes = Uint8Array.from(Buffer.from(sig.sig, 'hex'))
    
    return ed25519.verify(
      signatureBytes,
      new TextEncoder().encode(hash),
      publicKey
    )
  } catch {
    return false
  }
}

/**
 * Generate a new Ed25519 key pair
 */
export function generateKeyPair(): {
  privateKey: string
  publicKey: string
} {
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKey = ed25519.getPublicKey(privateKey)
  
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex')
  }
}
