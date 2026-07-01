/**
 * useRoomTypes — hotel room types data hooks (Phase 2 / Part 5B).
 *
 * The `room_types` / `room_type_rate_seasons` tables are created by
 * supabase/migrations/20260630120000_hotel_room_types.sql, applied via Lovable
 * Cloud (then `types.ts` regenerated). Until that lands these queries hit a
 * table that does not exist yet — the `error` branch returns []/empty, so the
 * hotel guest flow gracefully falls back to the Phase-1 whole-property booking.
 * Once the migration is applied the same code lights up with real rows, no edit
 * required. (`'table' as never` mirrors the project idiom for not-yet-typed
 * tables — see useRelocationArticles.ts / useFinancialPlanning.ts.)
 *
 * Pure types + normalization live in src/lib/real-estate/roomTypeModel.ts and
 * are re-exported here for existing callers.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  rowToRoomType,
  type RoomType,
  type RoomTypeRow,
  type RoomTypeRateSeason,
} from '@/lib/real-estate/roomTypeModel';

export type {
  RoomType,
  RoomTypeBed,
  RoomTypeRateSeason,
} from '@/lib/real-estate/roomTypeModel';
export { hasBookableRoomTypes } from '@/lib/real-estate/roomTypeModel';

const ROOM_TYPE_COLUMNS =
  'id, property_id, owner_id, name_en, name_ru, description_en, description_ru, ' +
  'max_occupancy, bed_config, amenities, images, base_price_per_night, currency, ' +
  'total_units, refundable, sort_order, is_bookable, is_active';

const ROOM_TYPE_SEASON_COLUMNS =
  'id, room_type_id, name_en, name_ru, start_date, end_date, nightly_rate, weekly_rate, ' +
  'monthly_rate, min_stay_nights, weekly_discount, monthly_discount, early_booking_discount, ' +
  'early_booking_days, last_minute_discount, last_minute_days, currency, is_active';

/**
 * Room types for a hotel property. Returns [] until the room_types table ships,
 * so callers should treat an empty result as "no room-level inventory — use the
 * whole-property flow".
 */
export function useRoomTypes(propertyId: string | undefined): UseQueryResult<RoomType[]> {
  return useQuery({
    queryKey: ['room-types', propertyId],
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RoomType[]> => {
      const { data, error } = await supabase
        .from('room_types' as never)
        .select(ROOM_TYPE_COLUMNS)
        .eq('property_id', propertyId as string)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // Pre-migration the table does not exist (error) — fall back to empty so
      // the guest flow uses whole-property booking.
      if (error || !data) return [];
      return (data as unknown as RoomTypeRow[]).map(rowToRoomType);
    },
  });
}

/**
 * Seasonal rates for a single room type. Feeds buildPricingRulesFromSeasons()/
 * calculatePricing() unchanged (same shape as property_rate_seasons). Returns []
 * until the table ships.
 */
export function useRoomTypeRateSeasons(
  roomTypeId: string | undefined,
): UseQueryResult<RoomTypeRateSeason[]> {
  return useQuery({
    queryKey: ['room-type-rate-seasons', roomTypeId],
    enabled: !!roomTypeId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RoomTypeRateSeason[]> => {
      const { data, error } = await supabase
        .from('room_type_rate_seasons' as never)
        .select(ROOM_TYPE_SEASON_COLUMNS)
        .eq('room_type_id', roomTypeId as string)
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error || !data) return [];
      return data as unknown as RoomTypeRateSeason[];
    },
  });
}
