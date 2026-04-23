/**
 * Tests for landing type guards (M6 · Track B.1).
 *
 * Не проверяем content конфигов (они появятся в B.2/B.3) — только
 * семантику guards и helper'ов.
 */
import { describe, it, expect } from 'vitest';
import {
  isLandingClusterCode,
  isLivePersonaLanding,
  isLiveClusterLanding,
  findPersonaLandingBySlug,
  findClusterLandingBySlug,
  LANDING_CLUSTER_CODES,
  type PersonaLanding,
  type ClusterLanding,
} from '../types';

const baseSeo = {
  metaTitle: { ru: 'T', en: 'T' },
  metaDescription: { ru: 'D', en: 'D' },
  ogImage: 'https://example.com/og.jpg',
  canonicalPath: '/for/x',
  hreflangAlternates: [
    { lang: 'ru' as const, href: 'https://myuno.app/for/x' },
    { lang: 'en' as const, href: 'https://myuno.app/en/for/x' },
  ],
};

const liveP: PersonaLanding = {
  personaCode: 'P1',
  slug: 'tourists',
  status: 'live',
  h1: { ru: 'H', en: 'H' },
  subtitle: { ru: 'S', en: 'S' },
  pains: [{ ru: 'p1', en: 'p1' }],
  services: [{ slug: 's', label: { ru: 'S', en: 'S' }, href: '/s' }],
  faq: [{ q: { ru: 'q', en: 'q' }, a: { ru: 'a', en: 'a' } }],
  primaryCta: { label: { ru: 'Начать', en: 'Start' }, href: '/start' },
  seo: baseSeo,
};

const liveC: ClusterLanding = {
  clusterCode: 'A',
  slug: 'arrival',
  status: 'live',
  h1: { ru: 'H', en: 'H' },
  subtitle: { ru: 'S', en: 'S' },
  jobs: [{ ru: 'j', en: 'j' }],
  services: [{ slug: 's', label: { ru: 'S', en: 'S' }, href: '/s' }],
  faq: [{ q: { ru: 'q', en: 'q' }, a: { ru: 'a', en: 'a' } }],
  primaryCta: { label: { ru: 'Начать', en: 'Start' }, href: '/start' },
  relatedPersonas: ['P1'],
  seo: baseSeo,
};

describe('LandingClusterCode', () => {
  it('contains exactly 10 codes A..J', () => {
    expect(LANDING_CLUSTER_CODES).toHaveLength(10);
    expect(LANDING_CLUSTER_CODES).toEqual(['A','B','C','D','E','F','G','H','I','J']);
  });

  it('isLandingClusterCode accepts A..J only', () => {
    expect(isLandingClusterCode('A')).toBe(true);
    expect(isLandingClusterCode('J')).toBe(true);
    expect(isLandingClusterCode('K')).toBe(false);
    expect(isLandingClusterCode('arrive')).toBe(false);
    expect(isLandingClusterCode(null)).toBe(false);
    expect(isLandingClusterCode(undefined)).toBe(false);
    expect(isLandingClusterCode('')).toBe(false);
  });
});

describe('isLivePersonaLanding', () => {
  it('returns true for fully populated live landing', () => {
    expect(isLivePersonaLanding(liveP)).toBe(true);
  });

  it('returns false for draft', () => {
    expect(isLivePersonaLanding({ ...liveP, status: 'draft' })).toBe(false);
  });

  it('returns false when seo missing', () => {
    expect(isLivePersonaLanding({ ...liveP, seo: undefined })).toBe(false);
  });

  it('returns false when pains/services/faq empty', () => {
    expect(isLivePersonaLanding({ ...liveP, pains: [] })).toBe(false);
    expect(isLivePersonaLanding({ ...liveP, services: [] })).toBe(false);
    expect(isLivePersonaLanding({ ...liveP, faq: [] })).toBe(false);
  });
});

describe('isLiveClusterLanding', () => {
  it('returns true for fully populated live cluster landing', () => {
    expect(isLiveClusterLanding(liveC)).toBe(true);
  });

  it('returns false for draft / missing seo / empty arrays', () => {
    expect(isLiveClusterLanding({ ...liveC, status: 'draft' })).toBe(false);
    expect(isLiveClusterLanding({ ...liveC, seo: undefined })).toBe(false);
    expect(isLiveClusterLanding({ ...liveC, jobs: [] })).toBe(false);
    expect(isLiveClusterLanding({ ...liveC, services: [] })).toBe(false);
    expect(isLiveClusterLanding({ ...liveC, faq: [] })).toBe(false);
  });
});

describe('findBySlug helpers', () => {
  it('returns the matching persona landing', () => {
    expect(findPersonaLandingBySlug([liveP], 'tourists')).toBe(liveP);
    expect(findPersonaLandingBySlug([liveP], 'unknown')).toBeUndefined();
  });

  it('returns the matching cluster landing', () => {
    expect(findClusterLandingBySlug([liveC], 'arrival')).toBe(liveC);
    expect(findClusterLandingBySlug([liveC], 'unknown')).toBeUndefined();
  });
});
