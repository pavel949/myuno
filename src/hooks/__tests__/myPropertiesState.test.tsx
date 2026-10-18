import { cleanup, renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useMyProperties } from '../useMyProperties';

const state = vi.hoisted(() => ({
  owned: { data: [], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  assigned: { properties: [], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  companyError: null as Error | null, lookup: vi.fn(), forbidden: vi.fn(),
}));
vi.mock('@/hooks/usePropertyCare', () => ({ useOwnerProperties: () => state.owned }));
vi.mock('@/hooks/useAssignedProperties', () => ({ useAssignedProperties: () => state.assigned }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ hasRole: () => false }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: 'synthetic-company' } }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from(table: string) {
    expect(table).toBe('properties');
    const q = {
      select: () => q,
      eq: (field: string, value: string) => { expect([field, value]).toEqual(['management_company_id', 'synthetic-company']); return q; },
      is: (field: string, value: null) => { expect([field, value]).toEqual(['deleted_at', null]); return q; },
      order: () => q,
      then(resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
        state.lookup(); return Promise.resolve({ data: [], error: state.companyError }).then(resolve, reject);
      },
      insert: state.forbidden, update: state.forbidden, delete: state.forbidden,
    }; return q;
  }, rpc: state.forbidden,
} }));
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } }); clients.push(client);
  return renderHook(() => useMyProperties(), { wrapper: ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
beforeEach(() => {
  vi.clearAllMocks(); state.owned.error = null; state.assigned.error = null; state.companyError = null;
  state.owned.isLoading = false; state.assigned.isLoading = false;
  state.forbidden.mockImplementation(() => { throw Error('Business writes forbidden'); });
  vi.stubGlobal('fetch', () => { throw Error('Network forbidden'); });
});
afterEach(() => { expect(state.forbidden).not.toHaveBeenCalled(); cleanup(); clients.splice(0).forEach(c => c.clear()); vi.unstubAllGlobals(); });

describe('portfolio source state aggregation with synthetic read results', () => {
  it('distinguishes successful empty reads from source failures', async () => {
    const { result } = mount(); await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.allProperties).toEqual([]); expect(result.current.error).toBeNull(); expect(result.current.isError).toBe(false);
  });
  it.each(['owned', 'assigned', 'company'] as const)('preserves %s denial even when the derived list is empty', async source => {
    const error = Error('Synthetic source denial');
    if (source === 'company') state.companyError = error; else state[source].error = error;
    const { result } = mount(); await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error); expect(result.current.allProperties).toEqual([]);
  });
  it('retry refreshes the underlying sources without changing scope or invoking writers', async () => {
    const { result } = mount(); await waitFor(() => expect(result.current.isLoading).toBe(false));
    const initialReads = state.lookup.mock.calls.length;
    await act(async () => { await result.current.refetch(); });
    expect(state.owned.refetch).toHaveBeenCalledOnce(); expect(state.assigned.refetch).toHaveBeenCalledOnce();
    expect(state.lookup.mock.calls.length).toBe(initialReads + 1);
  });
  it('preserves pending source state instead of claiming settled emptiness', async () => {
    state.assigned.isLoading = true;
    const { result } = mount(); await waitFor(() => expect(state.lookup).toHaveBeenCalled());
    expect(result.current.isLoading).toBe(true); expect(result.current.error).toBeNull();
  });
});
