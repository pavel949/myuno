/**
 * useRoomTypeAvailability — per-room-type live inventory (Phase 2b / Part 5B).
 *
 * Backed by `room_type_availability` + `check_room_type_availability()` from
 * 20260701090000_room_type_availability.sql (apply via Lovable Cloud, then
 * regenerate types.ts). Dormant-safe: reads return [] and the availability
 * check DEFAULTS TO AVAILABLE on any pre-migration error, so the request-to-book
 * flow is never blocked by a missing table (`'table' as never` idiom).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoomTypeAvailabilityDay {
  id: string;
  room_type_id: string;
  owner_id: string;
  date: string;
  units_available: number;
  price_override: number | null;
  is_blocked: boolean;
  note: string | null;
}

const AVAILABILITY_COLUMNS =
  'id, room_type_id, owner_id, date, units_available, price_override, is_blocked, note';

/** Availability rows for a room type (owner calendar / guest date-shading). [] until live. */
export function useRoomTypeAvailability(
  roomTypeId: string | undefined,
): UseQueryResult<RoomTypeAvailabilityDay[]> {
  return useQuery({
    queryKey: ['room-type-availability', roomTypeId],
    enabled: !!roomTypeId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RoomTypeAvailabilityDay[]> => {
      const { data, error } = await supabase
        .from('room_type_availability' as never)
        .select(AVAILABILITY_COLUMNS)
        .eq('room_type_id', roomTypeId as string)
        .order('date', { ascending: true });

      if (error || !data) return [];
      return data as unknown as RoomTypeAvailabilityDay[];
    },
  });
}

/**
 * Server-authoritative availability check for a room type over [checkIn, checkOut).
 * Returns true (available) on any error — including the pre-migration missing-RPC
 * case — so a request-to-book is never spuriously blocked. Once the RPC is live it
 * returns its real verdict.
 */
export async function checkRoomTypeAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  units = 1,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_room_type_availability' as never, {
      p_room_type_id: roomTypeId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_units: units,
    } as never);
    if (error) return true; // fail-open pre-migration / on transient error
    return data === false ? false : true;
  } catch {
    return true;
  }
}
