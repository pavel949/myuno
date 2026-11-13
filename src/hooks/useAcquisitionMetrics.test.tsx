import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { summarizeAcquisition, useAcquisitionMetrics } from './useAcquisitionMetrics';

const state = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), gte: vi.fn(), lte: vi.fn(), range: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));
const row = { id: 'a', date: '2026-11-13', channel: 'search', impressions: 100, clicks: 15, leads: 3, signups: 2, conversions: 1 };
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: state.select, gte: state.gte, lte: state.lte, order: () => query, range: state.range };
  state.from.mockReturnValue(query); state.select.mockReturnValue(query); state.gte.mockReturnValue(query); state.lte.mockReturnValue(query);
  state.range.mockResolvedValue({ data: [row], error: null });
});
afterEach(cleanup);
it('sums recorded channel metrics, preserving null instead of inventing zero', () => {
  expect(summarizeAcquisition([row, { ...row, id: 'b', leads: null }])).toEqual([
    { channel: 'search', impressions: 200, clicks: 30, leads: null, signups: 4, conversions: 2 },
  ]);
  expect(summarizeAcquisition([{ ...row, clicks: 0 }])[0].clicks).toBe(0);
});
it('does not query until an actor is admitted', async () => {
  const { result } = renderHook(() => useAcquisitionMetrics(30, false, 'actor'), { wrapper });
  expect(result.current.fetchStatus).toBe('idle');
  expect(state.from).not.toHaveBeenCalled();
});
it('reads real metrics with narrow fields and inclusive seven-day bounds', async () => {
  const { result } = renderHook(() => useAcquisitionMetrics(7, true, 'admin'), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(state.from).toHaveBeenCalledWith('mcc_channel_metrics');
  expect(state.select).toHaveBeenCalledWith('id,date,channel,impressions,clicks,leads,signups,conversions');
  const start = state.gte.mock.calls[0][1] as string;
  const end = state.lte.mock.calls[0][1] as string;
  expect((Date.parse(end) - Date.parse(start)) / 86400000).toBe(6);
  expect(result.current.data?.channels[0].clicks).toBe(15);
});
it('reads every page instead of silently truncating totals', async () => {
  state.range.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, i) => ({ ...row, id: String(i) })), error: null })
    .mockResolvedValueOnce({ data: [row], error: null });
  const { result } = renderHook(() => useAcquisitionMetrics(30, true, 'admin'), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(state.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  expect(result.current.data?.channels[0].clicks).toBe(15015);
});
it('keeps an empty dataset distinct from recorded zero activity', async () => {
  state.range.mockResolvedValue({ data: [], error: null });
  const { result } = renderHook(() => useAcquisitionMetrics(30, true, 'admin'), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual({ channels: [], rowCount: 0, latestDate: null });
});
it('exposes read failure instead of a successful zero summary', async () => {
  state.range.mockResolvedValue({ data: null, error: { message: 'denied' } });
  const { result } = renderHook(() => useAcquisitionMetrics(30, true, 'admin'), { wrapper });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.data).toBeUndefined();
});
