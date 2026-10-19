import { describe, expect, it } from 'vitest';
import { formatServicePrice } from './formatServicePrice';
describe('stored service prices', () => {
  it('preserves zero and the stored currency', () => expect(formatServicePrice(0, 'USD', 'en')).toBe('0 USD'));
  it('does not convert EUR into Thai baht', () => expect(formatServicePrice(25, 'EUR', 'en')).toBe('25 EUR'));
  it('marks unknown denomination explicitly', () => expect(formatServicePrice(25, null, 'en')).toContain('currency unavailable'));
  it.each([null, undefined, Number.NaN, Infinity])('keeps unknown price %s distinct from free', value => expect(formatServicePrice(value, 'THB', 'ru')).toBe('Цена по запросу'));
});
