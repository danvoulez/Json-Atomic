import { canonicalize } from '../../core/canonical';

describe('Canonical JSON Serialization', () => {
  describe('primitives', () => {
    it('should canonicalize null', () => {
      expect(canonicalize(null)).toBe('null');
    });

    it('should canonicalize undefined as null', () => {
      expect(canonicalize(undefined)).toBe('null');
    });

    it('should canonicalize boolean true', () => {
      expect(canonicalize(true)).toBe('true');
    });

    it('should canonicalize boolean false', () => {
      expect(canonicalize(false)).toBe('false');
    });

    it('should canonicalize integer', () => {
      expect(canonicalize(42)).toBe('42');
    });

    it('should canonicalize negative number', () => {
      expect(canonicalize(-123)).toBe('-123');
    });

    it('should canonicalize float', () => {
      expect(canonicalize(3.14)).toBe('3.14');
    });

    it('should canonicalize zero', () => {
      expect(canonicalize(0)).toBe('0');
    });

    it('should reject Infinity', () => {
      expect(() => canonicalize(Infinity)).toThrow('Cannot canonicalize non-finite number');
    });

    it('should reject NaN', () => {
      expect(() => canonicalize(NaN)).toThrow('Cannot canonicalize non-finite number');
    });

    it('should canonicalize string', () => {
      expect(canonicalize('hello')).toBe('"hello"');
    });

    it('should canonicalize empty string', () => {
      expect(canonicalize('')).toBe('""');
    });

    it('should escape special characters in strings', () => {
      expect(canonicalize('hello\nworld')).toBe('"hello\\nworld"');
    });
  });

  describe('arrays', () => {
    it('should canonicalize empty array', () => {
      expect(canonicalize([])).toBe('[]');
    });

    it('should canonicalize simple array', () => {
      expect(canonicalize([1, 2, 3])).toBe('[1,2,3]');
    });

    it('should canonicalize mixed array', () => {
      expect(canonicalize([1, 'hello', true, null])).toBe('[1,"hello",true,null]');
    });

    it('should canonicalize nested arrays', () => {
      expect(canonicalize([[1, 2], [3, 4]])).toBe('[[1,2],[3,4]]');
    });
  });

  describe('objects', () => {
    it('should canonicalize empty object', () => {
      expect(canonicalize({})).toBe('{}');
    });

    it('should canonicalize simple object', () => {
      expect(canonicalize({ name: 'Alice', age: 30 })).toBe('{"age":30,"name":"Alice"}');
    });

    it('should sort object keys', () => {
      expect(canonicalize({ z: 1, a: 2, m: 3 })).toBe('{"a":2,"m":3,"z":1}');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: 'Bob',
          age: 25,
        },
        active: true,
      };
      expect(canonicalize(obj)).toBe('{"active":true,"user":{"age":25,"name":"Bob"}}');
    });

    it('should handle objects with array values', () => {
      expect(canonicalize({ items: [1, 2, 3] })).toBe('{"items":[1,2,3]}');
    });
  });

  describe('determinism', () => {
    it('should produce same output for same object', () => {
      const obj = { b: 2, a: 1, c: 3 };
      const result1 = canonicalize(obj);
      const result2 = canonicalize(obj);

      expect(result1).toBe(result2);
    });

    it('should produce same output regardless of key order', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { c: 3, b: 2, a: 1 };
      const obj3 = { b: 2, a: 1, c: 3 };

      expect(canonicalize(obj1)).toBe(canonicalize(obj2));
      expect(canonicalize(obj2)).toBe(canonicalize(obj3));
    });

    it('should handle complex nested structures deterministically', () => {
      const obj = {
        z: [3, 2, 1],
        a: {
          nested: {
            deep: 'value',
            another: 123,
          },
        },
        m: true,
      };

      const result1 = canonicalize(obj);
      const result2 = canonicalize(obj);

      expect(result1).toBe(result2);
      expect(result1).toBe('{"a":{"nested":{"another":123,"deep":"value"}},"m":true,"z":[3,2,1]}');
    });
  });

  describe('error handling', () => {
    it('should reject undefined types', () => {
      const func = () => {};
      expect(() => canonicalize(func)).toThrow('Cannot canonicalize type');
    });

    it('should reject symbols', () => {
      const sym = Symbol('test');
      expect(() => canonicalize(sym)).toThrow('Cannot canonicalize type');
    });
  });
});
