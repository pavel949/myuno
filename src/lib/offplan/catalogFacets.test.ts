import { describe, it, expect } from 'vitest';
import { filterByBudget } from './catalogFacets';
import type { OffplanProject } from '@/hooks/useOffplanProjects';

const p = (id: string, priceFrom: number | null) => ({ id, priceFrom }) as OffplanProject;

describe('filterByBudget', () => {
  const list = [p('a', 4_900_000), p('b', 5_000_000), p('c', null), p('d', 25_000_000)];
  it('5–10M bucket includes exactly 5M and excludes 4.9M', () => {
    expect(filterByBudget(list, '5to10').map((x) => x.id)).toEqual(['b']);
  });
  it('unknown price never matches a budget', () => {
    expect(filterByBudget(list, 'lt5').map((x) => x.id)).toEqual(['a']);
  });
  it('no budget keeps all projects', () => {
    expect(filterByBudget(list, '')).toHaveLength(4);
  });
});
