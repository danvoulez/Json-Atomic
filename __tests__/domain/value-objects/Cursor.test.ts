import { Cursor } from '../../../core/domain/value-objects/Cursor';

describe('Cursor Value Object', () => {
  describe('create', () => {
    it('should create cursor from number', () => {
      const result = Cursor.create(42);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.toNumber()).toBe(42);
      }
    });

    it('should create cursor from numeric string', () => {
      const result = Cursor.create('123');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.toNumber()).toBe(123);
      }
    });

    it('should reject empty string', () => {
      const result = Cursor.create('');

      expect(result.isFailure).toBe(true);
    });

    it('should accept zero', () => {
      const result = Cursor.create(0);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.toNumber()).toBe(0);
      }
    });
  });

  describe('createUnsafe', () => {
    it('should create cursor without validation', () => {
      const cursor = Cursor.createUnsafe('100');
      expect(cursor.toString()).toBe('100');
    });
  });

  describe('toNumber', () => {
    it('should convert string cursor to number', () => {
      const cursor = Cursor.createUnsafe('42');
      expect(cursor.toNumber()).toBe(42);
    });

    it('should return number cursor as is', () => {
      const cursor = Cursor.createUnsafe(42);
      expect(cursor.toNumber()).toBe(42);
    });
  });

  describe('equals', () => {
    it('should return true for equal cursors', () => {
      const cursor1 = Cursor.createUnsafe(42);
      const cursor2 = Cursor.createUnsafe('42');

      expect(cursor1.equals(cursor2)).toBe(true);
    });

    it('should return false for different cursors', () => {
      const cursor1 = Cursor.createUnsafe(42);
      const cursor2 = Cursor.createUnsafe(43);

      expect(cursor1.equals(cursor2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should convert number to string', () => {
      const cursor = Cursor.createUnsafe(42);
      expect(cursor.toString()).toBe('42');
    });

    it('should return string as is', () => {
      const cursor = Cursor.createUnsafe('42');
      expect(cursor.toString()).toBe('42');
    });
  });
});
