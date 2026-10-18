import { describe, it, expect } from 'vitest';
import { GOAL_ENTRIES, GOAL_ORDER } from '../goalEntries';
import { propertySearchHref, readPropertySearchQuery } from '@/lib/propertySearchQuery';
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
  it('keeps the actual Homes for sale tile in buy mode through the browse redirect', () => {
    const tile = GOAL_ENTRIES.buy.primary.find(link => link.en === 'Homes for sale');
    expect(tile).toBeDefined();
    const entry = new URL(tile!.path, 'https://myuno.app');
    expect(entry.pathname).toBe(APP_ROUTES.PROPERTY_BROWSE);
    // The mounted browse alias delegates to this same canonical URL helper.
    const destination = new URL(propertySearchHref(entry.search), entry.origin);
    expect(destination.pathname).toBe(APP_ROUTES.PROPERTY_SEARCH);
    expect(destination.searchParams.get('mode')).toBe('buy');
    expect(readPropertySearchQuery(destination.searchParams).mode).toBe('buy');
  });
});
