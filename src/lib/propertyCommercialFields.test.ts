import { describe, expect, it } from 'vitest';
import { propertyCommercialInitial, propertyCommercialValues, propertyCommercialPayload, changeCommercialOffer, type PropertyCommercialSource } from './propertyCommercialFields';
import { propertyDetailPricing, propertySaleAskingPrice, propertyRentalDisplayPrice } from './real-estate/propertyDetailIntent';
const blank = { price: null, price_per_night: null, price_per_month: null, price_per_year: null, sale_price: null, price_period: null, currency: null, sale_currency: null, listing_modes: null, listing_type: null, is_for_sale: null };
const fixtures: Array<{ name: string; source: PropertyCommercialSource }> = [
  { name: 'monthly legacy', source: { ...blank, price: 90000, price_period: 'month', currency: 'THB', listing_type: 'rent' } },
  { name: 'nightly legacy', source: { ...blank, price: 2400, price_period: 'night', currency: 'USD', listing_type: 'rent' } },
  { name: 'dedicated-only nightly', source: { ...blank, price_per_night: 2400, currency: 'THB', listing_type: 'rent' } },
  { name: 'sale legacy', source: { ...blank, price: 125000, currency: 'USD', listing_type: 'sale' } },
  { name: 'dual with distinct currencies', source: { ...blank, price: 90000, price_period: 'month', price_per_night: 3100, price_per_month: 85000, price_per_year: 900000, sale_price: 200000, currency: 'THB', sale_currency: 'EUR', listing_modes: ['platform', 'rent', 'sale'], listing_type: 'rent', is_for_sale: true } },
  { name: 'zero and unknown', source: { ...blank, price: 0, price_per_night: 0, price_period: 'custom-contract', listing_modes: [], is_for_sale: false } },
];
describe('commercial field roundtrip without conversion', () => {
  it.each(fixtures)('preserves every stored scalar and explicit offer intent: $name', ({ source }) => {
    const initial = propertyCommercialInitial(source);
    expect(propertyCommercialPayload(propertyCommercialValues(initial), source)).toEqual(source);
  });
  it('changes a dedicated nightly amount without changing monthly, sale or currency fields', () => {
    const source = fixtures[4].source;
    const next = propertyCommercialPayload({ ...propertyCommercialValues(source), price_per_night: '3300.25' }, source);
    expect(next).toEqual({ ...source, price_per_night: 3300.25 });
    expect(propertyRentalDisplayPrice(next)).toEqual({ amount: 85000, period: 'month' });
    expect(propertyDetailPricing(next, { price_per_night: next.price_per_night }, 'rent')).toMatchObject({ pricePerNight: 3300.25, canQuoteShortStay: true });
  });
  it('clears each amount to null while retaining dual modes and separate currencies', () => {
    const source = fixtures[4].source;
    const next = propertyCommercialPayload({ ...propertyCommercialValues(source), price: '', price_per_night: '', price_per_month: '', price_per_year: '', sale_price: '' }, source);
    expect(next).toEqual({ ...source, price: null, price_per_night: null, price_per_month: null, price_per_year: null, sale_price: null });
    expect(propertyDetailPricing(next, null, 'rent').canQuoteShortStay).toBe(false);
  });
  it('keeps a legacy sale amount as sale only, and never promotes it to nightly rent', () => {
    const source = fixtures[3].source;
    const next = propertyCommercialPayload(propertyCommercialValues(propertyCommercialInitial(source)), source);
    expect(propertySaleAskingPrice(next)).toBe(125000);
    expect(next.price_per_night).toBeNull();
    expect(propertyDetailPricing(next, null, 'rent')).toMatchObject({ mode: 'buy', canQuoteShortStay: false });
  });
  it('creates blank/null commercial fields without a made-up amount or billing period', () => {
    const values = propertyCommercialValues({ currency: 'THB', sale_currency: 'USD', listing_modes: ['rent'], listing_type: 'rent', is_for_sale: false });
    expect(propertyCommercialPayload(values, {}, true, true)).toEqual({ ...blank, currency: 'THB', sale_currency: 'USD', listing_modes: ['rent'], listing_type: 'rent', is_for_sale: false });
  });
  it('changes offer intent only from an explicit action, independently of prices', () => {
    const values = propertyCommercialValues({ ...blank, listing_type: 'sale', price_per_night: 3000 });
    expect(propertyCommercialPayload(values, { ...blank, listing_type: 'sale', price_per_night: 3000 }).listing_type).toBe('sale');
    const dual = changeCommercialOffer(values, 'rent', true);
    expect(dual.listing_modes).toEqual(['sale', 'rent']);
    expect(dual.listing_type).toBe('sale');
  });
  it.each(['NaN', 'Infinity', '-1', '1,234', '9007199254740992'])('rejects invalid entered amount %s before writing', value => {
    expect(() => propertyCommercialPayload({ ...propertyCommercialValues(fixtures[4].source), price_per_night: value }, fixtures[4].source)).toThrow();
  });
  it('requires explicit currency and billing unit for changed unknown generic rental pricing', () => {
    const source = { ...blank, listing_type: 'rent' };
    expect(() => propertyCommercialPayload({ ...propertyCommercialValues(source), price: '5000' }, source)).toThrow('currency');
    expect(() => propertyCommercialPayload({ ...propertyCommercialValues(source), price: '5000', currency: 'THB' }, source)).toThrow('period');
  });
});
