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
      realtimeCallbacks.push(cb);
      return channel;
    }),
    subscribe: vi.fn(() => channel),
  };

  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: initialRows, error: null }),
          }),
        }),
      }),
      channel: () => channel,
      removeChannel: vi.fn(),
    },
  };
});

import { useBookingStatusHistory } from '@/hooks/useBookingStatusHistory';

describe('useBookingStatusHistory', () => {
  beforeEach(() => {
    realtimeCallbacks.length = 0;
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
