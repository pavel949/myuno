import { describe, expect, it } from 'vitest';
import { sortOffplanProjects } from './filters';
import { filterByBudget } from './catalogFacets';
import type { OffplanProject } from '@/hooks/useOffplanProjects';
const project = (id: string, priceFrom: number | null) => ({ id, priceFrom }) as OffplanProject;
describe('newbuild price sorting never calls an unknown price free', () => {
  const list = [project('unknown', null), project('cheap', 4000000), project('invalid', NaN), project('expensive', 9000000)];
  it('puts unknown amounts last when sorting low to high', () => expect(sortOffplanProjects(list, 'price_asc').map(p => p.id)).toEqual(['cheap', 'expensive', 'unknown', 'invalid']));
  it('puts unknown amounts last when sorting high to low', () => expect(sortOffplanProjects(list, 'price_desc').map(p => p.id)).toEqual(['expensive', 'cheap', 'unknown', 'invalid']));
  it('does not broaden an unknown budget into every project', () => expect(filterByBudget(list, 'unexpected')).toEqual([]));
});
