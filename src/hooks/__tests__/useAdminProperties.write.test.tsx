import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminProperties } from '../useAdminContent';
const state = vi.hoisted(() => ({
  user: { id: 'synthetic-admin' }, writes: [] as unknown[], filters: [] as unknown[][], response: {} as Record<string, unknown>,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  let writing = false;
  const query = {
    select: () => query,
    order: async () => ({ data: [], error: null }),
    eq: (...args: unknown[]) => { state.filters.push(args); return query; },
    is: (...args: unknown[]) => { if (writing) state.filters.push(['is', ...args]); return query; },
    insert: (value: unknown) => { writing = true; state.writes.push(value); return query; },
    update: (value: unknown) => { writing = true; state.writes.push(value); return query; },
    single: async () => state.response,
  };
  return query;
} } }));
beforeEach(() => { state.writes = []; state.filters = []; state.response = { data: { id: 'property', approval_status: 'approved', is_active: true }, error: null }; });

async function mount() {
  const hook = renderHook(() => useAdminProperties());
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}
describe('admin property writes', () => {
  it('preserves explicitly inactive draft creation', async () => {
    const { result } = await mount();
    await act(async () => { await result.current.createProperty({ approval_status: 'draft', is_active: false }); });
    expect(state.writes).toEqual([{ approval_status: 'draft', is_active: false }]);
  });
  it('saves only the reviewed property revision and checks the returned status', async () => {
    const { result } = await mount();
    await act(async () => {
      const response = await result.current.updateProperty('property', { approval_status: 'approved', is_active: true }, '2026-10-19T00:00:00Z');
      expect(response.error).toBeNull();
    });
    expect(state.filters).toEqual([['id', 'property'], ['updated_at', '2026-10-19T00:00:00Z'], ['is', 'deleted_at', null]]);
    expect(state.writes).toHaveLength(1);
  });
  it('fails before mutation when no reviewed revision is available', async () => {
    const { result } = await mount();
    const response = await result.current.updateProperty('property', { approval_status: 'approved' });
    expect(response.error).toBeInstanceOf(Error);
    expect(state.writes).toEqual([]);
  });
  it.each([
    { data: null, error: { message: 'stale revision' } },
    { data: null, error: null },
    { data: { id: 'wrong', approval_status: 'approved', is_active: true }, error: null },
    { data: { id: 'property', approval_status: 'pending', is_active: true }, error: null },
    { data: { id: 'property', approval_status: 'approved', is_active: false }, error: null },
  ])('does not claim a rejected or inconsistent row was saved: %o', async response => {
    state.response = response;
    const { result } = await mount();
    await act(async () => {
      const saved = await result.current.updateProperty('property', { approval_status: 'approved', is_active: true }, '2026-10-19T00:00:00Z');
      expect(saved.error).toBeTruthy();
    });
  });
});
