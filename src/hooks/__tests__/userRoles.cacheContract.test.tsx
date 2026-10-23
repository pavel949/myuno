import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserContext } from '../useUserContext';
import { useUserRoles } from '../useUserRoles';
const state = vi.hoisted(() => ({ user: { id: 'admin-a', user_metadata: {} } as { id: string; user_metadata: Record<string, unknown> } | null, roleError: null as Error | null, roleReads: [] as string[], adminRole: true }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  let selection = ''; let actor = '';
  const result = () => {
    if (table === 'user_roles') { state.roleReads.push(selection); return { data: state.roleError ? null : actor === 'admin-a' && state.adminRole ? [{ id: 'role-a', user_id: actor, role: 'admin', created_at: '2026-10-23' }] : [], error: state.roleError }; }
    if (table === 'user_active_context') return { data: { active_role: 'user', mode: 'user' }, error: null };
    return { data: [], error: null };
  };
  const chain = { select: (value: string) => { selection = value; return chain; }, eq: (column: string, value: string) => { if (column === 'user_id') actor = value; return chain; }, maybeSingle: async () => result(), then: (yes: (value: unknown) => unknown, no: (error: unknown) => unknown) => Promise.resolve(result()).then(yes, no) }; return chain;
} } }));
const clients: QueryClient[] = [];
function setup() { const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } }); clients.push(client); const wrapper = ({ children }: React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>; return { client, wrapper }; }
beforeEach(() => { state.user = { id: 'admin-a', user_metadata: {} }; state.roleError = null; state.roleReads = []; state.adminRole = true; });
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.length = 0; });
describe('canonical user-role cache contract', () => {
  it('keeps role rows when context resolves before the role consumer mounts', async () => {
    const { wrapper } = setup(); const context = renderHook(useUserContext, { wrapper }); await waitFor(() => expect(context.result.current.isLoading).toBe(false)); expect(context.result.current.availableRoles).toContain('admin');
    const roles = renderHook(useUserRoles, { wrapper }); await waitFor(() => expect(roles.result.current.isLoading).toBe(false)); expect(roles.result.current.roles?.[0]?.role).toBe('admin'); expect(roles.result.current.hasRole('admin')).toBe(true); expect(state.roleReads).toEqual(['*']);
  });
  it('keeps the same role-row contract when the role consumer resolves first', async () => {
    const { wrapper } = setup(); const roles = renderHook(useUserRoles, { wrapper }); await waitFor(() => expect(roles.result.current.isLoading).toBe(false));
    const context = renderHook(useUserContext, { wrapper }); await waitFor(() => expect(context.result.current.isLoading).toBe(false)); expect(context.result.current.availableRoles).toContain('admin'); expect(roles.result.current.roles?.[0]?.role).toBe('admin'); expect(state.roleReads).toEqual(['*']);
  });
  it('does not reuse the old unversioned string cache for an ordinary account', async () => {
    state.user = { id: 'ordinary', user_metadata: { role: 'super_admin' } }; const { wrapper, client } = setup(); client.setQueryData(['user-roles', 'ordinary'], ['admin']);
    const roles = renderHook(useUserRoles, { wrapper }); await waitFor(() => expect(roles.result.current.isLoading).toBe(false)); expect(roles.result.current.roles).toEqual([]); expect(roles.result.current.hasRole('admin')).toBe(false);
  });
  it('drops prior actor roles on account switch, logout and a later relogin', async () => {
    const { wrapper, client } = setup(); const roles = renderHook(useUserRoles, { wrapper }); await waitFor(() => expect(roles.result.current.hasRole('admin')).toBe(true));
    state.user = { id: 'ordinary', user_metadata: {} }; roles.rerender(); expect(roles.result.current.hasRole('admin')).toBe(false); await waitFor(() => expect(roles.result.current.roles).toEqual([]));
    state.user = null; roles.rerender(); expect(roles.result.current.hasRole('admin')).toBe(false);
    client.clear(); state.user = { id: 'admin-a', user_metadata: {} }; roles.rerender(); await waitFor(() => expect(roles.result.current.hasRole('admin')).toBe(true));
  });
  it('preserves existing prefix invalidation for both consumers after a server role change', async () => {
    const { wrapper, client } = setup(); const roles = renderHook(useUserRoles, { wrapper }); const context = renderHook(useUserContext, { wrapper });
    await waitFor(() => expect(roles.result.current.hasRole('admin')).toBe(true)); state.adminRole = false;
    await act(async () => { await client.invalidateQueries({ queryKey: ['user-roles', 'admin-a'] }); });
    await waitFor(() => expect(roles.result.current.hasRole('admin')).toBe(false)); expect(context.result.current.availableRoles).not.toContain('admin');
    expect(state.roleReads).toEqual(['*', '*']);
  });
  it('keeps a read failure distinct from a verified empty role list and can retry', async () => {
    state.roleError = new Error('synthetic role read unavailable'); const { wrapper } = setup(); const roles = renderHook(useUserRoles, { wrapper }); await waitFor(() => expect(roles.result.current.isLoading).toBe(false));
    expect(roles.result.current).toHaveProperty('error', state.roleError); expect(roles.result.current.hasRole('admin')).toBe(false);
    state.roleError = null; await act(async () => { await (roles.result.current as typeof roles.result.current & { refetch: () => Promise<unknown> }).refetch(); }); await waitFor(() => expect(roles.result.current.hasRole('admin')).toBe(true));
  });
});
