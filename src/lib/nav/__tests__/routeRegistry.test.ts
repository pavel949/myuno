/**
 * Tests for the SSOT route registry — guards against drift between the
 * cluster catalog (drawer + /discover surfaces) and the actual router.
 *
 * If any of these fail the user is one tap away from a 404, so we treat
 * the assertions as build-blocking.
 */
import { describe, it, expect } from 'vitest';
import {
  KNOWN_ROUTES,
  isKnownRoute,
  CATALOG_ROUTE_LOOKUP,
  findCatalogServicesByPath,
  findUnknownCatalogPaths,
} from '../routeRegistry';
import { CLUSTER_CATALOG_FLAT } from '../clusterCatalog';
import { APP_ROUTES } from '@/lib/config/routes';

describe('routeRegistry — KNOWN_ROUTES derivation', () => {
  it('captures every static APP_ROUTES string', () => {
    for (const v of Object.values(APP_ROUTES)) {
      if (typeof v === 'string') expect(KNOWN_ROUTES.has(v)).toBe(true);
    }
  });

  it('expands dynamic factory routes so they become matchable', () => {
    // PROPERTY_DETAIL is a factory — its expanded form should be in the set
    // and arbitrary ids should resolve via isKnownRoute.
    expect(isKnownRoute(APP_ROUTES.PROPERTY_DETAIL('abc-123'))).toBe(true);
    expect(isKnownRoute(APP_ROUTES.RESTAURANT_DETAIL('xyz'))).toBe(true);
  });

  it('does NOT match arbitrary unrelated paths', () => {
    expect(isKnownRoute('/totally/made/up')).toBe(false);
    expect(isKnownRoute('/mc/operations')).toBe(false); // legacy typo
    expect(isKnownRoute('')).toBe(false);
  });

  it('strips query strings and hashes before matching', () => {
    expect(isKnownRoute(`${APP_ROUTES.DISCOVER}?cluster=live`)).toBe(true);
    expect(isKnownRoute(`${APP_ROUTES.ACCOUNT}#settings`)).toBe(true);
  });
});

describe('routeRegistry — catalog ↔ router contract', () => {
  it('every cluster service points at a registered route', () => {
    const broken = findUnknownCatalogPaths();
    // Surface the actual offenders so the failure message is actionable.
    expect(
      broken,
      `Unknown catalog routes:\n${broken
        .map((s) => `  - ${s.clusterId}/${s.labelEn} → ${s.path}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('lookup map covers every flat catalog entry', () => {
    for (const svc of CLUSTER_CATALOG_FLAT) {
      const found = findCatalogServicesByPath(svc.path);
      expect(found.length).toBeGreaterThan(0);
      expect(found.some((s) => s.labelEn === svc.labelEn)).toBe(true);
    }
  });

  it('multiple services on one route collapse into the same bucket', () => {
    // /events is referenced by both `live` and `enjoy` clusters.
    const events = findCatalogServicesByPath(APP_ROUTES.EVENTS);
    expect(events.length).toBeGreaterThanOrEqual(2);
    const clusterIds = new Set(events.map((s) => s.clusterId));
    expect(clusterIds.has('live')).toBe(true);
    expect(clusterIds.has('enjoy')).toBe(true);
  });

  it('CATALOG_ROUTE_LOOKUP keys are a subset of catalog paths', () => {
    const catalogPaths = new Set(CLUSTER_CATALOG_FLAT.map((s) => s.path));
    for (const key of CATALOG_ROUTE_LOOKUP.keys()) {
      expect(catalogPaths.has(key)).toBe(true);
    }
  });
});
