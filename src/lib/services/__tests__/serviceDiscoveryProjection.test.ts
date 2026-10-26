import { describe, expect, it } from 'vitest';
import { CATEGORIES, LIFE_SITUATIONS } from '@/lib/catalog/taxonomy';
import { filterMarketplaceServices, matchesServiceQuery, projectServiceDiscovery, serviceDiscoveryCategories, serviceDiscoveryMenu, serviceDiscoverySituations } from '../serviceDiscoveryProjection';
import { buildServiceCategoryUrl, clearServiceDiscoveryQuery, readServiceDiscoveryQuery, updateServiceDiscoveryQuery } from '../serviceDiscoveryQuery';
const categories = serviceDiscoveryCategories(CATEGORIES);
const blank = { query: '', category: '', situation: '' };
describe('canonical service projections and URL state', () => {
  it('preserves service IDs and destinations across modes, deduplicated by ID', () => {
    const rows = projectServiceDiscovery(categories, blank);
    expect(new Set(rows.map(row => row.service.id)).size).toBe(rows.length);
    for (const row of rows) expect(CATEGORIES.flatMap(category => category.services)).toContain(row.service);
    for (const situation of serviceDiscoverySituations(categories, LIFE_SITUATIONS)) {
      const filtered = projectServiceDiscovery(categories, { ...blank, situation: situation.code });
      expect(filtered.length).toBeGreaterThan(0);
      for (const row of filtered) expect(rows.find(item => item.service.id === row.service.id)?.service.path).toBe(row.service.path);
    }
  });
  it('projects the compact menu from active canonical records, keeping yacht identity', () => {
    const menu = serviceDiscoveryMenu(CATEGORIES);
    expect(menu.primary.map(item => item.id)).toEqual(['cat-home-services', 'cat-transport', 'cat-tourism']);
    expect(menu.yacht).toBe(CATEGORIES.flatMap(item => item.services).find(item => item.id === 'yacht'));
    expect(menu.yacht?.path).toBe('/yachts');
    const limited = serviceDiscoveryMenu(CATEGORIES.filter(item => item.id !== 'cat-tourism'));
    expect(limited.yacht).toBeUndefined();
    expect(limited.primary.some(item => item.id === 'cat-tourism')).toBe(false);
    expect(serviceDiscoveryMenu(CATEGORIES.map(item => ({ ...item, status: 'soon' })))).toEqual({ primary: [], more: [], yacht: undefined });
  });
  it('never invents associations for unknown service slugs or inactive entities', () => {
    const source = CATEGORIES[0];
    const injected = { ...source, services: [{ ...source.services[0], id: 'unmapped', situationCodes: undefined }] };
    expect(projectServiceDiscovery([injected], { ...blank, situation: 'arrival' })).toEqual([]);
    expect(serviceDiscoveryCategories([{ ...injected, status: 'soon' }])).toEqual([]);
    expect(serviceDiscoveryCategories([{ ...injected, services: [{ ...injected.services[0], status: 'pro' }] }])).toEqual([]);
    expect(projectServiceDiscovery(categories, { ...blank, category: 'unknown' })).toEqual([]);
  });
  it('requires all search terms and applies category/situation as an intersection', () => {
    expect(matchesServiceQuery('  air  CONDITIONING ', ['Air conditioning'])).toBe(true);
    expect(matchesServiceQuery('air yacht', ['Air conditioning'])).toBe(false);
    const rows = projectServiceDiscovery(categories, { query: 'transfer', category: 'cat-transport', situation: 'arrival' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(row => row.category.id === 'cat-transport' && row.service.situationCodes?.includes('arrival'))).toBe(true);
  });
  it('switches views without silently discarding combined filters or unrelated URL parameters', () => {
    const initial = new URLSearchParams('q=boat+%26+tour&category=cat-tourism&situation=tourist&ref=trip');
    const next = updateServiceDiscoveryQuery(initial, 'browse', 'situations');
    expect(readServiceDiscoveryQuery(next)).toEqual({ query: 'boat & tour', category: 'cat-tourism', situation: 'tourist', view: 'situations' });
    expect(initial.has('browse')).toBe(false);
    const reset = clearServiceDiscoveryQuery(next);
    expect(reset.toString()).toBe('ref=trip&browse=situations');
  });
  it.each(['constructor', '__proto__', 'unknown'])('keeps unsupported deep link %s explicit', category => {
    expect(readServiceDiscoveryQuery(new URLSearchParams({ category })).category).toBe(category);
  });
  it('treats explicit all bookmarks as an unfiltered catalogue', () => {
    expect(readServiceDiscoveryQuery(new URLSearchParams('category=all&situation=all'))).toMatchObject({ category: '', situation: '' });
  });
  it('uses the same text matcher for provider-only search without fabricating category IDs', () => {
    const offers = [{ name_en: 'Island service', name_ru: null, provider: { name: 'Synthetic team' } }];
    expect(filterMarketplaceServices(offers, 'synthetic island')).toEqual(offers);
    expect(filterMarketplaceServices(offers, 'unmatched')).toEqual([]);
    expect(offers[0]).not.toHaveProperty('category');
  });
  it('encodes category values and retains equivalent legacy home names', () => {
    const url = new URL(buildServiceCategoryUrl('a/b & c#d'), 'https://fixture.test');
    expect(url.pathname).toBe('/discover/services');
    expect(url.searchParams.get('category')).toBe('a/b & c#d');
    expect(readServiceDiscoveryQuery(new URLSearchParams('type=ac-repair')).category).toBe('ac');
  });
});
