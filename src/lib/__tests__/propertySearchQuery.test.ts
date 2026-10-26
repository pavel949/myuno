import { describe, expect, it } from 'vitest';
import { readPropertySearchQuery, propertySearchHref, updatePropertySearchSort, normalizePropertySearchQuery } from '../propertySearchQuery';
import { filterValuesToPropertyFilters, mergeSearchBarIntoFilterValues } from '../propertyCatalogServerFilters';
import { civilDateKey } from '../hotelDates';

describe('unified residential query compatibility', () => {
  it.each([['rent-month', 'medium'], ['rent-long', 'long']])('preserves legacy persona intent %s without dropping URL context', (intent, tenancy) => {
    const href = propertySearchHref(`?intent=${intent}&persona=P3&returnTo=%2Ffor%2Flong-stay&district=layan&checkIn=2027-01-20&checkOut=2027-02-20&guests=3`);
    const params = new URL(href, 'https://www.myuno.app').searchParams;
    const state = readPropertySearchQuery(params);
    expect(state.tenancy).toBe(tenancy);
    expect(state.mode).toBe('rent');
    expect(state.search.guests).toBe(3);
    expect(civilDateKey(state.search.checkIn!)).toBe('2027-01-20');
    expect(Object.fromEntries(params)).toMatchObject({ intent, persona: 'P3', returnTo: '/for/long-stay', district: 'layan' });
    params.set('tenancy', 'short');
    expect(readPropertySearchQuery(params).tenancy).toBe('short');
  });
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
    expect(filters).toMatchObject({ district: 'layan', propertyTypes: ['villa', 'condo'], minBedrooms: 2, rentTenancy: 'medium' });
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
  it.each(['2.5', '0', '-1', '51', 'NaN'])('does not apply invalid guest count %s', guests => {
    const state = readPropertySearchQuery(new URLSearchParams({ guests }));
    expect(state.hasGuestFilter).toBe(false);
    expect(state.search.guests).toBe(2);
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

describe('validated sort URL contract', () => {
  it.each(['recommended', 'price_asc', 'price_desc', 'rating', 'newest'])('hydrates sort %s', sort => {
    expect(readPropertySearchQuery(new URLSearchParams({ sort })).sort).toBe(sort);
  });
  it.each(['', 'priceasc', 'unknown', 'PRICE_ASC'])('rejects unknown sort %s without affecting criteria', sort => {
    const state = readPropertySearchQuery(new URLSearchParams({ sort, district: 'unknown-area', guests: '4', q: 'view' }));
    expect(state.sort).toBe('recommended');
    expect(state.search.locations).toEqual(['unknown-area']);
    expect(state.search.guests).toBe(4);
  });
});

 it('changes only the sort key and retains mixed known/unknown criteria', () => {
 const original = new URLSearchParams('opaque=keep&q=sea&district=unknown&guests=4&cats=pool&f.amenities=wifi&f.poolType=shared&sort=rating');
 const updated = updatePropertySearchSort(original, 'price_asc');
 expect(updated.get('sort')).toBe('price_asc');expect(original.get('sort')).toBe('rating');
 for(const [key,value]of original)if(key!=='sort')expect(updated.get(key)).toBe(value);
 expect(updatePropertySearchSort(updated, 'recommended').has('sort')).toBe(false);
 });

 it('treats invalid civil dates as optional unset criteria without inventing an area',()=>{const state=readPropertySearchQuery(new URLSearchParams('checkIn=2027-02-30&checkOut=bad'));expect(state.search.checkIn).toBeUndefined();expect(state.search.checkOut).toBeUndefined();expect(state.search.locations).toEqual([]);});

describe('catalogue intent is explicit', () => {
  it.each(['', 'q=Needle', 'guests=', 'guests=invalid', 'tenancy=unknown', 'intent=unknown', 'f.priceLevel=unknown'])('does not inject a rental intent for %s', query => {
    expect(readPropertySearchQuery(new URLSearchParams(query)).hasIntent).toBe(false);
  });
  it.each(['mode=rent', 'mode=buy', 'tenancy=medium', 'guests=3', 'f.listingType=sale'])('retains supported bookmarks %s', query => {
    expect(readPropertySearchQuery(new URLSearchParams(query)).hasIntent).toBe(true);
  });
});

it('normalizes direct All bookmarks before any reader can see hidden stay criteria', () => {
  const params = new URLSearchParams('mode=all&guests=8&instant=1&f.guestsAtLeast=10&f.instantBooking=yes&tenancy=long&checkIn=2027-05-01&checkOut=2027-05-03&f.priceLevel=3&intent=quick_sale&quick=1&q=Needle&district=layan&opaque=keep');
  const state = readPropertySearchQuery(params);
  expect(state.hasGuestFilter).toBe(false); expect(state.search.instantBooking).toBe(false);
  expect(state.search.checkIn).toBeUndefined(); expect(state.filterValues.instantBooking).toBeUndefined(); expect(state.saleIntent).toBeUndefined();
  expect(Object.fromEntries(normalizePropertySearchQuery(params))).toEqual({ mode:'all',q:'Needle',district:'layan',opaque:'keep' });
  expect(params.get('guests')).toBe('8');
});
