import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useConsultationRequests } from './useConsultationRequests';
import { useUniversalLead } from './useUniversalLead';
const fixture = vi.hoisted(() => ({ user: null as null | { id: string }, rpc: vi.fn(), invoke: vi.fn(), row: null as null | { id: string }, readError: false, readThrows: false, success: vi.fn(), error: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.user }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('sonner', () => ({ toast: { success: fixture.success, error: fixture.error } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: fixture.rpc, functions: { invoke: fixture.invoke }, from: (table: string) => {
    if (table !== 'consultation_requests') throw new Error('Forbidden fixture table');
    const query = { select: () => query, eq: () => query, order: async () => ({ data: [], error: null }), maybeSingle: async () => {
      if (fixture.readThrows) throw new Error('Synthetic transport read failure');
      return { data: fixture.row, error: fixture.readError ? new Error('Synthetic private read failure') : null };
    } }; return query;
  },
} }));
const clients: QueryClient[] = [];
function wrapper({ children }: { children: ReactNode }) { const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); clients.push(client); return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
beforeEach(() => { vi.clearAllMocks(); fixture.user = null; fixture.row = null; fixture.readError = false; fixture.readThrows = false; fixture.rpc.mockResolvedValue({ data: 'synthetic-receipt', error: null }); fixture.invoke.mockResolvedValue({ data: null, error: null }); });
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.length = 0; });
const input = { request_type: 'full_management', name: 'Synthetic owner', phone: '+66000000000' };
it.each([null, '', '   ', 42])('rejects an unconfirmed consultation receipt %s without success acknowledgement', async data => {
  fixture.rpc.mockResolvedValue({ data, error: null }); const { result } = renderHook(useConsultationRequests, { wrapper });
  await act(async () => { await expect(result.current.requestFullManagement.mutateAsync(input)).rejects.toThrow('receipt was not confirmed'); });
  expect(fixture.success).not.toHaveBeenCalled(); expect(fixture.rpc).toHaveBeenCalledOnce();
});
it('accepts the guest receipt without pretending private row details were read', async () => {
  const { result } = renderHook(useConsultationRequests, { wrapper });
  await act(async () => { expect(await result.current.createConsultation.mutateAsync(input)).toMatchObject({ id: 'synthetic-receipt', readbackStatus: 'not-requested' }); });
  expect(fixture.rpc).toHaveBeenCalledOnce();
});
it.each(['error', 'throw', 'missing', 'mismatch'])('preserves accepted receipt on optional readback %s, without creating another request', async mode => {
  fixture.user = { id: 'synthetic-owner' }; fixture.readError = mode === 'error'; fixture.readThrows = mode === 'throw'; fixture.row = mode === 'mismatch' ? { id: 'other-receipt' } : null;
  const { result } = renderHook(useConsultationRequests, { wrapper });
  await act(async () => { expect(await result.current.requestFullManagement.mutateAsync(input)).toMatchObject({ id: 'synthetic-receipt', readbackStatus: 'unavailable' }); });
  expect(fixture.rpc).toHaveBeenCalledOnce(); expect(fixture.success).toHaveBeenCalledOnce(); expect(fixture.error).not.toHaveBeenCalled();
});
it('returns verified readback only for the acknowledged record', async () => {
  fixture.user = { id: 'synthetic-owner' }; fixture.row = { id: 'synthetic-receipt' };
  const { result } = renderHook(useConsultationRequests, { wrapper });
  await act(async () => { expect(await result.current.createConsultation.mutateAsync(input)).toMatchObject({ id: 'synthetic-receipt', readbackStatus: 'loaded' }); });
});
it.each([null, '', '  ', 7])('does not report owner marketing lead saved with invalid receipt %s', async data => {
  fixture.rpc.mockResolvedValue({ data, error: null }); const { result } = renderHook(useUniversalLead, { wrapper });
  await act(async () => { await expect(result.current.submitLead.mutateAsync({ ...input, vertical_id: 'properties', lead_source: 'website' as never, entry_point: 'synthetic-owner' })).rejects.toThrow('receipt was not confirmed'); });
  expect(fixture.success).not.toHaveBeenCalled(); expect(fixture.invoke).not.toHaveBeenCalled();
});
it('acknowledges the owner marketing receipt without claiming notification delivery', async () => {
  const { result } = renderHook(useUniversalLead, { wrapper });
  await act(async () => { expect(await result.current.submitLead.mutateAsync({ ...input, vertical_id: 'properties', lead_source: 'website' as never, entry_point: 'synthetic-owner' })).toEqual({ id: 'synthetic-receipt' }); });
  expect(fixture.rpc).toHaveBeenCalledOnce();
});
