/**
 * Cryptographic operations for atomic signatures
 */

import { blake3 } from '@noble/hashes/blake3'
import { ed25519 } from '@noble/curves/ed25519'
import { canonicalize } from './canonical.js'
import type { Atomic, Signature } from '../types.js'

/**
 * Domain separation context for BLAKE3 hashing
 */
const HASH_CONTEXT = 'JsonAtomic/v1'

/**
 * Generate a deterministic hash for an atomic with domain separation
 */
export function hashAtomic(atomic: Atomic): string {
  const atomicForHash = { ...atomic }
  delete (atomicForHash as any).hash
  delete (atomicForHash as any).signature
  
  const canonical = canonicalize(atomicForHash)
  // Use BLAKE3 with domain separation context
  const hashBytes = blake3(new TextEncoder().encode(canonical), { context: HASH_CONTEXT })
  return Buffer.from(hashBytes).toString('hex')
}

/**
 * Sign an atomic with a private key, returning structured signature
 */
export async function signAtomic(
  atomic: Atomic,
  privateKeyHex?: string
): Promise<{ hash: string; signature?: Signature }> {
  const hash = hashAtomic(atomic)
  
  if (!privateKeyHex) {
    // Return unsigned if no key provided
    return { hash }
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
  
  return { hash, signature }
}

/**
 * Verify an atomic's signature with structured signature object
 */
export function verifySignature(
  atomic: Atomic,
  publicKeyHex?: string
): boolean {
  if (!atomic.hash || !atomic.signature) {
    return false
  }
  
  const signature = atomic.signature
  
  // Verify signature structure
  if (signature.alg !== 'Ed25519' || !signature.public_key || !signature.sig) {
    return false
  }
  
  // Use provided public key or the one from signature
  const keyToUse = publicKeyHex || signature.public_key
  const publicKey = Uint8Array.from(Buffer.from(keyToUse, 'hex'))
  const signatureBytes = Uint8Array.from(Buffer.from(signature.sig, 'hex'))
  
  try {
    return ed25519.verify(
      signatureBytes,
      new TextEncoder().encode(atomic.hash),
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
