// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveCompanyProvider, useActiveCompany } from './useActiveCompany';

const fixture = vi.hoisted(() => ({
  auth: { user: { id: 'synthetic-user' } as { id: string } | null, isLoading: false },
  lookup: vi.fn(), forbidden: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => fixture.auth }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from(table: string) {
      expect(table).toBe('management_company_members');
      const filters: Record<string, unknown> = {};
      const q = {
        select(columns: string) {
          expect(columns).toBe('company_id, role, management_companies!inner(name_en, name_ru, logo)');
          return q;
        },
        eq(key: string, value: unknown) { filters[key] = value; return q; },
        then(resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
          expect(filters).toEqual({ user_id: 'synthetic-user', is_active: true });
          return Promise.resolve(fixture.lookup()).then(resolve, reject);
        },
        insert: fixture.forbidden, update: fixture.forbidden, delete: fixture.forbidden,
      };
      return q;
    },
    rpc: fixture.forbidden,
  },
}));

const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return renderHook(() => useActiveCompany(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}><ActiveCompanyProvider>{children}</ActiveCompanyProvider></QueryClientProvider>
    ),
  });
}
beforeEach(() => {
  localStorage.clear();
  fixture.auth = { user: { id: 'synthetic-user' }, isLoading: false };
  fixture.lookup.mockReset().mockResolvedValue({ data: [], error: null });
  fixture.forbidden.mockReset().mockImplementation(() => { throw new Error('Writes forbidden'); });
  vi.stubGlobal('fetch', () => { throw new Error('Network forbidden'); });
});
afterEach(() => {
  expect(fixture.forbidden).not.toHaveBeenCalled();
  cleanup();
  clients.splice(0).forEach(client => client.clear());
  vi.unstubAllGlobals();
});

describe('active company membership states', () => {
  it('keeps authentication loading distinct from an empty company list without querying', () => {
    fixture.auth = { user: null, isLoading: true };
    const { result } = mount();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(fixture.lookup).not.toHaveBeenCalled();
  });
  it('settled anonymous context is not loading and does not query memberships', () => {
    fixture.auth = { user: null, isLoading: false };
    const { result } = mount();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeCompany).toBeNull();
    expect(fixture.lookup).not.toHaveBeenCalled();
  });
  it('reports pending memberships separately from a successful empty result', async () => {
    let resolve!: (value: { data: never[]; error: null }) => void;
    fixture.lookup.mockReturnValue(new Promise(done => { resolve = done; }));
    const { result } = mount();
    expect(result.current.isLoading).toBe(true);
    await act(async () => resolve({ data: [], error: null }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.companies).toEqual([]);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });
  it('exposes lookup denial and retry without treating failure as successful emptiness', async () => {
    const denied = new Error('Membership lookup denied');
    fixture.lookup.mockResolvedValueOnce({ data: null, error: denied });
    const { result } = mount();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(denied);
    expect(result.current.isLoading).toBe(false);
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.error).toBeNull();
    expect(fixture.lookup).toHaveBeenCalledTimes(2);
  });
  it('retains sorted company selection and successful data alongside a failed refresh', async () => {
    const row = (company_id: string, name_en: string) => ({ company_id, role: 'manager', management_companies: { name_en, name_ru: name_en, logo: null } });
    fixture.lookup.mockResolvedValueOnce({ data: [row('b', 'Zulu'), row('a', 'Alpha')], error: null });
    const { result } = mount();
    await waitFor(() => expect(result.current.activeCompany?.company_id).toBe('a'));
    expect(result.current.companies.map(c => c.company_id)).toEqual(['a', 'b']);
    const failure = new Error('Refresh unavailable');
    fixture.lookup.mockResolvedValueOnce({ data: null, error: failure });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(failure);
    expect(result.current.activeCompany?.company_id).toBe('a');
  });
});
