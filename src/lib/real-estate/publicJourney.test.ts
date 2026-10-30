import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { publicJourneyState, readPublicJourneyOrigin, propertyAreaHref, publicJourneyReturn, rememberPublicJourneyLocation } from './publicJourney';
import { propertyDetailHref } from './propertyDetailIntent';

beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, '', '/'); });
afterEach(() => { sessionStorage.clear(); window.history.replaceState(null, '', '/'); });
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

describe('verified public return plans', () => {
  const search = { pathname: '/property/search', search: '?mode=rent&guests=3&view=map', hash: '#results', key: 'search-entry' };
  const detail = { pathname: '/property/unit', search: '?mode=rent', hash: '', key: 'detail-entry' };
  it('pops only a recorded immediately preceding entry with matching URL, key and index', () => {
    window.history.replaceState({ key: search.key, idx: 4 }, '', search.pathname + search.search);
    const state = publicJourneyState(search);
    window.history.replaceState({ key: detail.key, idx: 5 }, '', detail.pathname);
    expect(publicJourneyReturn({ ...detail, state }, '/property/browse')).toEqual({ delta: -1 });
  });
  it('retains evidence across a reload without relying on an in-memory stack', async () => {
    window.history.replaceState({ key: search.key, idx: 4 }, '', search.pathname);
    const state = publicJourneyState(search);
    window.history.replaceState({ key: detail.key, idx: 5 }, '', detail.pathname);
    const { publicJourneyReturn: afterReload } = await import('./publicJourney');
    expect(afterReload({ ...detail, state }, '/property/browse')).toEqual({ delta: -1 });
  });
  it('replaces with the validated origin if intervening history changed', () => {
    window.history.replaceState({ key: search.key, idx: 4 }, '', search.pathname);
    const state = publicJourneyState(search);
    window.history.replaceState({ key: 'other-entry', idx: 4 }, '', '/property/other');
    rememberPublicJourneyLocation({ ...detail, pathname: '/property/other', key: 'other-entry' });
    window.history.replaceState({ key: detail.key, idx: 5 }, '', detail.pathname);
    expect(publicJourneyReturn({ ...detail, state }, '/property/browse')).toEqual({ href: search.pathname + search.search + search.hash, state: undefined, replace: true });
  });
  it('does not blindly pop when the current history key/index do not match', () => {
    window.history.replaceState({ key: search.key, idx: 4 }, '', search.pathname);
    const state = publicJourneyState(search);
    window.history.replaceState({ key: 'unrelated', idx: 9 }, '', detail.pathname);
    expect(publicJourneyReturn({ ...detail, state }, '/property/browse')).toHaveProperty('replace', true);
  });
  it('returns a direct property URL to the safe catalogue without adding a history entry', () => {
    expect(publicJourneyReturn(detail, '/property/browse?mode=rent&guests=3')).toEqual({ href: '/property/browse?mode=rent&guests=3', state: undefined, replace: true });
  });
  it('preserves the parent search context through an area fallback without a property/area loop', () => {
    const property = { ...detail, state: publicJourneyState(search) };
    const area = { pathname: '/area/bang-tao', search: '', hash: '', key: 'area-entry', state: publicJourneyState(property) };
    const backToProperty = publicJourneyReturn(area, '/property/browse');
    expect(backToProperty).toHaveProperty('href', '/property/unit?mode=rent');
    if (!('href' in backToProperty)) throw Error('Expected conservative replacement');
    const backToSearch = publicJourneyReturn({ ...detail, state: backToProperty.state }, '/property/browse');
    expect(backToSearch).toHaveProperty('href', search.pathname + search.search + search.hash);
  });
  it.each(['https://example.com', '//example.com', '/property/../../admin', '/property/%2e%2e/admin', '/property/%5c%5cexample.com', '/property/%0aevil'])('rejects unsafe return destination %s', href => {
    expect(publicJourneyReturn({ ...detail, state: { publicJourneyOrigin: { href, key: 'x' } } }, '/property/browse')).toEqual({ href: '/property/browse', replace: true, state: undefined });
  });
  it('ignores self-return loops and corrupt tab storage', () => {
    sessionStorage.setItem('myuno-public-journey-entries-v1', 'null');
    expect(publicJourneyReturn({ ...detail, state: { publicJourneyOrigin: { href: '/property/unit?mode=rent', key: detail.key } } }, 'https://example.com')).toEqual({ href: '/property/browse', replace: true, state: undefined });
  });
});

it('records BrowserRouter initial idx0/default so a direct search return uses Back without duplicates', () => {
  const initial = { pathname: '/property/search', search: '?mode=rent', hash: '', key: 'default' };
  window.history.replaceState({ idx: 0 }, '', initial.pathname);
  const state = publicJourneyState(initial);
  window.history.replaceState({ idx: 1, key: 'property-entry' }, '', '/property/unit');
  expect(publicJourneyReturn({ pathname: '/property/unit', search: '', hash: '', key: 'property-entry', state }, '/property/browse')).toEqual({ delta: -1 });
});

it('returns to the complete global search query and category after a reload', () => {
  const search = { pathname: '/search', search: '?q=Canvas&type=property', hash: '#results', key: 'global-search' };
  const detail = { pathname: '/property/synthetic', search: '', hash: '', key: 'detail' };
  const state = publicJourneyState(search);
  expect(publicJourneyReturn({ ...detail, state }, '/property/search?mode=rent')).toEqual({ href: '/search?q=Canvas&type=property#results', state: undefined, replace: true });
});

it.each(['/search/../../admin', '/search/private', '/search%0a'])('rejects non-canonical global search origin %s', href => {
  expect(readPublicJourneyOrigin({ publicJourneyOrigin: { href, key: 'x' } })).toBeUndefined();
});
