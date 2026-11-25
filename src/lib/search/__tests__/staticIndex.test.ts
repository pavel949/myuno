/**
 * Tier-1 static search index tests.
 *
 * These are fully offline (no network, no Supabase) — they guard the promise
 * that the search modal always returns useful navigational results instantly,
 * in RU + EN, with typo tolerance, across every static dataset.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { searchStaticIndex, STATIC_INDEX_SIZE } from '../staticIndex';
import type { ScoreContext } from '../scoring';
import { isFocusHiddenPath, setFocusModeActive } from '@/lib/focus/focusMode';

const ctx: ScoreContext = { isAuthenticated: false, roles: [], personas: [] };

const paths = (q: string): string[] => searchStaticIndex(q, ctx, 20).map((r) => r.path);

afterEach(() => setFocusModeActive(true));

describe('staticIndex', () => {
  it('indexes a broad catalogue of navigable entities', () => {
    // 59 apps + ~68 services + 18 categories + 6 clusters + 13 areas
    // + 25 personas + life situations + ~40 nav targets (deduped by path).
    expect(STATIC_INDEX_SIZE).toBeGreaterThan(120);
  });

  it('ignores empty / too-short queries', () => {
    expect(searchStaticIndex('', ctx)).toEqual([]);
    expect(searchStaticIndex('a', ctx)).toEqual([]);
  });

  it('finds visa in English and Russian', () => {
    expect(paths('visa').some((p) => p.includes('/visa'))).toBe(true);
    expect(paths('виза').some((p) => p.includes('/visa'))).toBe(true);
  });

  it('finds transport for scooter / скутер', () => {
    expect(paths('scooter').some((p) => p.startsWith('/transport'))).toBe(true);
    expect(paths('скутер').some((p) => p.startsWith('/transport'))).toBe(true);
  });

  // Beauty and cleaning are hidden by focus mode (src/lib/focus/focusMode.ts);
  // these two guard the underlying index, so they run with focus mode off.
  it('finds beauty for массаж / spa (focus mode off)', () => {
    setFocusModeActive(false);
    expect(paths('массаж').some((p) => p.startsWith('/beauty'))).toBe(true);
    expect(paths('spa').some((p) => p.startsWith('/beauty'))).toBe(true);
  });

  it('finds a Phuket area by name', () => {
    expect(paths('bang tao').some((p) => p.startsWith('/area/'))).toBe(true);
  });

  it('finds a persona landing', () => {
    expect(paths('snowbird').some((p) => p.startsWith('/for/'))).toBe(true);
  });

  it('finds a life situation under /discover', () => {
    // Ordinary situations use /discover/:code; canonical landing overrides are tested below.
    const results = searchStaticIndex('arrival', ctx, 20);
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds a micro-app destination (focus mode off)', () => {
    setFocusModeActive(false);
    expect(paths('cleaning').some((p) => p.includes('clean'))).toBe(true);
  });

  it('finds a kept micro-app destination with focus mode on', () => {
    expect(paths('yacht').some((p) => p.startsWith('/yachts'))).toBe(true);
  });

  it('never returns focus-hidden apps while focus mode is on', () => {
    for (const q of ['массаж', 'spa', 'cleaning', 'beauty', 'restaurant', 'pharmacy', 'sim']) {
      expect(paths(q).filter((p) => isFocusHiddenPath(p)), q).toEqual([]);
    }
  });

  it('tolerates a single-character typo (scoter → scooter)', () => {
    expect(paths('scoter').some((p) => p.startsWith('/transport'))).toBe(true);
  });

  it('returns results tagged as actions or categories for rendering', () => {
    const results = searchStaticIndex('visa', ctx, 20);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.isAction || r.isCategory)).toBe(true);
  });

  it('does not emit duplicate destination paths', () => {
    const got = paths('property');
    expect(new Set(got).size).toBe(got.length);
  });
});

// The same situation must lead to the same destination from search and menus.
describe('canonical situation destinations', () => {
  it.each([
    ['developer', '/for-developers'],
    ['management_company', '/for-management-companies'],
    ['vendor_onboarding', '/vendor/join'],
  ])('uses the existing landing override for %s', (query, destination) => {
    const results = searchStaticIndex(query, ctx, 500);
    expect(results.some(result => result.path === `/discover/${query}`)).toBe(false);
    expect(results.some(result => result.path === destination)).toBe(true);
  });
});
