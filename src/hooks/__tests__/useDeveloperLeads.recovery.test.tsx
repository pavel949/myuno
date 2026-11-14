import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-actor' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const q = { select: () => q, eq: () => q, maybeSingle: sdk.read }; return q;
} } }));
import { useDeveloperLeads } from '../useNewbuildLeads';
const clients: QueryClient[] = [];
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client);
  return renderHook(useDeveloperLeads, { wrapper: ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
afterEach(() => { cleanup(); clients.splice(0).forEach(c => c.clear()); vi.clearAllMocks(); });
it('propagates a failed profile lookup instead of declaring no leads', async () => {
  sdk.read.mockResolvedValue({ data: null, error: { code: '42501' } });
  const { result } = show();
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.data).toBeUndefined();
});
it('retains successful no-profile semantics', async () => {
  sdk.read.mockResolvedValue({ data: null, error: null });
  const { result } = show();
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual([]);
});