import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAssignedProperties } from '../useAssignedProperties';
const state = vi.hoisted(() => ({ currency: null as string | null, queryFn: undefined as undefined | (() => Promise<unknown>), select: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'manager' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: ({ queryFn }: { queryFn: () => Promise<unknown> }) => { state.queryFn = queryFn; return { data: [], isLoading: false }; } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const builder = {
    select: (columns: string) => { state.select(table, columns); return builder; },
    eq: () => builder, in: () => builder, gte: () => builder,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'property_manager_assignments' ? [{ id: 'assignment', property_id: 'p1', properties: { currency: state.currency, deposit_currency: 'USD', price_per_night: 7000 } }] : [], error: null }).then(resolve),
  };
  return builder;
} } }));
beforeEach(() => { state.currency = null; state.select.mockClear(); });
describe('managed property currency projection', () => {
  it.each([null, 'THB', 'USD'])('keeps raw denomination %s without changing legacy defaults', async currency => {
    state.currency = currency;
    renderHook(() => useAssignedProperties());
    const rows = await state.queryFn!() as { record_currency: string | null; currency: string; price_per_night: number }[];
    expect(rows[0].record_currency).toBe(currency);
    expect(rows[0].currency).toBe(currency || 'THB');
    expect(rows[0].price_per_night).toBe(7000);
    const columns = state.select.mock.calls.find(([table]) => table === 'property_manager_assignments')?.[1];
    expect(columns).toMatch(/\bcurrency\b/);
  });
});
