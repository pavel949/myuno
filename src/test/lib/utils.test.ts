import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn (classNames utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      const isTrue = true as boolean;
      const isFalse = false as boolean;
      expect(cn('base', isTrue && 'conditional')).toBe('base conditional');
      expect(cn('base', isFalse && 'conditional')).toBe('base');
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
      const condTrue = true as boolean;
      const condFalse = false as boolean;
      const result = cn(
        'base-class',
        condTrue && 'conditional-true',
        condFalse && 'conditional-false',
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
