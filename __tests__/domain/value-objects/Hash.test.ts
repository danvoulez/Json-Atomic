import { Hash } from '../../../core/domain/value-objects/Hash';
import { InvalidHashError } from '../../../core/domain/errors/DomainErrors';

describe('Hash Value Object', () => {
  const validHash = 'a'.repeat(64); // Valid 64-character hex string
  const shortHash = 'abc123';

  describe('create', () => {
    it('should create a valid hash', () => {
      const result = Hash.create(validHash);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.toString()).toBe(validHash);
      }
    });

    it('should reject invalid hex characters', () => {
      const result = Hash.create('z'.repeat(64));

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(InvalidHashError);
      }
    });

    it('should reject wrong length', () => {
      const result = Hash.create('abc123');

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(InvalidHashError);
      }
    });

    it('should handle uppercase hex', () => {
      const upperHash = 'A'.repeat(64);
      const result = Hash.create(upperHash);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.toString()).toBe(upperHash);
      }
    });
  });

  describe('createUnsafe', () => {
    it('should create a hash without validation', () => {
      const hash = Hash.createUnsafe(validHash);
      expect(hash.toString()).toBe(validHash);
    });
  });

  describe('equals', () => {
    it('should return true for identical hashes', () => {
      const hash1 = Hash.createUnsafe(validHash);
      const hash2 = Hash.createUnsafe(validHash);

      expect(hash1.equals(hash2)).toBe(true);
    });

    it('should return false for different hashes', () => {
      const hash1 = Hash.createUnsafe(validHash);
      const hash2 = Hash.createUnsafe('b'.repeat(64));

      expect(hash1.equals(hash2)).toBe(false);
    });
  });

  describe('toShort', () => {
    it('should return first 8 characters', () => {
      const hash = Hash.createUnsafe(validHash);
      expect(hash.toShort()).toBe('aaaaaaaa');
    });

    it('should handle custom length', () => {
      const hash = Hash.createUnsafe(validHash);
      expect(hash.toShort(12)).toBe('a'.repeat(12));
    });
  });

  describe('toString', () => {
    it('should return the hash value', () => {
      const hash = Hash.createUnsafe(validHash);
      expect(hash.toString()).toBe(validHash);
    });
  });
});
