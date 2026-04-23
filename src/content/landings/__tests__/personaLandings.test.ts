/**
 * Tests for PERSONA_LANDINGS config (M6 · Track B.2).
 *
 * Контракт B.2 — все 25 персон присутствуют, slug'и уникальны,
 * personaCode'ы покрывают P1..P25 без дубликатов и пропусков, и **никто
 * не проходит `isLivePersonaLanding()`** на этапе B.2 (контент придёт в B.7).
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
  it('contains exactly 25 persona landings', () => {
    expect(PERSONA_LANDINGS).toHaveLength(25);
  });

  it('covers every canonical PersonaCode P1..P25 exactly once', () => {
    const codes = PERSONA_LANDINGS.map((l) => l.personaCode).sort();
    const expected = [...PERSONA_CODES].sort();
    expect(codes).toEqual(expected);
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

describe('PERSONA_LANDINGS — B.2 stage status (all draft)', () => {
  it('all 25 landings have status="draft" at B.2 stage', () => {
    for (const l of PERSONA_LANDINGS) {
      expect(l.status).toBe('draft');
    }
  });

  it('no landing passes isLivePersonaLanding() yet (content comes in B.7)', () => {
    for (const l of PERSONA_LANDINGS) {
      expect(isLivePersonaLanding(l)).toBe(false);
    }
  });

  it('every draft landing has a valid h1 + subtitle + primaryCta (no runtime crash if rendered)', () => {
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

describe('LIVE_PERSONA_SLUGS — contract for B.7', () => {
  it('lists exactly 3 slugs (P1, P9, P13)', () => {
    expect(LIVE_PERSONA_SLUGS).toHaveLength(3);
    expect(LIVE_PERSONA_SLUGS).toEqual(['tourists', 'hnw', 'pet-owners']);
  });

  it('every LIVE_PERSONA_SLUGS entry exists in PERSONA_LANDINGS', () => {
    for (const slug of LIVE_PERSONA_SLUGS) {
      const found = findPersonaLandingBySlug(PERSONA_LANDINGS, slug);
      expect(found).toBeDefined();
    }
  });

  it('LIVE slugs map to the expected canonical persona codes', () => {
    expect(findPersonaLandingBySlug(PERSONA_LANDINGS, 'tourists')?.personaCode).toBe('P1');
    expect(findPersonaLandingBySlug(PERSONA_LANDINGS, 'hnw')?.personaCode).toBe('P9');
    expect(findPersonaLandingBySlug(PERSONA_LANDINGS, 'pet-owners')?.personaCode).toBe('P13');
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
