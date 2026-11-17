import { describe, expect, it } from 'vitest';
import { parsePropertyArea } from './propertyFormNormalizers';

describe('property area payload', () => {
  it.each([113.82, '113.82', ' 113.82 '])('preserves decimal area %s', value => {
    expect(parsePropertyArea(value)).toBe(113.82);
  });
  it.each([undefined, null, '', '   '])('keeps absent area unknown: %s', value => {
    expect(parsePropertyArea(value)).toBeUndefined();
  });
  it.each([NaN, Infinity, -1, '113.82sqm', 'invalid'])('rejects invalid area %s rather than truncating', value => {
    expect(() => parsePropertyArea(value)).toThrow('Invalid property area');
  });
  it('preserves whole numbers and explicit zero', () => {
    expect(parsePropertyArea('114')).toBe(114);
    expect(parsePropertyArea(0)).toBe(0);
  });
});
