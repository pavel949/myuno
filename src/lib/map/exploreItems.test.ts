import { describe, expect, it } from 'vitest';
import { experienceExploreItem, mapCoordinates, propertyExploreItems, projectExploreItem } from './exploreItems';
const property = { id: 'unit', lat: 8.01, lng: 98.3, title_en: 'Home', district: 'bang-tao', listing_type: 'rent', currency: 'THB', price_per_night: 5000, price_per_month: 90000 };
describe('truthful map catalogue projection', () => {
  it('rejects missing, zero placeholder and out of range coordinates', () => {
    for (const [lat, lng] of [[null, 98], ['', 98], [NaN, 98], [91, 98], [8, 181], [0, 0], [true, 98]]) expect(mapCoordinates(lat, lng)).toBeNull();
    expect(mapCoordinates('8.1', '98.2')).toEqual({ lat: 8.1, lng: 98.2 });
  });
  it('never substitutes a district centre for missing property coordinates', () => {
    expect(propertyExploreItems({ ...property, lat: null })).toEqual([]);
    expect(projectExploreItem({ id: 'p', district: 'bang-tao' })).toBeNull();
  });
  it('preserves coexisting recorded rental periods and sale intent', () => {
    const items = propertyExploreItems({ ...property, listing_modes: ['rent', 'sale'], sale_price: 9000000, sale_currency: 'THB' });
    expect(items.map(x => x.layer)).toEqual(['sale', 'stay', 'rent']);
    expect(items.map(x => x.priceFrom)).toEqual([9000000, 5000, 90000]);
    expect(items.map(x => x.pricePeriod)).toEqual(['total', 'night', 'month']);
    expect(items[0].href).toContain('mode=buy');
    expect(items[1].href).toContain('mode=rent');
    expect(items[1].href).toContain('tenancy=short');
  });
  it('does not infer an offer from amounts alone', () => {
    expect(propertyExploreItems({ ...property, listing_type: null })).toEqual([]);
    expect(propertyExploreItems({ ...property, listing_type: 'sale', sale_price: 9000000, sale_currency: 'THB' }).map(x => x.layer)).toEqual(['sale']);
  });
  it('honours explicit tenancy and preserves yearly unit', () => {
    const items = propertyExploreItems({ ...property, tenancy_modes: ['long'], price_per_month: null, price_per_year: 1000000 });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ layer: 'rent', pricePeriod: 'year', priceFrom: 1000000 });
  });
  it('retains explicit offer with unknown/conflicting price without inventing a quote', () => {
    const items = propertyExploreItems({ ...property, tenancy_modes: ['short'], price: 3000, price_period: 'night' });
    expect(items[0].priceFrom).toBeNull();
    expect(propertyExploreItems({ ...property, currency: null })[0].priceFrom).toBeNull();
  });
  it('does not duplicate dedicated commercial/land layer', () => {
    expect(propertyExploreItems({ ...property, asset_class: 'land' })).toEqual([]);
    expect(propertyExploreItems({ ...property, asset_class: 'commercial' })).toEqual([]);
  });
  it('keeps project stored backup coordinate and canonical route', () => {
    expect(projectExploreItem({ id: 'p', lat: 0, lng: 0, location_lat: 8, location_lng: 98, price_from: 7000000 })).toMatchObject({ lat: 8, lng: 98, href: '/property/offplan/p', priceFrom: 7000000 });
  });
  it('distinguishes recorded experience meeting point from venue', () => {
    const exp = { id: 'trip', name_en: 'Trip', meeting_point_lat: 8, meeting_point_lng: 98, currency: 'THB', price: 900 };
    expect(experienceExploreItem(exp)).toMatchObject({ locationKind: 'meeting_point', href: '/experiences/trip', priceFrom: 900 });
    expect(experienceExploreItem({ ...exp, lat: 8.2, lng: 98.2 })).toMatchObject({ locationKind: 'place', lat: 8.2 });
    expect(experienceExploreItem({ id: 'trip', district: 'bang-tao' })).toBeNull();
  });
});
