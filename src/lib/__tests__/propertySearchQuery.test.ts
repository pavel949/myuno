import { describe, expect, it } from 'vitest';
import { readPropertySearchQuery, propertySearchHref } from '../propertySearchQuery';
import { filterValuesToPropertyFilters, mergeSearchBarIntoFilterValues } from '../propertyCatalogServerFilters';
import { civilDateKey } from '../hotelDates';

describe('unified residential query compatibility', () => {
  it('preserves every parameter and hash-ready alias defaults without dropping advanced filters', () => {
    const href = propertySearchHref('?district=layan&types=villa&guests=4&checkIn=2027-01-20&checkOut=2027-01-25&f.priceLevel=3&cats=pool&company=operator&view=map&opaque=keep', { mode: 'rent', tenancy: 'medium' });
    const p = new URL(href, 'https://myuno.app').searchParams;
    expect(Object.fromEntries(p)).toMatchObject({ district: 'layan', types: 'villa', guests: '4', 'f.priceLevel': '3', cats: 'pool', company: 'operator', view: 'map', opaque: 'keep', tenancy: 'medium' });
    const state = readPropertySearchQuery(p);
    expect(state.tenancy).toBe('medium');
    expect(civilDateKey(state.search.checkIn!)).toBe('2027-01-20');
    expect(civilDateKey(state.search.checkOut!)).toBe('2027-01-25');
  });
  it('adapts legacy scalar and multiple filters to the existing server contract', () => {
    const state = readPropertySearchQuery(new URLSearchParams('f.district=layan&f.propertyType=villa,condo&f.bedrooms=2&f.amenities=wifi&f.viewType=sea&f.priceLevel=2&tenancy=medium'));
    const filters = filterValuesToPropertyFilters(mergeSearchBarIntoFilterValues(state.filterValues, state.search), { listingType: 'rent', rentTenancy: state.tenancy });
    expect(filters).toMatchObject({ district: 'layan', propertyTypes: ['villa', 'condo'], minBedrooms: 2, rentTenancy: 'medium', minPrice: 3000, maxPrice: 8000 });
    expect(state.filterValues.amenities).toEqual(['wifi']);
    expect(state.filterValues.viewType).toEqual(['sea']);
  });
  it('gives explicitly edited primary values precedence, including clearing', () => {
    const state = readPropertySearchQuery(new URLSearchParams('district=&types=condo&f.district=layan&f.propertyType=villa&guests=5&f.guestsAtLeast=8'));
    expect(state.search.locations).toEqual([]);
    expect(state.search.propertyTypes).toEqual(['condo']);
    expect(state.search.guests).toBe(5);
    expect(state.filterValues.district).toBeUndefined();
  });
  it('allows explicit empty and false primary values to clear legacy bedrooms and instant booking', () => {
    const state = readPropertySearchQuery(new URLSearchParams('bedrooms=&f.bedrooms=2&instant=0&f.instantBooking=yes'));
    const filters = filterValuesToPropertyFilters(mergeSearchBarIntoFilterValues(state.filterValues, state.search), { listingType: 'rent', instantBookingFromSearch: state.search.instantBooking });
    expect(filters.minBedrooms).toBeUndefined();
    expect(filters.instantBooking).toBeUndefined();
  });
  it('exposes legacy category-style amenities in the same editable category state', () => {
    const state = readPropertySearchQuery(new URLSearchParams('amenities=pool,wifi&cats=pool,sea_view&f.amenities=washer'));
    expect(state.categories).toEqual(['pool', 'sea_view', 'wifi']);
    expect(state.filterValues.amenities).toEqual(['washer']);
  });
  it.each(['short', 'medium', 'long'] as const)('keeps %s rental duration', tenancy => {
    expect(readPropertySearchQuery(new URLSearchParams({ tenancy })).tenancy).toBe(tenancy);
  });
  it('preserves sale intent and uses sale rather than nightly price bands', () => {
    const state = readPropertySearchQuery(new URLSearchParams('mode=buy&intent=quick_sale&f.priceLevel=2'));
    const filters = filterValuesToPropertyFilters(state.filterValues, { listingType: 'sale', saleIntent: state.saleIntent, isQuickSale: state.isQuickSale });
    expect(filters).toMatchObject({ listingType: 'sale', saleIntent: 'quick_sale', isQuickSale: true, minPrice: 5000000, maxPrice: 15000000 });
  });
  it('accepts old ISO instants and rejects invalid date/party values', () => {
    expect(readPropertySearchQuery(new URLSearchParams('checkIn=2027-01-20T00:00:00.000Z')).search.checkIn?.toISOString()).toBe('2027-01-20T00:00:00.000Z');
    const state = readPropertySearchQuery(new URLSearchParams('checkIn=bad&guests=-9&mode=unknown&tenancy=wrong'));
    expect(state.search.checkIn).toBeUndefined();
    expect(state.search.guests).toBe(2);
    expect(state.mode).toBe('rent');
    expect(state.tenancy).toBe('short');
  });
});
