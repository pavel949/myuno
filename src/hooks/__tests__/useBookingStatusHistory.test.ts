/**
 * Unit tests for useBookingStatusHistory.
 *
 * Mocks the supabase client to:
 *  - return a fixed row set on the initial select
 *  - simulate a realtime INSERT and assert it is appended + highlighted
 *  - assert duplicate INSERTs are de-duped (no double rows, no double highlight)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

type RealtimeCb = (payload: { new: Record<string, unknown> }) => void;
const realtimeCallbacks: RealtimeCb[] = [];

const query = vi.hoisted(() => ({ table: '', columns: '', filter: [] as string[], realtimeFilter: '', failure: false }));

const initialRows = [
  {
    id: 'evt-1',
    booking_id: 'bk-1',
    from_status: null,
    to_status: 'pending',
    notes: null,
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 'evt-2',
    booking_id: 'bk-1',
    from_status: 'pending',
    to_status: 'confirmed',
    notes: null,
    created_at: '2026-04-01T11:00:00Z',
  },
];

vi.mock('@/integrations/supabase/client', () => {
  const channel = {
    on: vi.fn((_evt: string, _opts: unknown, cb: RealtimeCb) => {
      query.realtimeFilter = (_opts as {filter: string}).filter;
      realtimeCallbacks.push(cb);
      return channel;
    }),
    subscribe: vi.fn(() => channel),
  };

  return {
    supabase: {
      from: (table: string) => { query.table = table; return {
        select: (columns: string) => { query.columns = columns; return {
          eq: (column: string, id: string) => { query.filter = [column, id]; return {
            order: () => query.failure ? Promise.reject(new Error('History transport failed')) : Promise.resolve({ data: initialRows, error: null }),
          }; },
        }; },
      }; },
      channel: () => channel,
      removeChannel: vi.fn(),
    },
  };
});

import { useBookingStatusHistory } from '@/hooks/useBookingStatusHistory';

describe('useBookingStatusHistory', () => {
  beforeEach(() => {
    realtimeCallbacks.length = 0; query.failure = false;
  });

  it('loads initial rows in chronological order', async () => {
    const { result } = renderHook(() =>
      useBookingStatusHistory({ table: 'booking_status_history', bookingId: 'bk-1' }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.events.map((e) => e.id)).toEqual(['evt-1', 'evt-2']);
    expect(result.current.error).toBeNull();
  });

  it('appends a realtime INSERT and flashes a highlight', async () => {
    const { result } = renderHook(() =>
      useBookingStatusHistory({ table: 'booking_status_history', bookingId: 'bk-1' }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      realtimeCallbacks[0]({
        new: {
          id: 'evt-3',
          booking_id: 'bk-1',
          from_status: 'confirmed',
          to_status: 'completed',
          notes: null,
          created_at: '2026-04-01T12:00:00Z',
        },
      });
    });

    expect(result.current.events.map((e) => e.id)).toEqual(['evt-1', 'evt-2', 'evt-3']);
    expect(result.current.highlightIds.has('evt-3')).toBe(true);
  });

  it('drops duplicate realtime INSERTs (echo / replay)', async () => {
    const { result } = renderHook(() =>
      useBookingStatusHistory({ table: 'booking_status_history', bookingId: 'bk-1' }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Already in initial rows — should be ignored.
    act(() => {
      realtimeCallbacks[0]({ new: { ...initialRows[1] } });
    });
    expect(result.current.events).toHaveLength(2);
    expect(result.current.highlightIds.has('evt-2')).toBe(false);

    // New row arrives twice — appended once.
    act(() => {
      realtimeCallbacks[0]({
        new: {
          id: 'evt-3',
          booking_id: 'bk-1',
          from_status: 'confirmed',
          to_status: 'completed',
          notes: null,
          created_at: '2026-04-01T12:00:00Z',
        },
      });
    });
    act(() => {
      realtimeCallbacks[0]({
        new: {
          id: 'evt-3',
          booking_id: 'bk-1',
          from_status: 'confirmed',
          to_status: 'completed',
          notes: null,
          created_at: '2026-04-01T12:00:00Z',
        },
      });
    });
    expect(result.current.events.filter((e) => e.id === 'evt-3')).toHaveLength(1);
  });

  it('is a no-op when bookingId is missing', async () => {
    const { result } = renderHook(() =>
      useBookingStatusHistory({ table: 'booking_status_history', bookingId: undefined }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.events).toEqual([]);
  });
});

it('reads canonical order history and normalizes realtime reason without treating the order ID as a booking ID', async () => {
  const { result } = renderHook(() => useBookingStatusHistory({ table: 'order_status_history', bookingId: 'order-a' }));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(query.table).toBe('order_status_history');
  expect(query.columns).toContain('notes:reason');
  expect(query.filter).toEqual(['order_id', 'order-a']);
  expect(query.realtimeFilter).toBe('order_id=eq.order-a');
  act(() => realtimeCallbacks[0]({ new: { id: 'evt-3', order_id: 'order-a', to_status: 'checked_out', reason: 'Actual checkout', created_at: '2030-01-12T00:00:00Z' } }));
  expect(result.current.events.at(-1)?.notes).toBe('Actual checkout');
});
it('a rejected history read becomes an explicit error, not a permanent spinner', async () => {
  query.failure = true;
  const { result } = renderHook(() => useBookingStatusHistory({ table: 'order_status_history', bookingId: 'order-a' }));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.error?.message).toBe('History transport failed');
  expect(result.current.events).toEqual([]);
});
it('disabling a failed history clears its error and ignores late realtime events', async () => {
  query.failure = true;
  const { result, rerender } = renderHook(({ enabled }) => useBookingStatusHistory({ table: 'order_status_history', bookingId: 'order-a', enabled }), { initialProps: { enabled: true } });
  await waitFor(() => expect(result.current.error).not.toBeNull());
  rerender({ enabled: false });
  act(() => realtimeCallbacks[0]({ new: { id: 'late-event', to_status: 'confirmed', created_at: '2030-01-12T00:00:00Z' } }));
  expect(result.current.events).toEqual([]);
  expect(result.current.error).toBeNull();
});
