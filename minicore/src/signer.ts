/**
 * Cryptographic signing and verification using BLAKE3 + Ed25519
 * Compatible with JSON✯Atomic DV25Seal specification
 */

import { blake3 } from '@noble/hashes/blake3'
import { ed25519 } from '@noble/curves/ed25519'
import type { Signature, SignedSpan, KeyPair } from './types.ts'

/** Domain separation context for BLAKE3 hashing */
const HASH_CONTEXT = 'JsonAtomic/v1'

/**
 * Generate a new Ed25519 keypair
 * 
 * @returns Keypair with private and public keys in hex format
 */
export function generateKeyPair(): KeyPair {
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKey = ed25519.getPublicKey(privateKey)
  
  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey)
  }
}

/**
 * Hash a span using BLAKE3 with domain separation
 * Removes hash and signature fields before hashing for canonical representation
 * 
 * @param span - Span to hash
 * @returns BLAKE3 hash in hex format
 */
export function hashSpan(span: Record<string, unknown>): string {
  // Create clean copy without hash/signature for canonical hashing
  const spanForHash = { ...span }
  delete spanForHash.hash
  delete spanForHash.signature
  
  // Canonicalize to deterministic JSON
  const canonical = canonicalize(spanForHash)
  
  // Hash with domain separation
  const encoder = new TextEncoder()
  const hashBytes = blake3(encoder.encode(canonical), { context: HASH_CONTEXT })
  
  return bytesToHex(hashBytes)
}

/**
 * Sign a span with a private key
 * Creates a BLAKE3 hash and Ed25519 signature
 * 
 * @param span - Span to sign
 * @param privateKeyHex - Ed25519 private key in hex format
 * @returns Signed span with hash and signature
 */
export function signSpan(
  span: Record<string, unknown>,
  privateKeyHex: string
): SignedSpan {
  const hash = hashSpan(span)
  const privateKey = hexToBytes(privateKeyHex)
  const publicKey = ed25519.getPublicKey(privateKey)
  
  const encoder = new TextEncoder()
  const signatureBytes = ed25519.sign(encoder.encode(hash), privateKey)
  
  const signature: Signature = {
    alg: 'Ed25519',
    public_key: bytesToHex(publicKey),
    sig: bytesToHex(signatureBytes),
    signed_at: new Date().toISOString()
  }
  
  return {
    ...span,
    hash,
    signature
  } as SignedSpan
}

/**
 * Verify a span's signature
 * Checks that the hash matches and the signature is valid
 * 
 * @param signedSpan - Signed span to verify
 * @param publicKeyHex - Optional public key to verify against (uses signature's key if not provided)
 * @returns True if signature is valid
 */
export function verifySpan(
  signedSpan: SignedSpan,
  publicKeyHex?: string
): boolean {
  if (!signedSpan.hash || !signedSpan.signature) {
    return false
  }
  
  const sig = signedSpan.signature
  if (sig.alg !== 'Ed25519' || !sig.public_key || !sig.sig) {
    return false
  }
  
  // Use provided public key or the one from signature
  const keyToUse = publicKeyHex || sig.public_key
  const publicKey = hexToBytes(keyToUse)
  const signatureBytes = hexToBytes(sig.sig)
  
  // Verify the signature against the hash
  const encoder = new TextEncoder()
  try {
    return ed25519.verify(signatureBytes, encoder.encode(signedSpan.hash), publicKey)
  } catch {
    return false
  }
}

/**
 * Verify that a span's hash matches its content
 * 
 * @param signedSpan - Span with hash to verify
 * @returns True if hash matches the span content
 */
export function verifyHash(signedSpan: SignedSpan): boolean {
  const computedHash = hashSpan(signedSpan as unknown as Record<string, unknown>)
  return computedHash === signedSpan.hash
}

/**
 * Canonicalize an object to deterministic JSON string
 * Sorts keys recursively and handles all JSON types
 * 
 * @param obj - Object to canonicalize
 * @returns Canonical JSON string
 */
function canonicalize(obj: unknown): string {
  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  
  const type = typeof obj
  if (type === 'number' || type === 'boolean') return String(obj)
  if (type === 'string') return JSON.stringify(obj)
  
  if (Array.isArray(obj)) {
    const items = obj.map(canonicalize)
    return `[${items.join(',')}]`
  }
  
  if (type === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`)
    return `{${entries.join(',')}}`
  }
  
  return JSON.stringify(obj)
}

/**
 * Convert bytes to hex string
 * 
 * @param bytes - Byte array
 * @returns Hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to bytes
 * 
 * @param hex - Hex string
 * @returns Byte array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}
