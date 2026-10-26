import { describe, expect, it } from 'vitest';
import type { Property } from '@/hooks/useProperties';
import { comparePropertiesForSort, getEffectivePropertySortPrice } from '../propertySortPrice';
const property = (fields: Partial<Property>) => ({ currency: 'THB', sale_currency: fields.currency ?? 'THB', ...fields }) as Property;
describe('catalogue sorting matches displayed offer', () => {
  it('uses the rental amount on Rent even for a dual-listed sale-type row', () => {
    expect(getEffectivePropertySortPrice(property({ listing_type: 'sale', listing_modes: ['rent', 'sale'], price_per_night: 3000, sale_price: 5000000 }), 'rent')).toBe(3000);
  });
  it('does not turn a contradictory legacy rental amount into a sale sorting price', () => {
    expect(getEffectivePropertySortPrice(property({ listing_type: 'sale', listing_modes: ['rent'], price: 14000, sale_price: null }), 'buy')).toBeNull();
  });
  it.each(['price_asc', 'price_desc'] as const)('keeps unknown asking prices last for %s', sort => {
    const unknown = property({ listing_type: 'rent', price: 2000, sale_price: null });
    const known = property({ sale_price: 5000000 });
    expect(comparePropertiesForSort(unknown, known, sort, 'buy')).toBeGreaterThan(0);
    expect(comparePropertiesForSort(known, unknown, sort, 'buy')).toBeLessThan(0);
    expect(comparePropertiesForSort(unknown, unknown, sort, 'buy')).toBe(0);
  });
  it('orders known amounts in both directions', () => {
    const low = property({ price_per_night: 1000 });
    const high = property({ price_per_night: 3000 });
    expect(comparePropertiesForSort(low, high, 'price_asc', 'rent')).toBeLessThan(0);
    expect(comparePropertiesForSort(low, high, 'price_desc', 'rent')).toBeGreaterThan(0);
  });
  it.each([0, -1, NaN, null])('treats invalid rental price %s as unknown', price => {
    expect(getEffectivePropertySortPrice(property({ price, price_per_night: price }), 'rent')).toBeNull();
  });
});

describe('mixed catalogue comparable price groups', () => {
  const homes = [
    property({ id: 'sale-high', listing_type: 'sale', sale_price: 3000000, price: 1, currency: 'THB' }),
    property({ id: 'dual-low', listing_type: 'rent', listing_modes: ['sale', 'rent'], sale_price: 1000000, price_per_night: 99999, currency: 'THB' }),
    property({ id: 'night-high', listing_type: 'rent', price: 3000, price_period: 'night', currency: 'THB' }),
    property({ id: 'month-low', listing_type: 'rent', price: 100, price_period: 'month', currency: 'THB' }),
    property({ id: 'night-low', listing_type: 'rent', price: 1000, price_period: 'night', currency: 'THB' }),
  ];
  it.each([
    ['price_asc', ['dual-low', 'sale-high', 'night-low', 'night-high', 'month-low']],
    ['price_desc', ['sale-high', 'dual-low', 'night-high', 'night-low', 'month-low']],
  ] as const)('sorts %s by the visible amount only within comparable offer groups', (sort, expected) => {
    expect([...homes].sort((a,b)=>comparePropertiesForSort(a,b,sort,'all')).map(home=>home.id)).toEqual(expected);
  });
  it.each(['price_asc','price_desc'] as const)('keeps an unknown dual asking amount last within its group for %s', sort => {
    const unknown = property({ listing_type: 'rent', listing_modes: ['rent','sale'], sale_price: null, price: 10, currency: 'THB' });
    const known = property({ listing_type: 'sale', sale_price: 5000000, currency: 'THB' });
    expect(comparePropertiesForSort(unknown, known, sort, 'all')).toBeGreaterThan(0);
    expect(comparePropertiesForSort(known, unknown, sort, 'all')).toBeLessThan(0);
  });
  it('never orders different currencies by their raw numerical amounts', () => {
    const thb = property({ listing_type: 'sale', sale_price: 9999999, currency: 'THB' });
    const usd = property({ listing_type: 'sale', sale_price: 1, currency: 'USD' });
    expect(comparePropertiesForSort(thb, usd, 'price_asc', 'all')).toBeLessThan(0);
    expect(comparePropertiesForSort(thb, usd, 'price_desc', 'all')).toBeLessThan(0);
  });
});

it('sorts a long stay by its explicit monthly tariff, not the unrelated nightly field', () => {
  expect(getEffectivePropertySortPrice(property({ tenancy_modes: ['long'], price_period: 'month', price_per_night: 2000, price_per_month: 45000 }), 'rent')).toBe(45000);
});
it('does not guess a legacy amount without a billing period', () => {
  expect(getEffectivePropertySortPrice(property({ price: 2500 }), 'rent')).toBeNull();
});

it.each(['rent', 'buy'] as const)('keeps hidden non-THB %s amounts out of numeric sorting', mode => {
  expect(getEffectivePropertySortPrice(property({ currency: 'USD', sale_currency: 'USD', price_per_night: 100, sale_price: 100000 }), mode)).toBeNull();
});
it('does not use rental currency for an explicit sale amount', () => {
  expect(getEffectivePropertySortPrice(property({ currency: 'THB', sale_currency: null, sale_price: 5000000 }), 'buy')).toBeNull();
});
it.each(['price_asc', 'price_desc'] as const)('keeps rental billing groups stable for %s', sort => {
  const night = property({ listing_type: 'rent', price_per_night: 3000 });
  const month = property({ listing_type: 'rent', price_period: 'month', price_per_month: 1000 });
  expect(comparePropertiesForSort(night, month, sort, 'rent')).toBeLessThan(0);
});
