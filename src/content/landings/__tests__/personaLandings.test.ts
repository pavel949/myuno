/**
 * Tests for PERSONA_LANDINGS config.
 *
 * Original contract (M6 · B.2): 25 landings, all draft.
 * Updated contract (M10b · 2026-04-24): IPP investor personas (P5/P6/P8/P10/P11)
 * + developer partner door (P22) promoted to `live`. P22 has two slugs because
 * `01-segmentation-framework.md` (P22 = freelancers) conflicts with
 * `IPP.md §16` (P22 = developer-partner) — see `m10b-completion.md` §Open conflicts.
 */
import { describe, it, expect } from 'vitest';
import {
  PERSONA_LANDINGS,
  LIVE_PERSONA_SLUGS,
} from '../personaLandings';
import {
  isLivePersonaLanding,
  findPersonaLandingBySlug,
} from '@/lib/landings/types';
import { PERSONA_CODES } from '@/types/canonical';

describe('PERSONA_LANDINGS — coverage', () => {
  it('contains 26 persona landings (25 canonical + 1 P22 developer-partner alias)', () => {
    expect(PERSONA_LANDINGS).toHaveLength(26);
  });

  it('covers every canonical PersonaCode P1..P25 at least once', () => {
    const codes = new Set(PERSONA_LANDINGS.map((l) => l.personaCode));
    for (const expected of PERSONA_CODES) {
      expect(codes.has(expected)).toBe(true);
    }
  });

  it('has unique slugs', () => {
    const slugs = PERSONA_LANDINGS.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has kebab-case english slugs (no spaces, no uppercase)', () => {
    for (const l of PERSONA_LANDINGS) {
      expect(l.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});

describe('PERSONA_LANDINGS — Sprint 1–2 live promotions', () => {
  const expectedLive = [
    'tourists',
    'cn-investors',
    'eu-guests',
    'digital-nomads',
    'snowbirds',
    'ru-expats',
    'families',
    'passive-investors',
    'hnw',
    'operators',
    'mn-investors',
    'bn-business',
    'pet-owners',
    'medical',
    'weddings',
    'athletes',
    'halal',
    'lgbtq',
    'accessibility',
    'retirees',
    'providers',
    'freelancers',
    'developer-partner',
    'smb',
    'creatives',
    'students',
  ];

  it('has exactly the M10b live slug set', () => {
    const live = PERSONA_LANDINGS.filter((l) => l.status === 'live').map((l) => l.slug).sort();
    expect(live).toEqual([...expectedLive].sort());
  });

  it('every live landing passes isLivePersonaLanding()', () => {
    for (const slug of expectedLive) {
      const landing = findPersonaLandingBySlug(PERSONA_LANDINGS, slug);
      expect(landing).toBeDefined();
      expect(isLivePersonaLanding(landing!)).toBe(true);
    }
  });

  it('every draft landing has a valid h1 + subtitle + primaryCta', () => {
    for (const l of PERSONA_LANDINGS) {
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

describe('LIVE_PERSONA_SLUGS — M10b contract', () => {
  it('matches the live status set in PERSONA_LANDINGS', () => {
    const live = PERSONA_LANDINGS.filter((l) => l.status === 'live').map((l) => l.slug).sort();
    expect([...LIVE_PERSONA_SLUGS].sort()).toEqual(live);
  });

  it('every LIVE_PERSONA_SLUGS entry exists in PERSONA_LANDINGS', () => {
    for (const slug of LIVE_PERSONA_SLUGS) {
      const found = findPersonaLandingBySlug(PERSONA_LANDINGS, slug);
      expect(found).toBeDefined();
    }
  });
});

describe('findPersonaLandingBySlug', () => {
  it('returns a known persona', () => {
    const p = findPersonaLandingBySlug(PERSONA_LANDINGS, 'digital-nomads');
    expect(p?.personaCode).toBe('P4');
  });

  it('returns undefined for unknown slug', () => {
    expect(findPersonaLandingBySlug(PERSONA_LANDINGS, 'unknown-slug')).toBeUndefined();
  });
});
