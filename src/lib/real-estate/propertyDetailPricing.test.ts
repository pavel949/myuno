import { describe, expect, it } from 'vitest';
import { propertyDetailPricing } from './propertyDetailIntent';
const rental = { listing_type: 'rent', currency: 'THB', price: 2000, price_period: 'night' };
describe('truthful public detail tariffs', () => {
  it.each(['medium', 'long'])('keeps monthly billing independent from %s tenancy', tenancy => {
    expect(propertyDetailPricing({ ...rental, tenancy_modes: [tenancy], price: 45000, price_period: 'month', price_per_month: 45000, price_per_year: 500000 }, undefined, 'rent', tenancy)).toMatchObject({ hasOffer: true, canQuoteShortStay: false, amount: 45000, period: 'month' });
  });
  it('preserves valid explicit nightly terms and the existing short-stay inquiry', () => {
    expect(propertyDetailPricing({ ...rental, price: 45000, price_period: 'month', price_per_month: 45000, tenancy_modes: ['short', 'long'] }, { price_per_night: 3000 }, 'rent', 'short')).toMatchObject({ canQuoteShortStay: true, pricePerNight: 3000, amount: 3000, period: 'night' });
  });
  it('preserves an explicit yearly tariff on a manager request without inventing monthly rent', () => {
    expect(propertyDetailPricing({ ...rental, tenancy_modes: ['long'], price: 500000, price_period: 'year', price_per_year: 500000 }, null, 'rent', 'long')).toMatchObject({ amount: 500000, period: 'year', canQuoteShortStay: false });
  });
  it('never promotes unknown/monthly legacy billing to nightly', () => {
    for (const price_period of [undefined, 'month', 'year', 'custom']) {
      expect(propertyDetailPricing({ ...rental, price_period }, null, 'rent')).toMatchObject({ canQuoteShortStay: false, pricePerNight: null });
    }
  });
  it.each([undefined, 'USD', 'EUR'])('does not relabel rental currency %s as THB', currency => {
    expect(propertyDetailPricing({ ...rental, currency }, { price_per_night: 2000 }, 'rent')).toMatchObject({ amount: null, pricePerNight: null, canQuoteShortStay: false, hasOffer: true });
  });
  it.each([undefined, 'USD'])('does not use rental THB for sale currency %s', sale_currency => {
    expect(propertyDetailPricing({ ...rental, listing_modes: ['rent', 'sale'], sale_price: 5000000, sale_currency }, null, 'buy')).toMatchObject({ mode: 'buy', hasOffer: true, amount: null });
  });
  it('retains known THB sale and pure legacy sale amounts', () => {
    expect(propertyDetailPricing({ ...rental, is_for_sale: true, sale_price: 5000000, sale_currency: 'THB' }, null, 'buy').amount).toBe(5000000);
    expect(propertyDetailPricing({ listing_type: 'sale', price: 5000000, currency: 'THB' }, null, 'buy').amount).toBe(5000000);
  });
  it('does not authorize unsupported buy/rent or infer an offer from a URL', () => {
    expect(propertyDetailPricing(rental, null, 'buy')).toMatchObject({ mode: 'rent', hasOffer: true });
    expect(propertyDetailPricing({ listing_type: 'sale', currency: 'THB', sale_price: 5000000, sale_currency: 'THB' }, null, 'rent')).toMatchObject({ mode: 'buy', hasOffer: true, canQuoteShortStay: false });
    expect(propertyDetailPricing({ listing_type: 'unavailable', price: 2000 }, null, 'buy')).toMatchObject({ hasOffer: false, amount: null, canQuoteShortStay: false });
  });
});
