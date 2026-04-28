/**
 * Tests for the SSOT cluster-catalog audience filter.
 * The drawer relies on these to keep workspace surfaces hidden from
 * consumers, so a regression here directly leaks UI to the wrong role.
 */
import { describe, it, expect } from 'vitest';
import {
  CLUSTER_CATALOG,
  filterCatalogForUser,
  isClusterVisibleToUser,
  getClusterById,
  getClusterHeaderLabel,
  getClusterServiceLocalizedLabel,
} from '../clusterCatalog';
import { CATEGORIES } from '@/lib/catalog';

describe('clusterCatalog — audience model invariants', () => {
  it('every cluster has a stable id and label pair; public clusters expose services', () => {
    for (const c of CLUSTER_CATALOG) {
      expect(c.id, `cluster ${c.id} missing id`).toBeTruthy();
      expect(c.labelEn).toBeTruthy();
      expect(c.labelRu).toBeTruthy();
      if (c.audience === 'public') {
        expect(c.services.length, `public cluster ${c.id} has no services`).toBeGreaterThan(0);
      }
    }
  });

  it('cluster ids are unique across the catalog', () => {
    const ids = CLUSTER_CATALOG.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every workspace cluster declares at least one persona OR role', () => {
    for (const c of CLUSTER_CATALOG.filter((x) => x.audience === 'workspace')) {
      const hasPersonas = (c.personas?.length ?? 0) > 0;
      const hasRoles = (c.roles?.length ?? 0) > 0;
      expect(
        hasPersonas || hasRoles,
        `workspace cluster ${c.id} has no audience targets`,
      ).toBe(true);
    }
  });
});

describe('isClusterVisibleToUser', () => {
  const publicCluster = getClusterById('arrive')!;
  const manageCluster = getClusterById('manage')!;
  const buildCluster = getClusterById('build')!;

  it('always shows public clusters regardless of context', () => {
    expect(isClusterVisibleToUser(publicCluster, {})).toBe(true);
    expect(isClusterVisibleToUser(publicCluster, { role: 'guest' })).toBe(true);
    expect(
      isClusterVisibleToUser(publicCluster, { personas: ['tourist'], role: 'guest' }),
    ).toBe(true);
  });

  it('hides workspace clusters from a bare guest with no personas', () => {
    expect(isClusterVisibleToUser(manageCluster, { role: 'guest' })).toBe(false);
  });

  it('shows the manage cluster to a property owner persona', () => {
    expect(
      isClusterVisibleToUser(manageCluster, { personas: ['property_owner'], role: 'guest' }),
    ).toBe(true);
  });

  it('shows the manage cluster when nav role is owner even without persona', () => {
    expect(isClusterVisibleToUser(manageCluster, { role: 'owner' })).toBe(true);
  });

  it('shows the build cluster as a public developer-facing catalog cluster', () => {
    expect(
      isClusterVisibleToUser(buildCluster, { personas: ['real_estate_developer'] }),
    ).toBe(true);
    expect(isClusterVisibleToUser(buildCluster, { role: 'admin' })).toBe(true);
    expect(isClusterVisibleToUser(buildCluster, { role: 'team' })).toBe(true);
    expect(isClusterVisibleToUser(buildCluster, { role: 'guest' })).toBe(true);
    expect(
      isClusterVisibleToUser(buildCluster, { personas: ['tourist'], role: 'guest' }),
    ).toBe(true);
  });
});

describe('filterCatalogForUser', () => {
  it('returns ONLY public clusters for an unauthenticated guest', () => {
    const visible = filterCatalogForUser({ role: 'guest' });
    expect(visible.every((c) => c.audience !== 'workspace')).toBe(true);
    expect(visible.some((c) => c.id === 'manage')).toBe(false);
    expect(visible.some((c) => c.id === 'build')).toBe(true);
  });

  it('exposes the manage cluster to a property owner', () => {
    const visible = filterCatalogForUser({
      personas: ['property_owner'],
      role: 'owner',
    });
    expect(visible.some((c) => c.id === 'manage')).toBe(true);
  });

  it('exposes the build cluster to a real-estate developer persona', () => {
    const visible = filterCatalogForUser({
      personas: ['real_estate_developer'],
      role: 'guest',
    });
    expect(visible.some((c) => c.id === 'build')).toBe(true);
    // …without leaking the manage cluster they don't own
    expect(visible.some((c) => c.id === 'manage')).toBe(false);
  });

  it('exposes BOTH workspace clusters to a platform admin', () => {
    const visible = filterCatalogForUser({ role: 'admin' });
    expect(visible.some((c) => c.id === 'manage')).toBe(true);
    expect(visible.some((c) => c.id === 'build')).toBe(true);
  });

  it('preserves the canonical cluster ordering from the SSOT', () => {
    const visible = filterCatalogForUser({ role: 'admin' });
    const visibleIds = visible.map((c) => c.id);
    const fullIds = CLUSTER_CATALOG.map((c) => c.id);
    // visible order is a subsequence of canonical order
    let cursor = 0;
    for (const id of visibleIds) {
      cursor = fullIds.indexOf(id, cursor);
      expect(cursor, `cluster ${id} is out of canonical order`).toBeGreaterThanOrEqual(0);
      cursor += 1;
    }
  });
});

describe('getClusterHeaderLabel — catalog SSOT labels', () => {
  it('renders canonical cluster labels instead of drawer aliases', () => {
    expect(getClusterHeaderLabel(getClusterById('live')!, 'en')).toBe('Live');
    expect(getClusterHeaderLabel(getClusterById('live')!, 'ru')).toBe('Жизнь');
    expect(getClusterHeaderLabel(getClusterById('invest')!, 'en')).toBe('Invest');
    expect(getClusterHeaderLabel(getClusterById('legal')!, 'en')).toBe('Legal & Visa');
  });
});

describe('getClusterServiceLocalizedLabel — query-string disambiguation', () => {
  // Regression for 2026-04-26: the All Services drawer collapsed every
  // sub-route in `cat-home-living` and `cat-tourism` to a single label
  // because route labels could fall back from the catalog SSOT to umbrella
  // app entries. We assert per-category label uniqueness in both languages.

  function labelsFor(categoryId: string, lang: 'en' | 'ru'): string[] {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) throw new Error(`category ${categoryId} not found in SSOT`);
    return cat.services.map((s) =>
      getClusterServiceLocalizedLabel(
        {
          labelEn: s.labelEn,
          labelRu: s.labelRu,
          labelTh: s.labelTh,
          icon: s.icon,
          path: s.path,
          status: s.status,
        },
        lang,
      ),
    );
  }

  it('Home & Living renders 12 distinct EN labels (no "Home services" duplication)', () => {
    const labels = labelsFor('cat-home-living', 'en');
    expect(labels.length).toBeGreaterThanOrEqual(10);
    expect(new Set(labels).size, `dup labels: ${labels.join(' | ')}`).toBe(labels.length);
    expect(labels).toContain('Services hub');
    expect(labels).toContain('Laundry');
    expect(labels).not.toContain('Home services');
  });

  it('Home & Living renders distinct RU labels', () => {
    const labels = labelsFor('cat-home-living', 'ru');
    expect(new Set(labels).size, `dup labels: ${labels.join(' | ')}`).toBe(labels.length);
    expect(labels).toContain('Все услуги');
    expect(labels).toContain('Прачечная');
    expect(labels).not.toContain('Услуги для дома');
  });

  it('Tourism & Activities renders distinct EN labels (no "Experiences" duplication)', () => {
    const labels = labelsFor('cat-tourism', 'en');
    expect(new Set(labels).size, `dup labels: ${labels.join(' | ')}`).toBe(labels.length);
    expect(labels).toContain('Experiences');
    expect(labels).toContain('Tours');
    expect(labels).toContain('Water & activities');
  });

  it('Tourism & Activities renders distinct RU labels', () => {
    const labels = labelsFor('cat-tourism', 'ru');
    expect(new Set(labels).size, `dup labels: ${labels.join(' | ')}`).toBe(labels.length);
    expect(labels).toContain('Впечатления');
    expect(labels).toContain('Туры');
    expect(labels).toContain('Вода и активности');
  });

  it('plain umbrella route /services keeps its catalog SSOT label', () => {
    const cat = CATEGORIES.find((c) => c.id === 'cat-home-logistics')!;
    const umbrella = cat.services.find((s) => s.path === '/services');
    expect(umbrella, '/services umbrella entry missing from SSOT').toBeTruthy();
    const label = getClusterServiceLocalizedLabel(
      {
        labelEn: umbrella!.labelEn,
        labelRu: umbrella!.labelRu,
        icon: umbrella!.icon,
        path: umbrella!.path,
        status: umbrella!.status,
      },
      'en',
    );
    expect(label).toBe('Services hub');
  });
});

