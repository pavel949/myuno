import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProperties } from '../useProperties';
import { districtFilterAliases } from '@/lib/taxonomies';
const calls = vi.hoisted(() => [] as Array<{ method: string; args: unknown[] }>);
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => options, useInfiniteQuery: (options: unknown) => options }));
vi.mock('@/integrations/supabase/client', () => {
  const query: Record<string, unknown> = {};
  for (const method of ['from', 'select', 'eq', 'order', 'limit', 'in', 'or', 'gte']) query[method] = (...args: unknown[]) => { calls.push({ method, args }); return query; };
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve);
  return { supabase: query };
});
beforeEach(() => { calls.length = 0; });
describe('public district query compatibility', () => {
  it.each(['bang-tao', 'Bang Tao', 'bang_tao'])('matches live legacy Bang Tao rows from %s without a data migration', async district => {
    const query = useProperties({ district, listingType: 'rent' }) as unknown as { queryFn: () => Promise<unknown> };
    await query.queryFn();
    const filter = calls.find(call => call.method === 'in' && call.args[0] === 'district');
    expect(filter?.args[1]).toEqual(expect.arrayContaining(['bang-tao', 'Bang Tao', 'Bangtao', 'bang_tao']));
    expect(calls).toContainEqual({ method: 'eq', args: ['is_active', true] });
    expect(calls).toContainEqual({ method: 'eq', args: ['approval_status', 'approved'] });
  });
  it('supports multiple districts without widening to unrelated locations', () => {
    expect(districtFilterAliases('nai-yang')).toContain('Nai Yang');
    expect(districtFilterAliases('bang-tao')).not.toContain('Nai Yang');
    expect(districtFilterAliases('')).toEqual([]);
  });
  it('preserves unknown district input as an exact value, without wildcard SQL', () => {
    expect(districtFilterAliases('new-district')).toEqual(['new-district']);
  });
});
