import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminProviders, type ProviderQueryOptions } from './useAdmin';

const fixture = vi.hoisted(() => ({ actor: 'first' as string | null, calls: [] as string[][], writes: vi.fn(), fail: false }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.actor ? { id: fixture.actor } : null }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: true }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from(table: string) {
  const call = [table]; fixture.calls.push(call);
  const q = {
    select: () => q,
    order: (key: string) => { call.push(`order:${key}`); return q; },
    eq: (key: string, value: string) => { call.push(`${key}:${value}`); return q; },
    in: () => q, is: () => q,
    or: (value: string) => { call.push(`or:${value}`); return q; },
    range: (from: number, to: number) => { call.push(`range:${from}:${to}`); return q; },
    insert: fixture.writes, update: fixture.writes, delete: fixture.writes,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [{ id: `provider-${fixture.actor}` }], count: 1, error: fixture.fail ? new Error('Denied') : null }).then(resolve),
  }; return q;
} } }));
const clients: QueryClient[] = [];
function mount(options?: ProviderQueryOptions) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client);
  return renderHook(() => useAdminProviders(options), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
beforeEach(() => { fixture.actor = 'first'; fixture.calls = []; fixture.fail = false; fixture.writes.mockClear(); });
afterEach(() => { clients.forEach(client => client.clear()); clients.length = 0; expect(fixture.writes).not.toHaveBeenCalled(); });
describe('reconciled provider readers', () => {
  it('retains actor-bound legacy service-editor reads and clears cached rows when the actor changes', async () => {
    const { result, rerender } = mount();
    await waitFor(() => expect(result.current.providers[0]?.id).toBe('provider-first'));
    fixture.actor = null; rerender();
    expect(result.current.providers).toEqual([]);
    expect(fixture.calls).toHaveLength(1);
    fixture.actor = 'second'; rerender();
    await waitFor(() => expect(result.current.providers[0]?.id).toBe('provider-second'));
  });
  it('keeps queue filters before stable pagination for the current admin surface', async () => {
    const { result } = mount({ actorId: 'first', enabled: true, filter: 'unverified', search: 'Test', page: 2 });
    await waitFor(() => expect(result.current.totalCount).toBe(1));
    expect(fixture.calls[0]).toContain('is_verified:false');
    expect(fixture.calls[0]).toContain('order:id');
    expect(fixture.calls[0].at(-1)).toBe('range:100:149');
  });
  it('keeps exact editor lookup independent of queue filters and never turns read errors into an empty success', async () => {
    fixture.fail = true;
    const { result } = mount({ actorId: 'first', enabled: true, filter: 'unverified', search: 'other', page: 3, editId: 'exact-provider' });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.totalCount).toBeNull();
    expect(fixture.calls[0]).toContain('id:exact-provider');
    expect(fixture.calls[0].some(value => value.startsWith('range:'))).toBe(false);
  });
});
