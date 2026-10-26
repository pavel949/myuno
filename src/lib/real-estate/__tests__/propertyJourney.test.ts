import { describe, expect, it } from 'vitest';
import { propertyArea, propertyOffers, propertyOfferHref, readPropertyJourneyReturn } from '../propertyJourney';

describe('public property journey', () => {
  it.each(['Bang Tao', 'bang-tao', 'bang_tao', 'Bangtao', 'Банг Тао'])('resolves %s to the canonical guide', district => {
    expect(propertyArea(district)?.slug).toBe('bang-tao');
  });
  it.each([undefined, null, '', 'Unknown district'])('does not invent a guide for %s', district => {
    expect(propertyArea(district)).toBeUndefined();
  });
  it('does not treat prices, operator identity or a URL as offer eligibility', () => {
    expect(propertyOffers({})).toEqual({ rent: false, buy: false, long: false });
    expect(propertyOffers({ listing_type: 'rent' })).toEqual({ rent: true, buy: false, long: false });
    expect(propertyOffers({ listing_modes: ['rent', 'sale'], tenancy_modes: ['long'] })).toEqual({ rent: true, buy: true, long: true });
    expect(propertyOffers({ listing_type: 'sale', tenancy_modes: ['long'] })).toEqual({ rent: false, buy: true, long: false });
  });
  it('carries rental dates and guests through the long-stay link without leaking operator context', () => {
    const href = propertyOfferHref('unit', 'rent', '?checkIn=2026-12-01&checkOut=2026-12-08&guests=3&company=private', 'long');
    expect(href).toBe('/property/unit?mode=rent&checkIn=2026-12-01&checkOut=2026-12-08&guests=3&tenancy=long');
  });
  it('uses the purchase route without rental checkout parameters', () => {
    expect(propertyOfferHref('unit', 'buy', '?tenancy=long&checkIn=2026-12-01&guests=3')).toBe('/property/unit?mode=buy');
  });
  it('preserves a safe round-trip destination including the guest criteria', () => {
    const item = { href: '/property/unit-1?mode=rent&guests=3', title: 'Home' };
    expect(readPropertyJourneyReturn({ propertyJourney: item })).toEqual(item);
  });
  it.each(['https://evil.example', '//evil.example', '/admin/users', '/property/../admin', '/property/unit#bad'])('rejects unsafe return destination %s', href => {
    expect(readPropertyJourneyReturn({ propertyJourney: { href, title: 'Home' } })).toBeUndefined();
  });
  it.each([null, {}, { propertyJourney: null }, { propertyJourney: { href: '/property/unit', title: 3 } }])('handles malformed navigation state', state => {
    expect(readPropertyJourneyReturn(state)).toBeUndefined();
  });
});
