/**
 * Browser-compatible JsonAtomic Core Library
 * This module provides all the crypto and canonical JSON functionality for the browser
 */

import { blake3 } from '@noble/hashes/blake3';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// Domain separation context for BLAKE3 hashing
const HASH_CONTEXT = 'JsonAtomic/v1';

export interface Signature {
  alg: 'Ed25519';
  public_key: string;
  sig: string;
  signed_at?: string;
}

export interface Atomic {
  entity_type: string;
  this: any;
  did: { actor: string; action: string; reason?: string };
  metadata?: Record<string, any>;
  trace_id?: string;
  hash?: string;
  signature?: Signature;
  previous_hash?: string;
  prev?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Deterministic JSON serialization (Canonical JSON)
 */
export function canonicalize(obj: any): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  
  const type = typeof obj;
  
  if (type === 'boolean' || type === 'number') {
    return String(obj);
  }
  
  if (type === 'string') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalize(item));
    return `[${items.join(',')}]`;
  }
  
  if (type === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(key => {
      const value = canonicalize(obj[key]);
      return `${JSON.stringify(key)}:${value}`;
    });
    return `{${pairs.join(',')}}`;
  }
  
  throw new Error(`Cannot canonicalize type: ${type}`);
}

/**
 * Hash an atomic using domain-separated BLAKE3
 */
export function hashAtomic(atomic: Atomic): string {
  // Remove hash and signature fields before hashing
  const { hash, signature, ...atomicWithoutHash } = atomic;
  const canonical = canonicalize(atomicWithoutHash);
  
  // Use domain separation with context
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const context = encoder.encode(HASH_CONTEXT);
  
  // BLAKE3 with context (domain separation)
  const hashBytes = blake3(data, { context: HASH_CONTEXT });
  return bytesToHex(hashBytes);
}

/**
 * Generate Ed25519 key pair
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  
  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
  };
}

/**
 * Sign an atomic with Ed25519 and return structured signature
 */
export function signAtomic(atomic: Atomic, privateKeyHex: string): Atomic {
  // Calculate hash
  const hash = hashAtomic(atomic);
  
  // Get public key from private key
  const privateKey = hexToBytes(privateKeyHex);
  const publicKey = ed25519.getPublicKey(privateKey);
  
  // Sign the hash
  const signature = ed25519.sign(hash, privateKey);
  
  const structuredSignature: Signature = {
    alg: 'Ed25519',
    public_key: bytesToHex(publicKey),
    sig: bytesToHex(signature),
    signed_at: new Date().toISOString()
  };
  
  return {
    ...atomic,
    hash,
    signature: structuredSignature,
  };
}

/**
 * Verify an atomic signature
 */
export function verifySignature(atomic: Atomic): boolean {
  if (!atomic.hash || !atomic.signature) {
    return false;
  }
  
  const sig = atomic.signature as Signature;
  
  if (sig.alg !== 'Ed25519') {
    return false;
  }
  
  try {
    const publicKey = hexToBytes(sig.public_key);
    const signatureBytes = hexToBytes(sig.sig);
    
    // Verify signature
    const isValid = ed25519.verify(signatureBytes, atomic.hash, publicKey);
    
    // Also verify hash matches
    const expectedHash = hashAtomic(atomic);
    const hashMatches = expectedHash === atomic.hash;
    
    return isValid && hashMatches;
  } catch (error) {
    return false;
  }
}

/**
 * Validate atomic structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateAtomic(atomic: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!atomic || typeof atomic !== 'object') {
    errors.push({ field: 'atomic', message: 'Must be an object' });
    return errors;
  }
  
  // Required fields
  if (!atomic.entity_type || typeof atomic.entity_type !== 'string') {
    errors.push({ field: 'entity_type', message: 'Required string field' });
  }
  
  if (!atomic.did || typeof atomic.did !== 'object') {
    errors.push({ field: 'did', message: 'Required object field (decentralized identifier)' });
  } else {
    if (!atomic.did.actor || typeof atomic.did.actor !== 'string') {
      errors.push({ field: 'did.actor', message: 'Required string field' });
    }
    if (!atomic.did.action || typeof atomic.did.action !== 'string') {
      errors.push({ field: 'did.action', message: 'Required string field' });
    }
  }
  
  if (atomic.this === undefined) {
    errors.push({ field: 'this', message: 'Required field (the data payload)' });
  }
  
  // Optional but validated fields
  if (atomic.trace_id !== undefined && typeof atomic.trace_id !== 'string') {
    errors.push({ field: 'trace_id', message: 'Must be a string (UUID)' });
  }
  
  if (atomic.hash !== undefined && typeof atomic.hash !== 'string') {
    errors.push({ field: 'hash', message: 'Must be a hex string' });
  }
  
  if (atomic.signature !== undefined) {
    if (typeof atomic.signature !== 'object' || atomic.signature === null) {
      errors.push({ field: 'signature', message: 'Must be a Signature object' });
    } else {
      const sig = atomic.signature as Signature;
      if (sig.alg !== 'Ed25519') {
        errors.push({ field: 'signature.alg', message: 'Must be "Ed25519"' });
      }
      if (!sig.public_key || typeof sig.public_key !== 'string') {
        errors.push({ field: 'signature.public_key', message: 'Required hex string (64 chars)' });
      }
      if (!sig.sig || typeof sig.sig !== 'string') {
        errors.push({ field: 'signature.sig', message: 'Required hex string (128 chars)' });
      }
    }
  }
  
  if (atomic.metadata !== undefined) {
    if (typeof atomic.metadata !== 'object' || Array.isArray(atomic.metadata)) {
      errors.push({ field: 'metadata', message: 'Must be an object' });
    }
  }
  
  return errors;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Create a new atomic with required fields
 */
export function createAtomic(params: {
  entity_type: string;
  this: any;
  did: { actor: string; action: string; reason?: string };
  metadata?: Record<string, any>;
  trace_id?: string;
}): Atomic {
  return {
    entity_type: params.entity_type,
    this: params.this,
    did: params.did,
    metadata: params.metadata,
    trace_id: params.trace_id || generateUUID(),
    timestamp: new Date().toISOString(),
  };
}
