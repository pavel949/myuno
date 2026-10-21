/**
 * useBookingStatusHistory — fetch + realtime status history for a single booking.
 *
 * Works against any of the *_status_history tables that share the
 * (id, booking_id, from_status, to_status, notes, created_at) shape:
 *   - 'booking_status_history'           — public.bookings (services + transactional)
 *   - 'property_booking_status_history'  — public.property_bookings (stays)
 *   - 'order_status_history'             — orders; order_id/reason normalized below
 *
 * Used by user, partner (vendor), and staff (MC/admin) booking surfaces so the
 * same canonical timeline is rendered everywhere.
 */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BookingStatusEvent } from '@/components/bookings/BookingStatusTimeline';

export type BookingHistoryTable =
  | 'booking_status_history'
  | 'property_booking_status_history'
  | 'order_status_history';

interface Options {
  table: BookingHistoryTable;
  bookingId: string | undefined | null;
  /** Disable network/realtime (e.g. before auth resolves). Defaults to true. */
  enabled?: boolean;
}

interface Result {
  events: BookingStatusEvent[];
  isLoading: boolean;
  error: Error | null;
  /** IDs that just arrived via realtime — used to flash highlight. */
  highlightIds: Set<string>;
}

export function useBookingStatusHistory({
  table,
  bookingId,
  enabled = true,
}: Options): Result {
  const [events, setEvents] = useState<BookingStatusEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  // Per-mount dedup so realtime echoes never duplicate rows already seen.
  const seenRef = useRef<Set<string>>(new Set());
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const isOrder = table === 'order_status_history';
  const idColumn = isOrder ? 'order_id' : 'booking_id';

  // Initial fetch.
  useEffect(() => {
    highlightTimersRef.current.forEach(clearTimeout);
    highlightTimersRef.current.clear();
    setHighlightIds(new Set());
    if (!enabled || !bookingId) {
      setEvents([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setEvents([]);
    setIsLoading(true);
    setError(null);
    seenRef.current = new Set();

    (async () => {
      // typed-from cast: the auto-generated types know each table individually,
      // but we pass the name dynamically here. Runtime is identical.
      const { data, error: err } = await (supabase as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              order: (col: string, opts: { ascending: boolean }) => Promise<{
                data: BookingStatusEvent[] | null;
                error: Error | null;
              }>;
            };
          };
        };
      })
        .from(table)
        .select(isOrder ? 'id, from_status, to_status, notes:reason, created_at' : 'id, from_status, to_status, notes, created_at')
        .eq(idColumn, bookingId)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (err) {
        setError(err);
        setEvents([]);
      } else {
        const rows = (data ?? []).map((r) => ({
          id: r.id,
          from_status: r.from_status,
          to_status: r.to_status,
          notes: r.notes,
          created_at: r.created_at,
        }));
        for (const r of rows) if (r.id) seenRef.current.add(r.id);
        setEvents(rows);
      }
      setIsLoading(false);
    })().catch((reason: unknown) => {
      if (cancelled) return;
      setError(reason instanceof Error ? reason : new Error('History unavailable'));
      setEvents([]);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [table, bookingId, enabled, isOrder, idColumn]);

  // Realtime subscription (filtered to this single booking_id).
  useEffect(() => {
    if (!enabled || !bookingId) return;

    let active = true;
    const channel = supabase
      .channel(`bk-history-${table}-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: `${idColumn}=eq.${bookingId}`,
        },
        (payload) => {
          if (!active) return;
          const row = payload.new as {
            id: string;
            from_status: string | null;
            to_status: string;
            notes: string | null;
            reason?: string | null;
            created_at: string;
          };
          if (seenRef.current.has(row.id)) return;
          seenRef.current.add(row.id);

          const event: BookingStatusEvent = {
            id: row.id,
            from_status: row.from_status,
            to_status: row.to_status,
            notes: isOrder ? row.reason : row.notes,
            created_at: row.created_at,
          };

          setEvents((prev) => {
            if (prev.some((e) => e.id === row.id)) return prev;
            return [...prev, event].sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
          });

          // Flash highlight for ~3s.
          setHighlightIds((prev) => {
            const next = new Set(prev);
            next.add(row.id);
            return next;
          });
          const t = setTimeout(() => {
            setHighlightIds((prev) => {
              if (!prev.has(row.id)) return prev;
              const next = new Set(prev);
              next.delete(row.id);
              return next;
            });
            highlightTimersRef.current.delete(row.id);
          }, 3000);
          highlightTimersRef.current.set(row.id, t);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [table, bookingId, enabled, idColumn, isOrder]);

  // Cleanup pending timers on unmount.
  useEffect(() => {
    const timers = highlightTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return { events, isLoading, error, highlightIds };
}
