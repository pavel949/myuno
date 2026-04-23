/**
 * Tests for CLUSTER_LANDINGS config (M6 · Track B.3).
 *
 * Контракт B.3 — все 10 кластеров присутствуют, slug'и уникальны,
 * clusterCode'ы покрывают A..J без дубликатов и пропусков, и **никто
 * не проходит `isLiveClusterLanding()`** на этапе B.3 (контент придёт в B.8).
 */
import { describe, it, expect } from 'vitest';
import {
  CLUSTER_LANDINGS,
  LIVE_CLUSTER_SLUGS,
} from '../clusterLandings';
import {
  isLiveClusterLanding,
  findClusterLandingBySlug,
  LANDING_CLUSTER_CODES,
} from '@/lib/landings/types';
import { PERSONA_CODES } from '@/types/canonical';

describe('CLUSTER_LANDINGS — coverage', () => {
  it('contains exactly 10 cluster landings', () => {
    expect(CLUSTER_LANDINGS).toHaveLength(10);
  });

  it('covers every LandingClusterCode A..J exactly once', () => {
    const codes = CLUSTER_LANDINGS.map((l) => l.clusterCode).sort();
    const expected = [...LANDING_CLUSTER_CODES].sort();
    expect(codes).toEqual(expected);
  });

  it('has unique slugs', () => {
    const slugs = CLUSTER_LANDINGS.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has kebab-case english slugs (no spaces, no uppercase)', () => {
    for (const l of CLUSTER_LANDINGS) {
      expect(l.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});

describe('CLUSTER_LANDINGS — B.3 stage status (all draft)', () => {
  it('all 10 landings have status="draft" at B.3 stage', () => {
    for (const l of CLUSTER_LANDINGS) {
      expect(l.status).toBe('draft');
    }
  });

  it('no landing passes isLiveClusterLanding() yet (content comes in B.8)', () => {
    for (const l of CLUSTER_LANDINGS) {
      expect(isLiveClusterLanding(l)).toBe(false);
    }
  });

  it('every draft landing has valid h1 + subtitle + primaryCta (no runtime crash if rendered)', () => {
    for (const l of CLUSTER_LANDINGS) {
      expect(l.h1.ru.length).toBeGreaterThan(0);
      expect(l.h1.en.length).toBeGreaterThan(0);
      expect(l.subtitle.ru.length).toBeGreaterThan(0);
      expect(l.subtitle.en.length).toBeGreaterThan(0);
      expect(l.primaryCta.label.ru.length).toBeGreaterThan(0);
      expect(l.primaryCta.label.en.length).toBeGreaterThan(0);
      expect(l.primaryCta.href).toMatch(/^[/#]/);
    }
  });
});

describe('CLUSTER_LANDINGS — relatedPersonas (matrix §6)', () => {
  it('every cluster has at least one relatedPersona', () => {
    for (const l of CLUSTER_LANDINGS) {
      expect(l.relatedPersonas.length).toBeGreaterThan(0);
    }
  });

  it('every relatedPersona is a valid canonical PersonaCode', () => {
    const valid = new Set<string>(PERSONA_CODES);
    for (const l of CLUSTER_LANDINGS) {
      for (const p of l.relatedPersonas) {
        expect(valid.has(p)).toBe(true);
      }
    }
  });

  it('relatedPersonas are unique within each cluster', () => {
    for (const l of CLUSTER_LANDINGS) {
      expect(new Set(l.relatedPersonas).size).toBe(l.relatedPersonas.length);
    }
  });
});

describe('LIVE_CLUSTER_SLUGS — contract for B.8', () => {
  it('lists exactly 3 slugs (A, D, F)', () => {
    expect(LIVE_CLUSTER_SLUGS).toHaveLength(3);
    expect(LIVE_CLUSTER_SLUGS).toEqual(['arrival', 'investment', 'operations']);
  });

  it('every LIVE_CLUSTER_SLUGS entry exists in CLUSTER_LANDINGS', () => {
    for (const slug of LIVE_CLUSTER_SLUGS) {
      const found = findClusterLandingBySlug(CLUSTER_LANDINGS, slug);
      expect(found).toBeDefined();
    }
  });

  it('LIVE slugs map to the expected canonical cluster codes', () => {
    expect(findClusterLandingBySlug(CLUSTER_LANDINGS, 'arrival')?.clusterCode).toBe('A');
    expect(findClusterLandingBySlug(CLUSTER_LANDINGS, 'investment')?.clusterCode).toBe('D');
    expect(findClusterLandingBySlug(CLUSTER_LANDINGS, 'operations')?.clusterCode).toBe('F');
  });
});

describe('findClusterLandingBySlug', () => {
  it('returns a known cluster', () => {
    const c = findClusterLandingBySlug(CLUSTER_LANDINGS, 'emergency');
    expect(c?.clusterCode).toBe('H');
  });

  it('returns undefined for unknown slug', () => {
    expect(findClusterLandingBySlug(CLUSTER_LANDINGS, 'unknown-slug')).toBeUndefined();
  });
});
