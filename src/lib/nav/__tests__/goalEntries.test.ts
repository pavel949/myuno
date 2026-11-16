import { describe, it, expect } from 'vitest';
import { GOAL_ENTRIES, GOAL_ORDER } from '../goalEntries';
import { readPropertySearchQuery } from '@/lib/propertySearchQuery';
import { APP_ROUTES } from '@/lib/config/routes';
import { isKnownRoute } from '../routeRegistry';

describe('goalEntries — every link points at a registered route', () => {
  for (const id of GOAL_ORDER) {
    it(`${id} links are known routes`, () => {
      const e = GOAL_ENTRIES[id];
      const bad = [e.path, ...e.primary.map((l) => l.path), ...e.more.map((l) => l.path)].filter(
        (p) => !isKnownRoute(p),
      );
      expect(bad).toEqual([]);
    });
  }
});

describe('buyer goal catalogue intent', () => {
  it('opens the direct sale catalogue in buy mode', () => {
    const tile = GOAL_ENTRIES.buy.primary.find(link => link.en === 'Direct sale listings');
    expect(tile).toBeDefined();
    const entry = new URL(tile!.path, 'https://myuno.app');
    expect(entry.pathname).toBe(APP_ROUTES.PROPERTY_SEARCH);
    expect(readPropertySearchQuery(entry.searchParams).mode).toBe('buy');
  });
});

it('offers distinct existing resale and newbuild markets before the full sale catalogue', () => {
  expect(GOAL_ENTRIES.buy.primary.slice(0, 2).map(link => link.path)).toEqual([APP_ROUTES.RESALE, APP_ROUTES.OFFPLAN]);
  expect(GOAL_ENTRIES.buy.primary.find(link => link.path === APP_ROUTES.RESALE)?.ru).toBe('Вторичная недвижимость');
});
