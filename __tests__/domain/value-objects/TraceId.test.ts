import { TraceId } from '../../../core/domain/value-objects/TraceId';

describe('TraceId Value Object', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const invalidUuid = '';

  describe('create', () => {
    it('should create valid UUID', () => {
      const result = TraceId.create(validUuid);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.toString()).toBe(validUuid);
      }
    });

    it('should reject empty string', () => {
      const result = TraceId.create(invalidUuid);

      expect(result.isFailure).toBe(true);
    });

    it('should handle UUIDs with different cases', () => {
      const upperUuid = validUuid.toUpperCase();
      const result = TraceId.create(upperUuid);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.toString()).toBe(upperUuid);
      }
    });
  });

  describe('generate', () => {
    it('should generate a valid UUID', () => {
      const traceId = TraceId.generate();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

      expect(uuidRegex.test(traceId.toString())).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const traceId1 = TraceId.generate();
      const traceId2 = TraceId.generate();

      expect(traceId1.equals(traceId2)).toBe(false);
    });

    it('should generate multiple unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(TraceId.generate().toString());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('createUnsafe', () => {
    it('should create TraceId without validation', () => {
      const traceId = TraceId.createUnsafe(validUuid);
      expect(traceId.toString()).toBe(validUuid);
    });
  });

  describe('equals', () => {
    it('should return true for identical UUIDs', () => {
      const traceId1 = TraceId.createUnsafe(validUuid);
      const traceId2 = TraceId.createUnsafe(validUuid);

      expect(traceId1.equals(traceId2)).toBe(true);
    });

    it('should return false for different UUIDs', () => {
      const traceId1 = TraceId.createUnsafe(validUuid);
      const traceId2 = TraceId.generate();

      expect(traceId1.equals(traceId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID value', () => {
      const traceId = TraceId.createUnsafe(validUuid);
      expect(traceId.toString()).toBe(validUuid);
    });
  });
});
