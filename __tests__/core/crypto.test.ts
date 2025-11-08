import { hashAtomic, signAtomic, verifySignature, generateKeyPair } from '../../core/crypto';
import type { Atomic } from '../../types';

describe('Cryptographic Operations', () => {
  const sampleAtomic: Atomic = {
    entity_type: 'user',
    this: 'user123',
    did: 'create',
    metadata: {
      name: 'Alice',
      email: 'alice@example.com',
    },
    trace_id: '550e8400-e29b-41d4-a716-446655440000',
    tenant_id: 'tenant1',
    timestamp: '2024-01-01T00:00:00Z',
  };

  describe('hashAtomic', () => {
    it('should generate a hash for an atomic', () => {
      const hash = hashAtomic(sampleAtomic);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // BLAKE3 produces 256 bits = 64 hex chars
    });

    it('should generate same hash for same atomic', () => {
      const hash1 = hashAtomic(sampleAtomic);
      const hash2 = hashAtomic(sampleAtomic);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different atomics', () => {
      const atomic2 = { ...sampleAtomic, metadata: { name: 'Bob' } };

      const hash1 = hashAtomic(sampleAtomic);
      const hash2 = hashAtomic(atomic2);

      expect(hash1).not.toBe(hash2);
    });

    it('should ignore curr_hash field when hashing', () => {
      const atomicWithHash = { ...sampleAtomic, curr_hash: 'old-hash' };

      const hash1 = hashAtomic(sampleAtomic);
      const hash2 = hashAtomic(atomicWithHash);

      expect(hash1).toBe(hash2);
    });

    it('should ignore signature field when hashing', () => {
      const atomicWithSig = { ...sampleAtomic, signature: 'old-signature' };

      const hash1 = hashAtomic(sampleAtomic);
      const hash2 = hashAtomic(atomicWithSig);

      expect(hash1).toBe(hash2);
    });

    it('should be deterministic regardless of key order', () => {
      const atomic1 = {
        entity_type: 'user',
        this: 'user123',
        did: 'create',
        metadata: { name: 'Alice' },
        trace_id: '550e8400-e29b-41d4-a716-446655440000',
        tenant_id: 'tenant1',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const atomic2 = {
        timestamp: '2024-01-01T00:00:00Z',
        tenant_id: 'tenant1',
        trace_id: '550e8400-e29b-41d4-a716-446655440000',
        metadata: { name: 'Alice' },
        did: 'create',
        this: 'user123',
        entity_type: 'user',
      };

      const hash1 = hashAtomic(atomic1);
      const hash2 = hashAtomic(atomic2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateKeyPair', () => {
    it('should generate a valid key pair', () => {
      const keyPair = generateKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(typeof keyPair.privateKey).toBe('string');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(keyPair.privateKey.length).toBe(64); // 32 bytes = 64 hex chars
      expect(keyPair.publicKey.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();

      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
    });
  });

  describe('signAtomic', () => {
    let keyPair: { privateKey: string; publicKey: string };

    beforeAll(() => {
      keyPair = generateKeyPair();
    });

    it('should sign an atomic with a private key', async () => {
      const signed = await signAtomic(sampleAtomic, keyPair.privateKey);

      expect(signed).toBeDefined();
      expect(signed.curr_hash).toBeDefined();
      expect(signed.signature).toBeDefined();
      expect(typeof signed.curr_hash).toBe('string');
      expect(typeof signed.signature).toBe('string');
      expect(signed.curr_hash.length).toBe(64);
      expect(signed.signature.length).toBe(128); // Ed25519 signature is 64 bytes = 128 hex chars
    });

    it('should return empty signature when no key provided', async () => {
      const signed = await signAtomic(sampleAtomic);

      expect(signed).toBeDefined();
      expect(signed.curr_hash).toBeDefined();
      expect(signed.signature).toBe('');
    });

    it('should generate same hash for same atomic', async () => {
      const signed1 = await signAtomic(sampleAtomic, keyPair.privateKey);
      const signed2 = await signAtomic(sampleAtomic, keyPair.privateKey);

      expect(signed1.curr_hash).toBe(signed2.curr_hash);
    });

    it('should generate different signatures for different atomics', async () => {
      const atomic2 = { ...sampleAtomic, metadata: { name: 'Bob' } };

      const signed1 = await signAtomic(sampleAtomic, keyPair.privateKey);
      const signed2 = await signAtomic(atomic2, keyPair.privateKey);

      expect(signed1.signature).not.toBe(signed2.signature);
      expect(signed1.curr_hash).not.toBe(signed2.curr_hash);
    });
  });

  describe('verifySignature', () => {
    let keyPair: { privateKey: string; publicKey: string };

    beforeAll(() => {
      keyPair = generateKeyPair();
    });

    it('should verify a valid signature', async () => {
      const signed = await signAtomic(sampleAtomic, keyPair.privateKey);
      const atomicWithSignature = { ...sampleAtomic, ...signed };
      const isValid = verifySignature(atomicWithSignature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', async () => {
      const signed = await signAtomic(sampleAtomic, keyPair.privateKey);
      const atomicWithSignature = { ...sampleAtomic, ...signed };
      const wrongKey = generateKeyPair().publicKey;

      const isValid = verifySignature(atomicWithSignature, wrongKey);

      expect(isValid).toBe(false);
    });

    it('should reject tampered curr_hash', async () => {
      const signed = await signAtomic(sampleAtomic, keyPair.privateKey);
      const atomicWithSignature = { ...sampleAtomic, ...signed };
      
      // Tamper with the curr_hash (this should fail verification)
      const tamperedAtomic = { ...atomicWithSignature, curr_hash: 'a'.repeat(64) };

      const isValid = verifySignature(tamperedAtomic, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject missing signature', () => {
      const isValid = verifySignature(sampleAtomic, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject missing curr_hash', () => {
      const atomicWithSig = { ...sampleAtomic, signature: 'some-sig' };
      const isValid = verifySignature(atomicWithSig, keyPair.publicKey);

      expect(isValid).toBe(false);
    });
  });

  describe('full signing workflow', () => {
    it('should complete a full sign and verify cycle', async () => {
      // Generate keys
      const keyPair = generateKeyPair();

      // Sign atomic
      const signed = await signAtomic(sampleAtomic, keyPair.privateKey);

      // Add signature to atomic
      const signedAtomic = { ...sampleAtomic, ...signed };

      // Verify signature
      const isValid = verifySignature(signedAtomic, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong public key', async () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();

      const signed = await signAtomic(sampleAtomic, keyPair1.privateKey);
      const signedAtomic = { ...sampleAtomic, ...signed };
      const isValid = verifySignature(signedAtomic, keyPair2.publicKey);

      expect(isValid).toBe(false);
    });
  });
});
