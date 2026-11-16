import { describe, expect, it } from 'vitest';
import { commercialRecordedPrice } from './commercialPricePresentation';
import type { CommercialProperty } from '@/hooks/useCommercialProperties';
const property = (overrides: Partial<CommercialProperty> = {}): CommercialProperty => ({ id: 'synthetic', title_en: 'Synthetic', title_ru: 'Тест', property_type: 'office', listing_type: 'sale', asset_class: 'commercial', created_at: '2026-11-16', sale_price: 250000, sale_currency: 'USD', currency: 'THB', ...overrides });
describe('commercial cards/details use canonical recorded offer prices', () => {
  it('uses sale currency instead of relabelling a sale amount as THB', () => expect(commercialRecordedPrice(property(), 'en')).toBe('USD 250,000.00'));
  it('keeps unknown sale currency unknown', () => expect(commercialRecordedPrice(property({ sale_currency: null }), 'en')).toBe('Price on request'));
  it('permits a recorded legacy sale-only price', () => expect(commercialRecordedPrice(property({ sale_price: null, price: 450000, currency: 'THB' }), 'en')).toBe('THB 450,000'));
  it('never borrows the asking sale price for a rental', () => expect(commercialRecordedPrice(property({ listing_type: 'rent', price: null }), 'en')).toBe('Price on request'));
  it('keeps a dual-listed rental card on its rental offer', () => expect(commercialRecordedPrice(property({ listing_type: 'rent', is_for_sale: true, price_per_month: 12000, currency: 'THB' }), 'en')).toBe('THB 12,000 / month'));
  it('uses the recorded rental period and currency', () => expect(commercialRecordedPrice(property({ listing_type: 'rent', price: 900, price_period: 'month', currency: 'USD' }), 'en')).toBe('USD 900.00 / month'));
  it('does not invent a period for an untyped rental amount', () => expect(commercialRecordedPrice(property({ listing_type: 'rent', price: 900, price_period: null }), 'en')).toBe('Price on request'));
  it('fails closed for conflicting same-period amounts', () => expect(commercialRecordedPrice(property({ listing_type: 'rent', price: 900, price_period: 'month', price_per_month: 1000 }), 'en')).toBe('Price on request'));
  it.each([0, -1, NaN, Infinity])('does not present %s as a property price', amount => expect(commercialRecordedPrice(property({ sale_price: amount }), 'en')).toBe('Price on request'));
  it('uses a localized unknown label', () => expect(commercialRecordedPrice(property({ sale_currency: null }), 'ru')).toBe('Цена по запросу'));
});
