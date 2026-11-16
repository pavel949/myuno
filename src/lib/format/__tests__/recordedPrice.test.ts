import { describe, expect, it, vi } from 'vitest';
import { formatRecordedPrice } from '../price';
const quote = { unknownLabel: 'Price on request' };
describe('recorded amount display', () => {
  it('never feeds a stored USD amount through a THB conversion callback', () => {
    const convertTHB = vi.fn((amount: number) => `THB ${amount}`);
    expect(formatRecordedPrice(6000, 'USD', { ...quote, formatTHB: convertTHB })).toBe('USD 6,000.00');
    expect(convertTHB).not.toHaveBeenCalled();
    expect(formatRecordedPrice(6000, ' thb ', { ...quote, formatTHB: convertTHB })).toBe('THB 6000');
    expect(convertTHB).toHaveBeenCalledExactlyOnceWith(6000);
  });
  it.each([null, undefined, '', 'ZZZ', 'constructor'])('does not guess a missing or unknown currency %s', currency => {
    expect(formatRecordedPrice(1500, currency, quote)).toBe(quote.unknownLabel);
  });
  it.each([null, undefined, NaN, Infinity, -1, 0])('does not turn unknown/invalid property price %s into a displayed amount', amount => {
    expect(formatRecordedPrice(amount, 'THB', quote)).toBe(quote.unknownLabel);
  });
  it('permits zero only when the consumer explicitly supports recorded zero', () => {
    expect(formatRecordedPrice(0, 'THB', { ...quote, allowZero: true })).toBe('THB 0');
    expect(formatRecordedPrice(0, undefined, { ...quote, allowZero: true })).toBe(quote.unknownLabel);
  });
});
