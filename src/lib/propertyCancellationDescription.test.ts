import { describe, expect, it } from 'vitest';
import { propertyCancellationDescription } from './propertyCancellationDescription';

describe('stored property cancellation terms', () => {
  it('keeps the strict seven-day partial refund in both languages', () => {
    expect(propertyCancellationDescription('strict', 'en')).toBe('50% refund up to 7 days before check-in, no refund after');
    expect(propertyCancellationDescription('strict', 'ru')).toContain('50%');
    expect(propertyCancellationDescription('strict', 'ru')).toContain('7 дней');
  });
  it('does not invent terms for an unknown stored policy', () => {
    expect(propertyCancellationDescription('custom_contract', 'en')).toBe('custom_contract');
    expect(propertyCancellationDescription('__proto__', 'en')).toBe('__proto__');
  });
});
