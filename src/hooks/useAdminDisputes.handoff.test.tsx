import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminDisputes } from './useDisputes';
const state = vi.hoisted(() => ({
  user: { id: 'admin-a' } as { id: string } | null, admin: true, checking: false, missing: false,
  options: [] as { enabled: boolean; queryKey: unknown[]; queryFn: () => Promise<unknown> }[],
  filters: [] as unknown[][],
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: state.admin, isLoading: state.checking }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: typeof state.options[number]) => {
  state.options.push(options); return { data: [{ id: 'cached' }], isError: false };
} }));
vi.mock('@/lib/untypedTables', () => ({ untypedTables: { disputes: () => {
  const query = { select: () => query, order: () => query, limit: () => query,
    eq: (column: string, value: string) => { state.filters.push([column, value]); return query; },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: state.missing ? null : [], error: null }).then(resolve),
  }; return query;
} } }));
beforeEach(() => { state.user = { id: 'admin-a' }; state.admin = true; state.checking = false; state.options = []; state.filters = []; state.missing = false; });
describe('exact dispute handoff', () => {
  it('queries the selected dispute independently of the recent list and scopes the cache by actor', async () => {
    renderHook(() => useAdminDisputes('selected-outside-recent-list'));
    await state.options[0].queryFn();
    expect(state.filters).toEqual([['id', 'selected-outside-recent-list']]);
    expect(state.options[0].queryKey).toEqual(['admin-disputes', 'admin-a', 'selected-outside-recent-list']);
  });
  it('does not turn an absent response into an empty dispute list', async () => {
    state.missing = true; renderHook(() => useAdminDisputes());
    await expect(state.options[0].queryFn()).rejects.toThrow('Dispute response unavailable');
  });
  it.each(['signed-out', 'staff', 'checking'])('disables reads and hides privileged cached disputes for %s', mode => {
    if (mode === 'signed-out') state.user = null;
    if (mode === 'staff') state.admin = false;
    if (mode === 'checking') state.checking = true;
    const { result } = renderHook(() => useAdminDisputes());
    expect(state.options[0].enabled).toBe(false); expect(result.current.data).toBeUndefined();
  });
});
