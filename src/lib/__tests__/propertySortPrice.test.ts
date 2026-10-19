import { describe, expect, it } from 'vitest';
import type { Property } from '@/hooks/useProperties';
import { comparePropertiesForSort, getEffectivePropertySortPrice } from '../propertySortPrice';
const property = (fields: Partial<Property>) => fields as Property;
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
