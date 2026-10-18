import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

const fixture = vi.hoisted(() => ({
  user: '11111111-1111-4111-8111-111111111111',
  snapshot: {} as Record<string, unknown>, apply: true, deny: false, calls: [] as { name: string; args: Record<string, unknown> }[],
}));
const company = '22222222-2222-4222-8222-222222222222';
const space = '33333333-3333-4333-8333-333333333333';
const member = '44444444-4444-4444-8444-444444444444';
const property = '55555555-5555-4555-8555-555555555555';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.user ? { id: fixture.user } : null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => { throw Error('Direct DML forbidden'); },
  rpc: async (name: string, args: Record<string, unknown>) => {
    fixture.calls.push({ name, args });
    if (fixture.deny) return { data: null, error: { message: 'Synthetic denied' } };
    if (name === 'get_operating_space_setup') return { data: fixture.snapshot, error: null };
    if (fixture.apply) {
      if (name === 'save_operating_space_checked') fixture.snapshot.spaces = [{
        id: args.p_space_id ?? '33333333-3333-4333-8333-333333333333', key: args.p_key,
        name_en: args.p_name_en, name_ru: args.p_name_ru, is_active: args.p_is_active,
      }];
      if (name === 'set_operating_space_member_checked') fixture.snapshot.grants = [{
        operating_space_id: args.p_space_id, company_member_id: args.p_company_member_id, is_active: args.p_is_active,
      }];
      if (name === 'assign_operating_space_properties_checked') fixture.snapshot.assignments =
        (args.p_property_ids as string[]).map(property_id => ({ property_id, operating_space_id: args.p_space_id }));
    }
    return { data: name === 'save_operating_space_checked' ? args.p_space_id ?? '33333333-3333-4333-8333-333333333333' : null, error: null };
  },
} }));
import { useOperatingSpaceSetup, spaceSetupKey } from '../useOperatingSpaceSetup';
import { parseOperatingSpaceSetup } from '@/lib/operatingSpaceSetup';

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { ...renderHook(() => useOperatingSpaceSetup(company), { wrapper }), client };
}
beforeEach(() => {
  fixture.user = '11111111-1111-4111-8111-111111111111'; fixture.apply = true; fixture.deny = false; fixture.calls = [];
  fixture.snapshot = { can_manage: true, spaces: [], members: [], properties: [], assignments: [], grants: [] };
  vi.stubGlobal('fetch', () => { throw Error('Production network denied'); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const input = { key: 'synthetic', name_en: 'Synthetic space', name_ru: 'Тестовое пространство', is_active: true };
function populate() {
  fixture.snapshot.spaces = [{ id: space, ...input }];
  fixture.snapshot.members = [{ id: member, user_id: fixture.user, display_name: 'Synthetic account', role: 'manager', is_active: true }];
  fixture.snapshot.properties = [{ id: property, title_en: 'Synthetic property', title_ru: null, parent_property_id: null, room_category_id: null }];
}

describe('checked operating-space setup using isolated RPC adapter', () => {
  it('reads a genuinely empty company without mutating or inventing rows', async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.spaces).toEqual([]);
    expect(fixture.calls.every(call => call.name === 'get_operating_space_setup')).toBe(true);
  });
  it('does not query when signed out', () => {
    fixture.user = ''; mount(); expect(fixture.calls).toEqual([]);
  });
  it('confirms created empty space and invalidates only actor/company-bound setup and scope keys', async () => {
    const { result, client } = mount();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => { await result.current.change.mutateAsync({ type: 'save', space: input }); });
    expect(fixture.calls).toContainEqual({ name: 'save_operating_space_checked', args: {
      p_company_id: company, p_space_id: null, p_key: input.key,
      p_name_en: input.name_en, p_name_ru: input.name_ru, p_is_active: true,
    } });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: spaceSetupKey(fixture.user, company) });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['operational-scope-v1', fixture.user, company] });
    expect(invalidate).toHaveBeenCalledTimes(2);
  });
  it('rejects apparent save success with missing readback and does not invalidate success caches', async () => {
    fixture.apply = false;
    const { result, client } = mount();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => { await expect(result.current.change.mutateAsync({ type: 'save', space: input })).rejects.toThrow('not confirmed'); });
    expect(invalidate).not.toHaveBeenCalled();
  });
  it('requires persisted grant evidence using actual company member identity', async () => {
    populate();
    const { result } = mount();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => { await result.current.change.mutateAsync({ type: 'grant', spaceId: space, memberId: member, active: true }); });
    expect(fixture.calls).toContainEqual({ name: 'set_operating_space_member_checked', args: {
      p_company_id: company, p_space_id: space, p_company_member_id: member, p_is_active: true,
    } });
    fixture.apply = false; fixture.snapshot.grants = [];
    await act(async () => { await expect(result.current.change.mutateAsync({ type: 'grant', spaceId: space, memberId: member, active: true })).rejects.toThrow('not confirmed'); });
  });
  it('assigns only explicitly listed real IDs with a reason and confirms persisted rows', async () => {
    populate();
    const { result } = mount();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => { await result.current.change.mutateAsync({ type: 'assign', spaceId: space, propertyIds: [property], reason: 'Explicit synthetic move' }); });
    expect(fixture.calls).toContainEqual({ name: 'assign_operating_space_properties_checked', args: {
      p_company_id: company, p_space_id: space, p_property_ids: [property], p_reason: 'Explicit synthetic move',
    } });
    fixture.apply = false; fixture.snapshot.assignments = [];
    await act(async () => { await expect(result.current.change.mutateAsync({ type: 'assign', spaceId: space, propertyIds: [property], reason: 'Synthetic move' })).rejects.toThrow('not confirmed'); });
  });
  it('distinguishes denied RPC from a valid empty setup', async () => {
    fixture.deny = true;
    const { result } = mount();
    await waitFor(() => expect(result.current.error?.message).toBe('Synthetic denied'));
    expect(result.current.data).toBeUndefined();
  });
  it('rejects malformed or cross-linked snapshots instead of presenting permission or empty success', () => {
    expect(() => parseOperatingSpaceSetup({ ...fixture.snapshot, can_manage: false })).toThrow();
    expect(() => parseOperatingSpaceSetup({ ...fixture.snapshot, assignments: [{ property_id: property, operating_space_id: space }] })).toThrow();
  });
});

