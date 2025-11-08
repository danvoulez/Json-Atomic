/**
 * Cryptographic operations for atomic signatures
 */

import { blake3 } from '@noble/hashes/blake3'
import { ed25519 } from '@noble/curves/ed25519'
import { canonicalize } from './canonical.js'
import type { Atomic } from '../types.js'

export interface SignedAtomic {
  curr_hash: string
  signature: string
}

/**
 * Generate a deterministic hash for an atomic
 */
export function hashAtomic(atomic: Atomic): string {
  const atomicForHash = { ...atomic }
  delete (atomicForHash as any).curr_hash
  delete (atomicForHash as any).signature
  
  const canonical = canonicalize(atomicForHash)
  const hashBytes = blake3(new TextEncoder().encode(canonical))
  return Buffer.from(hashBytes).toString('hex')
}

/**
 * Sign an atomic with a private key
 */
export async function signAtomic(
  atomic: Atomic,
  privateKeyHex?: string
): Promise<SignedAtomic> {
  const hash = hashAtomic(atomic)
  
  if (!privateKeyHex) {
    // Return unsigned if no key provided
    return { curr_hash: hash, signature: '' }
  }
  
  const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'))
  const signatureBytes = ed25519.sign(
    new TextEncoder().encode(hash),
    privateKey
  )
  
  return {
    curr_hash: hash,
    signature: Buffer.from(signatureBytes).toString('hex')
  }
}

/**
 * Verify an atomic's signature
 */
export function verifySignature(
  atomic: Atomic,
  publicKeyHex: string
): boolean {
  if (!atomic.curr_hash || !atomic.signature) {
    return false
  }
  
  const publicKey = Uint8Array.from(Buffer.from(publicKeyHex, 'hex'))
  const signatureBytes = Uint8Array.from(Buffer.from(atomic.signature, 'hex'))
  
  try {
    return ed25519.verify(
      signatureBytes,
      new TextEncoder().encode(atomic.curr_hash),
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
