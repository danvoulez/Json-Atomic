import { Result } from '../../core/domain/Result';
import { DomainError } from '../../core/domain/errors/DomainErrors';

describe('Result Pattern', () => {
  describe('ok', () => {
    it('should create successful result', () => {
      const result = Result.ok(42);

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
    });

    it('should return value', () => {
      const result = Result.ok(42);

      if (result.isSuccess) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe('fail', () => {
    it('should create error result', () => {
      const error = new DomainError('Test error');
      const result = Result.fail(error);

      expect(result.isFailure).toBe(true);
      expect(result.isSuccess).toBe(false);
    });

    it('should return error', () => {
      const error = new DomainError('Test error');
      const result = Result.fail(error);

      if (result.isFailure) {
        expect(result.error).toBe(error);
        expect(result.error.message).toBe('Test error');
      }
    });
  });

  describe('map', () => {
    it('should transform ok value', () => {
      const result = Result.ok(42).map((x) => x * 2);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe(84);
      }
    });

    it('should not transform error', () => {
      const error = new DomainError('Test error');
      const result = Result.fail<number, DomainError>(error).map((x) => x * 2);

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBe(error);
      }
    });

    it('should chain multiple maps', () => {
      const result = Result.ok(10)
        .map((x) => x * 2)
        .map((x) => x + 5)
        .map((x) => x.toString());

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe('25');
      }
    });
  });

  describe('flatMap', () => {
    it('should chain operations returning Result', () => {
      const divide = (a: number, b: number): Result<number, DomainError> => {
        if (b === 0) {
          return Result.fail(new DomainError('Division by zero'));
        }
        return Result.ok(a / b);
      };

      const result = Result.ok(10).flatMap((x) => divide(x, 2));

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe(5);
      }
    });

    it('should propagate errors', () => {
      const divide = (a: number, b: number): Result<number, DomainError> => {
        if (b === 0) {
          return Result.fail(new DomainError('Division by zero'));
        }
        return Result.ok(a / b);
      };

      const result = Result.ok(10).flatMap((x) => divide(x, 0));

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toBe('Division by zero');
      }
    });

    it('should not execute on error', () => {
      const error = new DomainError('Initial error');
      let called = false;

      const result = Result.fail<number, DomainError>(error).flatMap((x) => {
        called = true;
        return Result.ok(x * 2);
      });

      expect(called).toBe(false);
      expect(result.isFailure).toBe(true);
    });
  });

  describe('match', () => {
    it('should call ok handler for success', () => {
      const result = Result.ok(42);
      const value = result.match(
        (val) => val * 2,
        (err) => -1
      );

      expect(value).toBe(84);
    });

    it('should call error handler for failure', () => {
      const error = new DomainError('Test error');
      const result = Result.fail<number, DomainError>(error);
      const value = result.match(
        (val) => val * 2,
        (err) => err.message
      );

      expect(value).toBe('Test error');
    });
  });

  describe('unwrapOr', () => {
    it('should return value for ok', () => {
      const result = Result.ok(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    it('should return default for error', () => {
      const error = new DomainError('Test error');
      const result = Result.fail<number, DomainError>(error);
      expect(result.unwrapOr(0)).toBe(0);
    });
  });

  describe('error handling flow', () => {
    it('should handle complete success flow', () => {
      const parseNumber = (s: string): Result<number, DomainError> => {
        const n = parseInt(s, 10);
        if (isNaN(n)) {
          return Result.fail(new DomainError('Invalid number'));
        }
        return Result.ok(n);
      };

      const double = (n: number): Result<number, DomainError> => Result.ok(n * 2);

      const result = parseNumber('21')
        .flatMap(double)
        .map((n) => n.toString());

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe('42');
      }
    });

    it('should handle error in chain', () => {
      const parseNumber = (s: string): Result<number, DomainError> => {
        const n = parseInt(s, 10);
        if (isNaN(n)) {
          return Result.fail(new DomainError('Invalid number'));
        }
        return Result.ok(n);
      };

      const double = (n: number): Result<number, DomainError> => Result.ok(n * 2);

      const result = parseNumber('invalid')
        .flatMap(double)
        .map((n) => n.toString());

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toBe('Invalid number');
      }
    });
  });
});
