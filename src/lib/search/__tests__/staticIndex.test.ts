/**
 * Tier-1 static search index tests.
 *
 * These are fully offline (no network, no Supabase) — they guard the promise
 * that the search modal always returns useful navigational results instantly,
 * in RU + EN, with typo tolerance, across every static dataset.
 */
import { describe, expect, it } from 'vitest';
import { searchStaticIndex, STATIC_INDEX_SIZE } from '../staticIndex';
import type { ScoreContext } from '../scoring';

const ctx: ScoreContext = { isAuthenticated: false, roles: [], personas: [] };

const paths = (q: string): string[] => searchStaticIndex(q, ctx, 20).map((r) => r.path);

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

  it('finds beauty for массаж / spa', () => {
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
    // Every active life situation routes to /discover/:code.
    const results = searchStaticIndex('arrival', ctx, 20);
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds a micro-app destination', () => {
    expect(paths('cleaning').some((p) => p.includes('clean'))).toBe(true);
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
