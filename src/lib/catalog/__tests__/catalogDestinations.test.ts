import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createMemoryRouter, matchRoutes } from 'react-router-dom';
import { CATEGORIES, FLAT_SERVICES } from '../taxonomy';
import { projectCatalogCategory, resolveCatalogServiceDestination } from '../serviceLookup';
import { resolveEntityDestination } from '@/lib/config/entityTypes';
import { searchStaticIndex } from '@/lib/search/staticIndex';

const context = { isAuthenticated: false, roles: [], personas: [] };

describe('canonical catalogue projections', () => {
  it('preserves a canonical category ID on the mounted public catalogue route', () => {
    for (const category of CATEGORIES) {
      const projection = projectCatalogCategory(category.id);
      if (['cat-real-estate', 'cat-partner-portal'].includes(category.id)) {
        expect(projection.status).toBe('unavailable');
        expect(searchStaticIndex(category.labelEn, context, 500).some(result => result.id === `cat-${category.id}`)).toBe(false);
        continue;
      }
      expect(projection.status).toBe('resolved');
      if (projection.status !== 'resolved') throw new Error('Expected category destination');
      const url = new URL(projection.href, 'https://fixture.test');
      expect(url.pathname).toBe('/discover/services');
      expect(url.searchParams.get('category')).toBe(category.id);
      expect(projection.services.every(service => category.services.includes(service))).toBe(true);
      const results = searchStaticIndex(category.labelEn, context, 500);
      expect(results.some(result => result.path === projection.href)).toBe(true);
    }
    expect(projectCatalogCategory('unknown').services).toEqual([]);
    expect(projectCatalogCategory('unknown').reason).toBe('unknown-category');
  });

  it('uses identical service destinations for categories and situations, excluding inactive entries', () => {
    for (const category of CATEGORIES) {
      for (const service of projectCatalogCategory(category.id).services) {
        expect(resolveEntityDestination('service', service.id)).toEqual(resolveCatalogServiceDestination(service.id));
        expect(resolveEntityDestination('service', service.id)).toEqual({ status: 'resolved', href: service.path });
      }
    }
    for (const service of FLAT_SERVICES.filter(entry => entry.status === 'soon' || entry.status === 'pro')) {
      expect(resolveEntityDestination('service', service.id).status).toBe('unavailable');
    }
  });

  it('keeps category vocabulary on concrete destinations after search deduplication', () => {
    const category = CATEGORIES.find(entry => entry.id === 'cat-tourism')!;
    const paths = projectCatalogCategory(category.id).services.map(service => service.path);
    expect(searchStaticIndex(category.labelEn, context, 500).some(result => paths.includes(result.path))).toBe(true);
  });
});

describe('LifeOS entity navigation boundary', () => {
  it.each(['unknown-id', 'constructor', '00000000-0000-4000-8000-000000000000'])('does not infer a booking route for unresolved service %s', id => {
    expect(resolveEntityDestination('service', id)).toEqual({ status: 'unavailable', reason: 'unknown-service' });
  });

  it.each(['unknown', 'constructor'])('does not create links for unknown entity type %s', type => {
    expect(resolveEntityDestination(type, 'example').status).toBe('unavailable');
  });

  it.each(['', '.', '..', ' leading', '\ud800'])('rejects invalid entity ID %j', id => {
    expect(resolveEntityDestination('experience', id).status).toBe('unavailable');
  });

  it('encodes opaque IDs rather than allowing query/hash/path injection', () => {
    expect(resolveEntityDestination('experience', 'a/b?x=1#two')).toEqual({ status: 'resolved', href: '/experiences/a%2Fb%3Fx%3D1%23two' });
  });

  it('preserves the source query, hash and state across repeated navigation and Back', async () => {
    const initial = { pathname: '/discover/arrival', search: '?q=boat%20%26%20tour', hash: '#services', state: { returnTo: '/discover?q=boat' } };
    const router = createMemoryRouter([
      { path: '/discover/:code', element: null },
      { path: '/experiences/:id', element: null },
    ], { initialEntries: [initial] });
    const destination = resolveEntityDestination('experience', 'boat & tour');
    expect(destination.status).toBe('resolved');
    if (destination.status !== 'resolved') throw new Error('Expected an experience destination');
    for (let attempt = 0; attempt < 2; attempt++) {
      await router.navigate(destination.href);
      expect(router.state.location.pathname).toBe('/experiences/boat%20%26%20tour');
      await router.navigate(-1);
      expect(router.state.location).toMatchObject(initial);
    }
    router.dispose();
  });

  it('checks concrete entity destinations against real mounted route declarations', () => {
    const source = readFileSync('src/components/layout/AnimatedRoutes.tsx', 'utf8');
    expect(source).toContain('path={APP_ROUTES.PROPERTY}');
    expect(source).toContain('{propertyHubRoutes}');
    const children = readFileSync('src/components/layout/routes/propertyHubRoutes.tsx', 'utf8');
    const paths = [...source.matchAll(/path="([^"]+)"/g)].filter(match => !match[1].includes('*')).map(match => ({ path: match[1] }));
    paths.push(...[...children.matchAll(/path="([^"]+)"/g)].map(match => ({ path: `/property/${match[1]}` })));
    expect(paths.some(route => route.path === '/services/:id')).toBe(false);
    for (const type of ['experience', 'yacht', 'property']) {
      const destination = resolveEntityDestination(type, 'test-id');
      expect(destination.status).toBe('resolved');
      if (destination.status === 'resolved') expect(matchRoutes(paths, destination.href)).not.toBeNull();
    }
  });
});
