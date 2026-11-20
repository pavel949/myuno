// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseCivilDate } from '@/lib/hotelDates';
import { usePropertyStayPreview } from '../usePropertyStayPreview';

const state = vi.hoisted(() => ({
  rpc: vi.fn(),
  readSeasons: vi.fn(),
  retrySeasons: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: state.rpc } }));
vi.mock('../usePropertyRateSeasons', () => ({ usePropertyRateSeasons: state.readSeasons }));

beforeEach(() => {
  vi.resetAllMocks();
  state.readSeasons.mockReturnValue({ data: [], isError: false, refetch: state.retrySeasons });
});
const rules = { pricePerNight: 1000 };
const begin = parseCivilDate('2027-12-01');
const end = parseCivilDate('2027-12-02');

describe('shared date-price lifecycle', () => {
  it('does not reuse a previous range while requesting a new one', async () => {
    let finish!: (data: unknown) => void;
    state.rpc.mockResolvedValueOnce({ data: [{ date: '2027-12-01', price_override: 1700 }], error: null })
      .mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const { result, rerender } = renderHook(({ to }) => usePropertyStayPreview('unit', begin, to, rules),
      { initialProps: { to: end } });
    await waitFor(() => expect(result.current.pricing.total).toBe(1700));
    rerender({ to: parseCivilDate('2027-12-03') });
    expect(result.current).toMatchObject({ ready: false, failed: false, loading: true });
    await act(async () => finish({ data: [], error: null }));
    expect(result.current).toMatchObject({ ready: true, loading: false, pricing: { total: 2000 } });
  });

  it('never substitutes the base price when the seasons or date read fails', async () => {
    state.readSeasons.mockReturnValue({ data: undefined, isError: true, refetch: state.retrySeasons });
    state.rpc.mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('synthetic date read failure') })
      .mockResolvedValueOnce({ data: [], error: null });
    const { result, rerender } = renderHook(() => usePropertyStayPreview('unit', begin, end, rules));
    expect(result.current).toMatchObject({ ready: false, failed: true });
    state.readSeasons.mockReturnValue({ data: [], isError: false, refetch: state.retrySeasons });
    act(() => result.current.retry());
    rerender();
    await waitFor(() => expect(result.current).toMatchObject({ ready: false, failed: true }));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current).toMatchObject({ ready: true, pricing: { total: 1000 } }));
  });
});
