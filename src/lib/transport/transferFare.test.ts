import { describe, expect, it } from 'vitest';
import { configuredTransferBasePrice, configuredTransferTotal, transferFareLabel } from './transferFare';
const vehicle = { base_price: 1200, price_multiplier: 1.5 };
describe('configured transfer fare presentation and admission', () => {
  it('keeps the configured route × vehicle multiplier and configured vehicle fallback', () => {
    expect(configuredTransferBasePrice(1000, vehicle)).toBe(1500);
    expect(configuredTransferBasePrice(null, vehicle)).toBe(1200);
    expect(configuredTransferBasePrice(0, vehicle)).toBe(1200);
    expect(configuredTransferTotal(1500, 200)).toBe(1700);
  });
  it('requires an actual selected vehicle even with a route rate', () => {
    expect(configuredTransferBasePrice(1000, undefined)).toBeNull();
  });
  it.each([undefined, null, 0, -1, NaN, Infinity])('does not manufacture a fare from vehicle base %s', base => {
    expect(configuredTransferBasePrice(null, { ...vehicle, base_price: base as number })).toBeNull();
  });
  it.each([undefined, 0, -1, NaN, Infinity])('rejects an unusable route multiplier %s', multiplier => {
    expect(configuredTransferBasePrice(1000, { ...vehicle, price_multiplier: multiplier as number })).toBeNull();
  });
  it('rejects overflow and invalid surcharges', () => {
    expect(configuredTransferBasePrice(Number.MAX_VALUE, vehicle)).toBeNull();
    for (const surcharge of [-1, NaN, Infinity]) expect(configuredTransferTotal(1200, surcharge)).toBeNull();
    expect(configuredTransferTotal(null, 100)).toBeNull();
  });
  it('labels unknown prices without a currency amount', () => {
    expect(transferFareLabel(null, 'ru')).toBe('Стоимость требует подтверждения');
    expect(transferFareLabel(null, 'en')).toBe('Price requires confirmation');
    expect(transferFareLabel(1200, 'en')).toContain('1,200');
  });
});
