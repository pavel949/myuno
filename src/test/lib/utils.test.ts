import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn (classNames utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      // eslint-disable-next-line no-constant-binary-expression
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      // eslint-disable-next-line no-constant-binary-expression
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('handles arrays of class names', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('handles object syntax', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('merges Tailwind classes correctly', () => {
      // Later classes should override earlier ones
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles complex combinations', () => {
      const result = cn(
        'base-class',
        // eslint-disable-next-line no-constant-binary-expression
        true && 'conditional-true',
        // eslint-disable-next-line no-constant-binary-expression
        false && 'conditional-false',
        { 'object-true': true, 'object-false': false },
        ['array-class']
      );
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-true');
      expect(result).not.toContain('conditional-false');
      expect(result).toContain('object-true');
      expect(result).not.toContain('object-false');
      expect(result).toContain('array-class');
    });
  });
});
