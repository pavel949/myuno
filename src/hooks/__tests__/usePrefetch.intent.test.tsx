import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { StrictMode, type ReactNode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { usePrefetchRoute } from '../usePrefetch';

const from = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  from.mockReset();
});

it('keeps the app root and mounted router free of unsolicited route prefetch', () => {
  const source = (path: string) => readFileSync(resolve(path), 'utf8');
  expect(source('src/App.tsx')).not.toMatch(/PrefetchProvider|usePrefetchPopularData/);
  expect(source('src/components/layout/AnimatedRoutes.tsx')).not.toMatch(/prefetchRoutes\(|prefetchAllPopularRoutes\(/);
});

it('does not read on mount, but preserves the explicit restaurant route warmup', async () => {
  vi.useFakeTimers();
  const rows = [{ id: 'isolated-restaurant' }];
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn() };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockResolvedValue({ data: rows });
  from.mockReturnValue(query);

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    <StrictMode><QueryClientProvider client={client}>{children}</QueryClientProvider></StrictMode>;
  const { result } = renderHook(() => usePrefetchRoute(), { wrapper });
  try {
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(from).not.toHaveBeenCalled();
    await act(() => result.current.prefetchRoute('/unknown'));
    expect(from).not.toHaveBeenCalled();
    await act(() => result.current.prefetchRoute('/restaurants'));
    expect(from).toHaveBeenCalledExactlyOnceWith('listings');
    expect(query.eq).toHaveBeenCalledWith('vertical', 'restaurant');
    expect(client.getQueryData(['restaurants', {}])).toEqual(rows);
  } finally {
    client.clear();
  }
});
