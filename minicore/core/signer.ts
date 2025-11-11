/**
 * Cryptographic signing and verification using BLAKE3 + Ed25519
 * Compatible with the main JSON✯Atomic crypto module
 */

import { blake3 } from 'npm:@noble/hashes@1.4.0/blake3'
import { ed25519 } from 'npm:@noble/curves@1.4.0/ed25519'

const HASH_CONTEXT = 'JsonAtomic/v1'

export interface Signature {
  alg: 'Ed25519'
  public_key: string
  sig: string
  signed_at: string
}

export interface SignedSpan {
  hash: string
  signature?: Signature
  [key: string]: unknown
}

/**
 * Generate Ed25519 keypair
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKey = ed25519.getPublicKey(privateKey)
  
  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey)
  }
}

/**
 * Hash a span using BLAKE3 with domain separation
 */
export function hashSpan(span: Record<string, unknown>): string {
  // Remove hash and signature for canonical hashing
  const spanForHash = { ...span }
  delete spanForHash.hash
  delete spanForHash.signature
  
  // Canonicalize (simple JSON.stringify with sorted keys)
  const canonical = canonicalize(spanForHash)
  
  // Hash with domain separation
  const encoder = new TextEncoder()
  const hashBytes = blake3(encoder.encode(canonical), { context: HASH_CONTEXT })
  return bytesToHex(hashBytes)
}

/**
 * Sign a span with a private key
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
  }
}

/**
 * Verify a span's signature
 */
export function verifySpan(
  signedSpan: SignedSpan,
  publicKeyHex?: string
): boolean {
  if (!signedSpan.hash || !signedSpan.signature) {
    return false
  }
  
  const sig = signedSpan.signature as Signature
  if (sig.alg !== 'Ed25519' || !sig.public_key || !sig.sig) {
    return false
  }
  
  // Use provided public key or the one from signature
  const keyToUse = publicKeyHex || sig.public_key
  const publicKey = hexToBytes(keyToUse)
  const signatureBytes = hexToBytes(sig.sig)
  
  // Verify the signature
  const encoder = new TextEncoder()
  try {
    return ed25519.verify(signatureBytes, encoder.encode(signedSpan.hash), publicKey)
  } catch {
    return false
  }
}

/**
 * Canonicalize an object to deterministic JSON string
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
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}
