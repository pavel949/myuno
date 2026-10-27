import { describe, expect, it } from 'vitest';
import type { Property } from '@/hooks/useProperties';
import { surfaceFromProperty } from './listingViewModel';
const home = { id: 'test', listing_type: 'rent', currency: 'THB', price: 2000 } as Property;
describe('catalog price semantics', () => {
  it('never substitutes rent for an unknown sale price', () => {
    expect(surfaceFromProperty(home, 'buy').priceHintThb).toBeNull();
  });
  it('does not guess sale currency', () => {
    expect(surfaceFromProperty({ ...home, sale_price: 1000000 }, 'buy').priceHintThb).toBeNull();
    expect(surfaceFromProperty({ ...home, sale_price: 1000000, sale_currency: 'USD' }, 'buy').priceHintThb).toBeNull();
    expect(surfaceFromProperty({ ...home, sale_price: 1000000, sale_currency: 'THB' }, 'buy').priceHintThb).toBe(1000000);
  });
  it.each([['month', 50000, 'per_month'], ['monthly', 50000, 'per_month'], ['year', 500000, 'per_year'], ['weekly', 2000, 'per_week'], ['day', 2000, 'per_night']] as const)('preserves %s rental billing', (period, amount, mode) => {
    expect(surfaceFromProperty({ ...home, price_period: period, price_per_month: 50000, price_per_year: 500000 })).toMatchObject({ priceHintThb: amount, priceMode: mode });
  });
  it('does not guess an unspecified or unknown legacy period', () => {
    expect(surfaceFromProperty(home).priceMode).toBe('unknown');
    expect(surfaceFromProperty({ ...home, price_period: 'custom' }).priceMode).toBe('unknown');
  });
  it('keeps long tenancy and monthly billing separate', () => {
    expect(surfaceFromProperty({ ...home, tenancy_modes: ['long'], price_period: 'month', price_per_month: 50000, price_per_year: 500000 })).toMatchObject({ priceHintThb: 50000, priceMode: 'per_month' });
  });
  it('uses a dedicated monthly tariff without relabelling nightly data', () => {
    expect(surfaceFromProperty({ ...home, price_per_month: 50000 })).toMatchObject({ priceHintThb: 50000, priceMode: 'per_month' });
    expect(surfaceFromProperty({ ...home, price_period: 'night', price_per_night: 2000, price_per_month: 50000 })).toMatchObject({ priceHintThb: 2000, priceMode: 'per_night' });
  });
  it.each([0, -1, NaN, Infinity])('keeps invalid tariff %s unknown', price => {
    expect(surfaceFromProperty({ ...home, price, price_period: 'month' }).priceMode).toBe('unknown');
  });
  it('retains purchase intent in the detail link', () => {
    expect(surfaceFromProperty(home, 'buy').href).toContain('mode=buy');
  });
});

it.each(['constructor', '__proto__', 'toString'])('keeps inherited-object period %s unknown', price_period => {
  expect(surfaceFromProperty({ ...home, price_period })).toMatchObject({ priceHintThb: null, priceMode: 'unknown' });
});
