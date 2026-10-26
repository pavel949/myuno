import { describe, it, expect } from 'vitest';
import { publicJourneyState, readPublicJourneyOrigin, propertyAreaHref } from './publicJourney';
import { propertyDetailHref } from './propertyDetailIntent';

describe('public property journey', () => {
  it('retains the complete search return location without rebuilding filters', () => {
    const location = { pathname: '/property/search', search: '?mode=rent&tenancy=long&guests=3&f.bedrooms=2&view=map&intent=relocate', hash: '#results', key: 'search-entry' };
    expect(readPublicJourneyOrigin(publicJourneyState(location))).toEqual({ href: location.pathname + location.search + location.hash, key: location.key });
  });
  it('carries guest intent to a property without making URL intent eligibility', () => {
    const params = new URLSearchParams(propertyDetailHref('unit', 'rent', '?tenancy=medium&intent=relocate&guests=2&checkIn=2026-12-01&checkOut=2026-12-15&admin=true').split('?')[1]);
    expect(Object.fromEntries(params)).toEqual({ mode: 'rent', tenancy: 'medium', intent: 'relocate', guests: '2', checkIn: '2026-12-01', checkOut: '2026-12-15' });
  });
  it.each(['https://example.com', '//example.com', '/admin', '/property\\evil', '/property\n/evil'])('rejects non-public return target %s', href => {
    expect(readPublicJourneyOrigin({ publicJourneyOrigin: { href, key: 'x' } })).toBeUndefined();
  });
  it('uses only existing Phuket area names and slugs', () => {
    expect(propertyAreaHref('Bang Tao')).toBe('/area/bang-tao');
    expect(propertyAreaHref('Банг Тао')).toBe('/area/bang-tao');
    expect(propertyAreaHref('bang-tao')).toBe('/area/bang-tao');
    expect(propertyAreaHref('Bangtao')).toBe('/area/bang-tao');
    expect(propertyAreaHref('bang_tao')).toBe('/area/bang-tao');
    expect(propertyAreaHref('unknown district')).toBeUndefined();
    expect(propertyAreaHref(null)).toBeUndefined();
  });
});
