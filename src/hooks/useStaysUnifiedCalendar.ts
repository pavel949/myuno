import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  getStaysChannelColor,
  normalizeStaysChannelKey,
  type StaysChannelKey,
} from '@/lib/staysCalendarChannelColors';

export interface UnifiedDayMeta {
  /** Distinct channel keys active on this night (for legend / stripes). */
  channelKeys: StaysChannelKey[];
  /** Show red ring + badge when > 0 (overlap or explicit DB conflict). */
  conflictBadgeCount: number;
}

export interface PropertyBookingRow {
  id: string;
  check_in: string;
  check_out: string;
  source: string | null;
  source_calendar_id: string | null;
  conflict_with_booking_id: string | null;
  status: string | null;
}

function nightsInterval(checkIn: string, checkOut: string): Date[] {
  const start = parseISO(checkIn.slice(0, 10));
  const endExclusive = parseISO(checkOut.slice(0, 10));
  if (start >= endExclusive) return [start];
  return eachDayOfInterval({ start, end: subDays(endExclusive, 1) });
}

function resolveChannelKey(
  booking: PropertyBookingRow,
  calendarChannelById: Map<string, string | null>,
): StaysChannelKey {
  if (booking.source_calendar_id) {
    const ch = calendarChannelById.get(booking.source_calendar_id);
    if (ch) return normalizeStaysChannelKey(ch);
  }
  if (booking.source) return normalizeStaysChannelKey(booking.source);
  return 'manual';
}

function buildUnifiedDayMeta(
  bookings: PropertyBookingRow[],
  calendarChannelById: Map<string, string | null>,
): Map<string, UnifiedDayMeta> {
  const byDay = new Map<
    string,
    { channels: Set<StaysChannelKey>; bookingIds: Set<string>; explicitConflict: boolean }
  >();

  for (const b of bookings) {
    const st = (b.status || '').toLowerCase();
    if (st === 'cancelled' || st === 'canceled' || st === 'refunded' || st === 'expired') continue;

    const nights = nightsInterval(b.check_in, b.check_out);
    const ch = resolveChannelKey(b, calendarChannelById);
    const explicit = Boolean(b.conflict_with_booking_id);

    for (const d of nights) {
      const key = format(d, 'yyyy-MM-dd');
      let slot = byDay.get(key);
      if (!slot) {
        slot = { channels: new Set(), bookingIds: new Set(), explicitConflict: false };
        byDay.set(key, slot);
      }
      slot.channels.add(ch);
      slot.bookingIds.add(b.id);
      if (explicit) slot.explicitConflict = true;
    }
  }

  const result = new Map<string, UnifiedDayMeta>();
  for (const [key, slot] of byDay) {
    const overlapCount = slot.bookingIds.size;
    const conflictBadgeCount =
      overlapCount > 1 || slot.explicitConflict ? overlapCount : 0;

    result.set(key, {
      channelKeys: Array.from(slot.channels),
      conflictBadgeCount,
    });
  }

  return result;
}

/**
 * Unified calendar hook — reads SSOT (orders vertical='property') + iCal-imported
 * legacy property_bookings (only those carrying source_calendar_id, since those
 * are still produced by the iCal importer until full migration to orders).
 */
export function useStaysUnifiedCalendar(propertyId: string | undefined) {
  const queryClient = useQueryClient();

  // Realtime: invalidate when orders or property_bookings change for this property
  useEffect(() => {
    if (!propertyId) return;

    const channel = supabase
      .channel(`stays-calendar-${propertyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: 'vertical=eq.property' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stays-unified-calendar', propertyId] });
          queryClient.invalidateQueries({ queryKey: ['property-unavailable-dates', propertyId] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'property_bookings', filter: `property_id=eq.${propertyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stays-unified-calendar', propertyId] });
          queryClient.invalidateQueries({ queryKey: ['property-unavailable-dates', propertyId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId, queryClient]);

  return useQuery({
    queryKey: ['stays-unified-calendar', propertyId],
    queryFn: async (): Promise<{
      unifiedDayMeta: Map<string, UnifiedDayMeta>;
      bookings: PropertyBookingRow[];
    }> => {
      if (!propertyId) {
        return { unifiedDayMeta: new Map(), bookings: [] };
      }

      const [ordersRes, icalBookingsRes, calsRes] = await Promise.all([
        // SSOT: orders table (vertical='property')
        supabase
          .from('orders')
          .select(`
            id, start_at, end_at, status, metadata,
            order_items!inner (resource_id, item_type, metadata)
          `)
          .eq('vertical', 'property')
          .eq('order_items.item_type', 'property')
          .eq('order_items.resource_id', propertyId)
          .is('deleted_at', null),
        // iCal-imported bookings (legacy table, still source for external channels)
        supabase
          .from('property_bookings')
          .select(
            'id, check_in, check_out, source, source_calendar_id, conflict_with_booking_id, status',
          )
          .eq('property_id', propertyId)
          .not('source_calendar_id', 'is', null),
        supabase
          .from('property_external_calendars')
          .select('id, channel_type')
          .eq('property_id', propertyId),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (icalBookingsRes.error) throw icalBookingsRes.error;
      if (calsRes.error) throw calsRes.error;

      // Normalize orders → PropertyBookingRow shape
      const orderBookings: PropertyBookingRow[] = (ordersRes.data ?? []).map((o) => {
        const meta = (o.metadata && typeof o.metadata === 'object' ? o.metadata : {}) as Record<string, unknown>;
        return {
          id: o.id,
          check_in: (o.start_at || '').slice(0, 10),
          check_out: (o.end_at || '').slice(0, 10),
          source: (meta.source as string) || 'manual',
          source_calendar_id: null,
          conflict_with_booking_id: null,
          status: o.status,
        };
      }).filter((b) => b.check_in && b.check_out);

      const icalBookings = (icalBookingsRes.data ?? []) as PropertyBookingRow[];
      const bookings = [...orderBookings, ...icalBookings];

      const calendarChannelById = new Map<string, string | null>();
      for (const c of calsRes.data ?? []) {
        calendarChannelById.set(c.id, c.channel_type);
      }

      const unifiedDayMeta = buildUnifiedDayMeta(bookings, calendarChannelById);
      return { unifiedDayMeta, bookings };
    },
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

export { getStaysChannelColor };
