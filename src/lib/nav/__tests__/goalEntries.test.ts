import { describe, it, expect } from 'vitest';
import { GOAL_ENTRIES, GOAL_ORDER } from '../goalEntries';
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
