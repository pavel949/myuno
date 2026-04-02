import { useQuery } from '@tanstack/react-query';
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
    if (st === 'cancelled' || st === 'canceled') continue;

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

export function useStaysUnifiedCalendar(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['stays-unified-calendar', propertyId],
    queryFn: async (): Promise<{
      unifiedDayMeta: Map<string, UnifiedDayMeta>;
      bookings: PropertyBookingRow[];
    }> => {
      if (!propertyId) {
        return { unifiedDayMeta: new Map(), bookings: [] };
      }

      const [bookingsRes, calsRes] = await Promise.all([
        supabase
          .from('property_bookings')
          .select(
            'id, check_in, check_out, source, source_calendar_id, conflict_with_booking_id, status',
          )
          .eq('property_id', propertyId),
        supabase
          .from('property_external_calendars')
          .select('id, channel_type')
          .eq('property_id', propertyId),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (calsRes.error) throw calsRes.error;

      const bookings = (bookingsRes.data ?? []) as PropertyBookingRow[];
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
