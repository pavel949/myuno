import { beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ results: [] as { data: unknown[] | null; error: Error | null }[], filters: [] as unknown[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const response = fixture.results.shift();
  const chain = {
    select: () => chain,
    eq: (field: string, value: string) => { fixture.filters.push([table, field, value]); return chain; },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(response)),
  };
  return chain;
} } }));
import { getAccessiblePropertyIds } from '../getAccessiblePropertyIds';
beforeEach(() => { fixture.results = []; fixture.filters = []; });
describe('accessible-property query completeness', () => {
  it.each([0, 1, 2])('rejects failed source %s instead of exposing an incomplete portfolio', async failure => {
    fixture.results = [0, 1, 2].map(i => ({ data: i === failure ? null : [{ id: 'home', property_id: 'home' }], error: i === failure ? new Error('Scope unavailable') : null }));
    await expect(getAccessiblePropertyIds({ userId: 'actor', activeCompanyId: 'company' })).rejects.toThrow('Scope unavailable');
  });
  it('deduplicates successful reads and preserves explicit company filters', async () => {
    fixture.results = [{ data: [{ id: 'a' }], error: null }, { data: [{ property_id: 'a' }, { property_id: 'b' }], error: null }, { data: [{ id: 'b' }, { id: 'c' }], error: null }];
    expect((await getAccessiblePropertyIds({ userId: 'actor', activeCompanyId: 'company' })).allIds).toEqual(['a', 'b', 'c']);
    expect(fixture.filters).toContainEqual(['property_delegates', 'properties.management_company_id', 'company']);
  });
});
