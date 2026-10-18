import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateManagementTerms, useUpdateManagementTerms } from '../usePropertyManagementTerms';
const state = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), forbidden: vi.fn(), result: {} as Record<string, unknown> }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'actor' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from(table: string) {
    expect(table).toBe('property_management_terms');
    const q = { insert(payload: Record<string, unknown>) { state.insert(payload); state.result = { ...payload, id: 'saved', property_id: payload.property_id }; return q; },
      update(payload: Record<string, unknown>) { state.update(payload); state.result = { ...payload, id: 'saved', property_id: 'property' }; return q; },
      eq: () => q, select: () => q, single: async () => ({ data: state.result, error: null }) };
    return q;
  }, rpc: state.forbidden, functions: { invoke: state.forbidden },
} }));
const clients: QueryClient[] = [];
function mount<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } }); clients.push(client);
  return renderHook(hook, { wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
beforeEach(() => {
  vi.clearAllMocks(); state.result = {};
  state.forbidden.mockImplementation(() => { throw Error('Unrelated writes forbidden'); });
  vi.stubGlobal('fetch', () => { throw Error('Network forbidden'); });
});
afterEach(() => { expect(state.forbidden).not.toHaveBeenCalled(); cleanup(); clients.splice(0).forEach(c => c.clear()); vi.unstubAllGlobals(); });
describe('canonical configuration payload persistence', () => {
  it('persists accounting and notification choices on the actual create hook without supplying financial defaults', async () => {
    const { result } = mount(() => useCreateManagementTerms());
    await act(async () => { await result.current.mutateAsync({ property_id: 'property', status: 'draft', accounting_policy: { payout_hold_days: 0 }, owner_notification_defaults: { monthly_report: false } }); });
    expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({
      property_id: 'property', manager_user_id: 'actor', commission_rate: null, commission_amount: null,
      revenue_split_owner: null, revenue_split_manager: null, payment_day: null, expense_responsibility: {},
      accounting_policy: { payout_hold_days: 0 }, owner_notification_defaults: { monthly_report: false },
    }));
  });
  it('keeps explicit zero and nullable policy on create', async () => {
    const { result } = mount(() => useCreateManagementTerms());
    await act(async () => { await result.current.mutateAsync({ property_id: 'property', status: 'draft', commission_rate: 0, accounting_policy: null }); });
    expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({ commission_rate: 0, accounting_policy: null }));
  });
  it('rejects incomplete activation before a canonical insert', async () => {
    const { result } = mount(() => useCreateManagementTerms());
    await act(async () => { await expect(result.current.mutateAsync({ property_id: 'property', status: 'active' })).rejects.toThrow(); });
    expect(state.insert).not.toHaveBeenCalled();
  });
  it('passes partial status updates to the database merged-row validation', async () => {
    const { result } = mount(() => useUpdateManagementTerms());
    await act(async () => { await result.current.mutateAsync({ id: 'saved', updates: { status: 'active' } }); });
    expect(state.update).toHaveBeenCalledWith({ status: 'active' });
  });
  it('preserves accounting choices and a cleared nullable field on update', async () => {
    const { result } = mount(() => useUpdateManagementTerms());
    await act(async () => { await result.current.mutateAsync({ id: 'saved', updates: { accounting_policy: { tax_withholding_percent: 0 }, payment_day: null } }); });
    expect(state.update).toHaveBeenCalledWith({ accounting_policy: { tax_withholding_percent: 0 }, payment_day: null });
  });
});

