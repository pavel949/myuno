import { describe, expect, it } from 'vitest';
import { propertyDetailPricing, propertyRentalDisplayPrice, propertyRentalRateOptions } from './propertyDetailIntent';

const canvas = { listing_type: 'rent', currency: 'THB', price: 3000, price_period: 'month', price_per_night: 3000 };
describe('one recorded rental tariff schedule', () => {
  it('retains separate same-amount nightly/monthly tariffs without conversion', () => {
    expect(propertyRentalRateOptions(canvas)).toMatchObject({ ambiguous: false, rates: [{ period: 'night', amount: 3000 }, { period: 'month', amount: 3000 }] });
    expect(propertyRentalDisplayPrice(canvas)).toEqual({ period: 'month', amount: 3000 });
    expect(propertyDetailPricing(canvas, { price_per_night: 3000 }, 'rent')).toMatchObject({ canQuoteShortStay: true, pricePerNight: 3000 });
  });
  it.each([
    [{ ...canvas, price_period: 'night', price: 4000 }, null],
    [{ ...canvas, price_per_month: 4000 }, null],
    [canvas, { price_per_night: 4000 }],
    [canvas, { price_per_night: 3000, currency: 'USD' }],
    [{ ...canvas, price_period: 'custom' }, null],
  ])('fails closed for conflicting same-period, currency or unlabelled custom-period sources', (property, terms) => {
    expect(propertyRentalRateOptions(property, terms)).toMatchObject({ ambiguous: true, rates: [] });
    expect(propertyRentalDisplayPrice(property, terms)).toBeNull();
    expect(propertyDetailPricing(property, terms, 'rent')).toMatchObject({ amount: null, pricePerNight: null, canQuoteShortStay: false });
  });
  it('handles the same public monthly/nightly presentation when monthly money is in its dedicated column', () => {
    const property = { ...canvas, price: null, price_per_month: 3000 };
    expect(propertyRentalRateOptions(property).rates).toEqual([{ period: 'night', amount: 3000 }, { period: 'month', amount: 3000 }]);
    expect(propertyDetailPricing(property, null, 'rent')).toMatchObject({ pricePerNight: 3000, canQuoteShortStay: true });
  });
  it('does not let an empty generic amount hide a known independent nightly tariff', () => {
    const property = { ...canvas, price: null };
    expect(propertyRentalDisplayPrice(property)).toEqual({ period: 'night', amount: 3000 });
    expect(propertyDetailPricing(property, null, 'rent')).toMatchObject({ pricePerNight: 3000, canQuoteShortStay: true });
  });
  it('coalesces matching aliases and duplicate sources once per period', () => {
    expect(propertyRentalRateOptions({ ...canvas, price_period: 'daily' }, { price_per_night: 3000 }).rates).toEqual([{ period: 'night', amount: 3000 }]);
  });
  it('never supplies a nightly rate from monthly, yearly or unknown legacy money', () => {
    for (const price_period of ['month', 'year', undefined]) {
      expect(propertyDetailPricing({ ...canvas, price_period, price_per_night: null }, null, 'rent')).toMatchObject({ pricePerNight: null, canQuoteShortStay: false });
    }
  });
});
