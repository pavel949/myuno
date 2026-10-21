/**
 * Shared scorer tests — ranking tiers, role gating, and typo tolerance.
 */
import { describe, expect, it } from 'vitest';
import { scoreEntry, tokenize, norm, type ScorableEntry, type ScoreContext } from '../scoring';

const ctx: ScoreContext = { isAuthenticated: false, roles: [], personas: [] };
const authedOwner: ScoreContext = { isAuthenticated: true, roles: ['owner'], personas: [] };

const entry = (over: Partial<ScorableEntry> = {}): ScorableEntry => ({
  titleEn: 'Yacht Charter',
  titleRu: 'Аренда яхт',
  keywords: ['yacht', 'boat', 'чартер'],
  ...over,
});

const score = (e: ScorableEntry, q: string, c = ctx, fuzzy = false): number => {
  const qn = norm(q);
  return scoreEntry(e, qn, tokenize(qn), c, { fuzzy });
};

describe('scoreEntry', () => {
  it('ranks exact title above prefix above contains', () => {
    const exact = score(entry(), 'yacht charter');
    const prefix = score(entry(), 'yacht ch');
    const contains = score(entry(), 'charter');
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(contains);
  });

  it('matches Russian titles', () => {
    expect(score(entry(), 'аренда яхт')).toBeGreaterThan(0);
  });

  it('scores keyword token hits', () => {
    expect(score(entry(), 'boat')).toBeGreaterThan(0);
  });

  it('returns 0 for no match', () => {
    expect(score(entry(), 'pizza')).toBe(0);
  });

  it('hides role-gated entries from users without the role', () => {
    const gated = entry({ requiresRole: ['owner'] });
    expect(score(gated, 'yacht')).toBe(0);
    expect(score(gated, 'yacht', authedOwner)).toBeGreaterThan(0);
  });

  it('hides authenticated-only entries from guests', () => {
    const gated = entry({ requiresRole: ['authenticated'] });
    expect(score(gated, 'yacht')).toBe(0);
    expect(score(gated, 'yacht', authedOwner)).toBeGreaterThan(0);
  });

  it('applies persona and weight boosts', () => {
    const base = score(entry({ weight: 0 }), 'yacht');
    const boosted = score(entry({ weight: 5 }), 'yacht');
    expect(boosted).toBe(base + 5);
  });

  it('only matches typos when fuzzy is enabled', () => {
    expect(score(entry(), 'yachr')).toBe(0); // 1 edit from "yacht", not a substring
    expect(score(entry(), 'yachr', ctx, true)).toBeGreaterThan(0);
  });
});
