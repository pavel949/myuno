/**
 * Tests for area landings config.
 *
 * Contracts:
 *  - Every area in PHUKET_AREAS has a landing entry.
 *  - All cross-link slugs resolve to live persona / cluster pages.
 *  - Slugs are kebab-case ASCII.
 */
import { describe, it, expect } from 'vitest';
import {
  AREA_LANDINGS,
  LIVE_AREA_SLUGS,
  findAreaLandingBySlug,
} from '../areaLandings';
import { PHUKET_AREAS } from '@/lib/config/phuketAreas';
import { LIVE_PERSONA_SLUGS } from '../personaLandings';
import { LIVE_CLUSTER_SLUGS } from '../clusterLandings';

describe('AREA_LANDINGS', () => {
  it('has one entry per PHUKET_AREAS row', () => {
    expect(AREA_LANDINGS).toHaveLength(PHUKET_AREAS.length);
  });

  it('LIVE_AREA_SLUGS matches AREA_LANDINGS', () => {
    expect([...LIVE_AREA_SLUGS].sort()).toEqual(
      AREA_LANDINGS.map((l) => l.slug).sort(),
    );
  });

  it('uses kebab-case ASCII slugs', () => {
    for (const l of AREA_LANDINGS) {
      expect(l.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('cross-linked persona slugs are all live', () => {
    for (const l of AREA_LANDINGS) {
      for (const slug of l.relatedPersonaSlugs) {
        expect(LIVE_PERSONA_SLUGS).toContain(slug);
      }
    }
  });

  it('cross-linked cluster slugs are all live', () => {
    for (const l of AREA_LANDINGS) {
      for (const slug of l.relatedClusterSlugs) {
        expect(LIVE_CLUSTER_SLUGS).toContain(slug);
      }
    }
  });

  it('every area has at least one persona and one cluster cross-link', () => {
    for (const l of AREA_LANDINGS) {
      expect(l.relatedPersonaSlugs.length).toBeGreaterThan(0);
      expect(l.relatedClusterSlugs.length).toBeGreaterThan(0);
    }
  });

  it('SEO metaTitle ≤ 60 and metaDescription ≤ 160 characters', () => {
    for (const l of AREA_LANDINGS) {
      expect(l.seo.metaTitle.ru.length).toBeLessThanOrEqual(60);
      expect(l.seo.metaTitle.en.length).toBeLessThanOrEqual(60);
      expect(l.seo.metaDescription.ru.length).toBeLessThanOrEqual(160);
      expect(l.seo.metaDescription.en.length).toBeLessThanOrEqual(160);
    }
  });

  it('canonicalPath is /area/{slug} without trailing slash', () => {
    for (const l of AREA_LANDINGS) {
      expect(l.seo.canonicalPath).toBe(`/area/${l.slug}`);
    }
  });

  it('findAreaLandingBySlug returns undefined for unknown slug', () => {
    expect(findAreaLandingBySlug('does-not-exist')).toBeUndefined();
  });

  it('findAreaLandingBySlug returns the entry for known slugs', () => {
    expect(findAreaLandingBySlug('bang-tao')?.slug).toBe('bang-tao');
    expect(findAreaLandingBySlug('rawai')?.slug).toBe('rawai');
  });
});
