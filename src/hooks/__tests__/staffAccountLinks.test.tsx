import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSetStaffAccountLink, useStaffAccountSetup } from '../useStaffAccountLinks';
const state = vi.hoisted(() => ({
  user: { id: 'actor' } as { id: string } | null,
  company: { activeCompany: { company_id: 'company' } as { company_id: string } | null, isError: false },
  rpc: vi.fn(), forbidden: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => state.company }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: state.rpc, from: (...args: unknown[]) => state.forbidden(...args),
  functions: { invoke: (...args: unknown[]) => state.forbidden(...args) },
  auth: new Proxy({}, { get() { state.forbidden(); throw Error('Auth writes forbidden'); } }),
} }));
const clients: QueryClient[] = [];
function mount<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } }); clients.push(client);
  return { ...renderHook(hook, { wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> }), client };
}
const setup = { members: [{ id: 'membership-pk', user_id: 'auth-user', name: 'Person', email: null }], links: [] };
const link = { staff_member_id: 'directory-id', company_member_id: 'membership-pk', user_id: 'auth-user' };
beforeEach(() => {
  vi.clearAllMocks(); state.user = { id: 'actor' }; state.company.activeCompany = { company_id: 'company' }; state.company.isError = false;
  state.rpc.mockResolvedValue({ data: setup, error: null });
  state.forbidden.mockImplementation(() => { throw Error('Direct database and invitation writes forbidden'); });
  vi.stubGlobal('fetch', () => { state.forbidden(); throw Error('Network forbidden'); });
});
afterEach(() => { expect(state.forbidden).not.toHaveBeenCalled(); cleanup(); clients.splice(0).forEach(c => c.clear()); vi.unstubAllGlobals(); });
describe('real account link hooks through synthetic checked RPC only', () => {
  it('loads actor/company-keyed setup using only checked company RPC', async () => {
    const { result, client } = mount(() => useStaffAccountSetup(true));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.rpc).toHaveBeenCalledWith('get_staff_account_setup_checked', { p_company_id: 'company' });
    expect(client.getQueryData(['staff-account-setup', 'actor', 'company'])).toEqual(setup);
  });
  it('is disabled by default', () => { mount(() => useStaffAccountSetup()); expect(state.rpc).not.toHaveBeenCalled(); });
  it.each(['auth', 'company', 'company-error'])('suppresses setup and rejects mutation when %s is unavailable', async source => {
    if (source === 'auth') state.user = null;
    if (source === 'company') state.company.activeCompany = null;
    if (source === 'company-error') state.company.isError = true;
    mount(() => useStaffAccountSetup(true)); const { result } = mount(() => useSetStaffAccountLink());
    await act(async () => { await expect(result.current.mutateAsync({ staffId: 'directory-id', memberId: 'membership-pk' })).rejects.toThrow('Company unavailable'); });
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it.each([null, { members: null, links: [] }, { members: [], links: null }])('rejects malformed setup %j', async data => {
    state.rpc.mockResolvedValue({ data, error: null }); const { result } = mount(() => useStaffAccountSetup(true));
    await waitFor(() => expect(result.current.isError).toBe(true)); expect(result.current.error?.message).toBe('Account setup unavailable');
  });
  it.each([
    { members: [{ user_id: 'auth-user', name: 'Person', email: null }], links: [] },
    { members: [{ id: 'membership-pk', name: 'Person', email: null }], links: [] },
    { members: [{ id: 'membership-pk', user_id: 'auth-user', email: null }], links: [] },
    { members: [{ ...setup.members[0], email: 123 }], links: [] },
    { members: [setup.members[0], { ...setup.members[0], user_id: 'other-user' }], links: [] },
    { members: [setup.members[0], { ...setup.members[0], id: 'other-member' }], links: [] },
    { members: setup.members, links: [{ ...link, company_member_id: 'missing-member' }] },
    { members: setup.members, links: [{ ...link, user_id: 'different-auth-user' }] },
    { members: [setup.members[0], { ...setup.members[0], id: 'other-member', user_id: 'other-user' }], links: [link, { ...link, company_member_id: 'other-member', user_id: 'other-user' }] },
    { members: setup.members, links: [link, { ...link, staff_member_id: 'other-staff' }] },
  ])('rejects malformed, duplicated or inconsistent setup rows %j', async data => {
    state.rpc.mockResolvedValue({ data, error: null }); const { result } = mount(() => useStaffAccountSetup(true));
    await waitFor(() => expect(result.current.isError).toBe(true)); expect(result.current.data).toBeUndefined();
  });
  it('preserves RPC setup denial rather than returning successful empty data', async () => {
    state.rpc.mockResolvedValue({ data: null, error: Error('read denied') }); const { result } = mount(() => useStaffAccountSetup(true));
    await waitFor(() => expect(result.current.isError).toBe(true)); expect(result.current.data).toBeUndefined();
  });
  it('explicit link uses directory ID and membership PK and invalidates setup', async () => {
    state.rpc.mockResolvedValue({ data: link, error: null }); const { result, client } = mount(() => useSetStaffAccountLink());
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    expect(state.rpc).not.toHaveBeenCalled();
    await act(async () => { await result.current.mutateAsync({ staffId: 'directory-id', memberId: 'membership-pk' }); });
    expect(state.rpc).toHaveBeenCalledWith('set_staff_account_link_checked', { p_company_id: 'company', p_staff_member_id: 'directory-id', p_company_member_id: 'membership-pk' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['staff-account-setup'] });
  });
  it('unlink passes null membership without Auth, invitation or permission writer', async () => {
    state.rpc.mockResolvedValue({ data: { staff_member_id: 'directory-id', company_member_id: null, user_id: null }, error: null });
    const { result } = mount(() => useSetStaffAccountLink());
    await act(async () => { await result.current.mutateAsync({ staffId: 'directory-id', memberId: null }); });
    expect(state.rpc).toHaveBeenCalledWith('set_staff_account_link_checked', { p_company_id: 'company', p_staff_member_id: 'directory-id', p_company_member_id: null });
  });
  it.each([null, { ...link, staff_member_id: 'other-directory' }, { ...link, company_member_id: 'auth-user' }, { ...link, user_id: null }, { ...link, user_id: '' }])('rejects absent or mismatched confirmation %j', async data => {
    state.rpc.mockResolvedValue({ data, error: null }); const { result, client } = mount(() => useSetStaffAccountLink()); const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => { await expect(result.current.mutateAsync({ staffId: 'directory-id', memberId: 'membership-pk' })).rejects.toThrow('Account link not confirmed'); });
    expect(invalidate).not.toHaveBeenCalled();
  });
  it('propagates denied mutation without invalidating as success', async () => {
    state.rpc.mockResolvedValue({ data: null, error: Error('link denied') }); const { result, client } = mount(() => useSetStaffAccountLink()); const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => { await expect(result.current.mutateAsync({ staffId: 'directory-id', memberId: 'membership-pk' })).rejects.toThrow('link denied'); });
    expect(invalidate).not.toHaveBeenCalled();
  });
  it('rejects unlink confirmation that still exposes an Auth user', async () => {
    state.rpc.mockResolvedValue({ data: { staff_member_id: 'directory-id', company_member_id: null, user_id: 'auth-user' }, error: null });
    const { result, client } = mount(() => useSetStaffAccountLink()); const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => { await expect(result.current.mutateAsync({ staffId: 'directory-id', memberId: null })).rejects.toThrow('Account link not confirmed'); });
    expect(invalidate).not.toHaveBeenCalled();
  });

});
