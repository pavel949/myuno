/**
 * Catalog SSOT coverage test.
 *
 * Guards the invariants of `src/lib/catalog/taxonomy.ts`:
 *  - Every category belongs to exactly one cluster.
 *  - Every service id is unique within its category.
 *  - Every cluster declared in CLUSTERS has a stable id matching the
 *    DB `category_groups.slug` whitelist.
 *  - Adapter modules (`verticalGroups`, `clusterCatalog`) re-emit the
 *    same 6-cluster ordering (no orphan groups).
 */
import { describe, expect, it } from 'vitest';
import {
  CLUSTERS,
  CATEGORIES,
  FLAT_SERVICES,
  AVAILABLE_SERVICES,
  getCategoriesByCluster,
  getServicesByCluster,
} from '@/lib/catalog';
import { VERTICAL_GROUPS } from '@/lib/verticalGroups';
import { CLUSTER_CATALOG } from '@/lib/nav/clusterCatalog';

const CANONICAL_CLUSTER_IDS = ['arrive', 'live', 'manage', 'invest', 'legal', 'build'] as const;

describe('catalog SSOT — clusters', () => {
  it('exposes exactly 6 canonical clusters', () => {
    expect(CLUSTERS).toHaveLength(6);
    const ids = CLUSTERS.map((c) => c.id).sort();
    expect(ids).toEqual([...CANONICAL_CLUSTER_IDS].sort());
  });

  it('every cluster has a unique stable sortOrder', () => {
    const orders = CLUSTERS.map((c) => c.sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('every cluster has at least one category', () => {
    for (const c of CLUSTERS) {
      const cats = getCategoriesByCluster(c.id);
      expect(cats.length, `cluster ${c.id} has no categories`).toBeGreaterThan(0);
    }
  });
});

describe('catalog SSOT — categories', () => {
  it('every category belongs to a known cluster', () => {
    const clusterIds = new Set(CLUSTERS.map((c) => c.id));
    for (const cat of CATEGORIES) {
      expect(clusterIds.has(cat.clusterId), `${cat.id} → unknown cluster ${cat.clusterId}`).toBe(true);
    }
  });

  it('every category id is unique', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('expects 16 canonical categories', () => {
    expect(CATEGORIES).toHaveLength(16);
  });
});

describe('catalog SSOT — services', () => {
  it('every service id is unique within its category', () => {
    for (const cat of CATEGORIES) {
      const ids = cat.services.map((s) => s.id);
      expect(new Set(ids).size, `dup in ${cat.id}`).toBe(ids.length);
    }
  });

  it('every available service has a non-empty path and labels', () => {
    for (const svc of AVAILABLE_SERVICES) {
      expect(svc.path, `${svc.id} missing path`).toBeTruthy();
      expect(svc.labelRu, `${svc.id} missing RU label`).toBeTruthy();
      expect(svc.labelEn, `${svc.id} missing EN label`).toBeTruthy();
    }
  });

  it('clusters expose services via getServicesByCluster', () => {
    const total = CLUSTERS.reduce((sum, c) => sum + getServicesByCluster(c.id).length, 0);
    expect(total).toBe(FLAT_SERVICES.length);
  });
});

describe('catalog SSOT — adapters', () => {
  it('VERTICAL_GROUPS mirrors the 6 SSOT clusters in order', () => {
    expect(VERTICAL_GROUPS.map((g) => g.id)).toEqual(
      [...CLUSTERS].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => c.id)
    );
  });

  it('CLUSTER_CATALOG mirrors the 6 SSOT clusters in order', () => {
    expect(CLUSTER_CATALOG.map((c) => c.id)).toEqual(
      [...CLUSTERS].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => c.id)
    );
  });

  it('CLUSTER_CATALOG service counts match SSOT', () => {
    for (const cluster of CLUSTERS) {
      const ssotCount = getServicesByCluster(cluster.id).length;
      const adapterCount = CLUSTER_CATALOG.find((c) => c.id === cluster.id)?.services.length ?? 0;
      expect(adapterCount, `mismatch for ${cluster.id}`).toBe(ssotCount);
    }
  });
});
