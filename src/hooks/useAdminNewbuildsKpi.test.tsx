import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { useAdminNewbuildsKpi } from './useAdminNewbuildsKpi';
const state = vi.hoisted(() => ({ response: { count: 0, error: null } as { count: number | null; error: Error | null } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const query = { select: () => query, eq: () => query, lte: () => query, gte: () => query, then: (resolve: (value: unknown) => void) => Promise.resolve(state.response).then(resolve) };
  return query;
} } }));
beforeEach(() => { state.response = { count: 0, error: null }; });
function wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>; }
it.each([{ count: null, error: new Error('denied') }, { count: null, error: null }])('keeps failed/missing counts unknown: %o', async response => {
  state.response = response;
  const { result } = renderHook(useAdminNewbuildsKpi, { wrapper });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.data).toBeUndefined();
});
it('preserves an explicitly confirmed zero count', async () => {
  const { result } = renderHook(useAdminNewbuildsKpi, { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.totalProjects).toBe(0);
});
