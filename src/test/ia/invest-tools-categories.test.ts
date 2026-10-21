/**
 * Regression guard: InvestmentToolsHub must never show its empty-state
 * with the current seed `TOOLS` array. Every filter category (except 'all')
 * must have at least one tool, otherwise switching to that filter renders
 * the "пусто" state on a production page.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE = resolve(__dirname, '../../pages/invest/InvestmentToolsHub.tsx');

describe('InvestmentToolsHub seed coverage', () => {
  const source = readFileSync(FILE, 'utf8');

  // Extract the literal category values from the TOOLS array entries.
  const categories = Array.from(source.matchAll(/category:\s*'([a-z]+)'/g)).map(
    (m) => m[1],
  );

  // The filter ribbon exposes these ids (mirrors `TOOL_CATEGORIES`).
  const filterIds = ['rating', 'calc', 'advisory', 'dd'] as const;

  it('declares at least one tool', () => {
    expect(categories.length).toBeGreaterThan(0);
  });

  it.each(filterIds)('filter "%s" matches at least one seeded tool', (id) => {
    expect(categories).toContain(id);
  });
});
