/**
 * useRoomTypes — hotel room types (Phase 2 / Part 5B).
 *
 * The `room_types` / `room_type_rate_seasons` tables are created by
 * supabase/migrations/20260630120000_hotel_room_types.sql, applied via Lovable
 * Cloud (then `types.ts` regenerated). Until that lands these queries hit a
 * table that does not exist yet — the `error` branch returns []/empty, so the
 * hotel guest flow gracefully falls back to the Phase-1 whole-property booking.
 * Once the migration is applied the same code lights up with real rows, no edit
 * required. (`'table' as never` mirrors the project idiom for not-yet-typed
 * tables — see useRelocationArticles.ts / useFinancialPlanning.ts.)
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoomTypeBed {
  type: string;
  count: number;
}

export interface RoomType {
  id: string;
  property_id: string;
  owner_id: string;
  name_en: string;
  name_ru: string | null;
  description_en: string | null;
  description_ru: string | null;
  max_occupancy: number;
  bed_config: RoomTypeBed[];
  amenities: string[];
  images: string[];
  base_price_per_night: number | null;
  currency: string | null;
  total_units: number;
  refundable: boolean | null;
  sort_order: number | null;
  is_bookable: boolean;
  is_active: boolean;
}

/** Per-room-type seasonal rate (mirror of property_rate_seasons). */
export interface RoomTypeRateSeason {
  id: string;
  room_type_id: string;
  name_en: string;
  name_ru: string | null;
  start_date: string;
  end_date: string;
  nightly_rate: number;
  weekly_rate: number | null;
  monthly_rate: number | null;
  min_stay_nights: number | null;
  weekly_discount: number | null;
  monthly_discount: number | null;
  early_booking_discount: number | null;
  early_booking_days: number | null;
  last_minute_discount: number | null;
  last_minute_days: number | null;
  currency: string | null;
  is_active: boolean;
}

const ROOM_TYPE_COLUMNS =
  'id, property_id, owner_id, name_en, name_ru, description_en, description_ru, ' +
  'max_occupancy, bed_config, amenities, images, base_price_per_night, currency, ' +
  'total_units, refundable, sort_order, is_bookable, is_active';

const ROOM_TYPE_SEASON_COLUMNS =
  'id, room_type_id, name_en, name_ru, start_date, end_date, nightly_rate, weekly_rate, ' +
  'monthly_rate, min_stay_nights, weekly_discount, monthly_discount, early_booking_discount, ' +
  'early_booking_days, last_minute_discount, last_minute_days, currency, is_active';

/** Raw DB row before normalization (bed_config arrives as untyped jsonb). */
type RoomTypeRow = Omit<RoomType, 'bed_config' | 'amenities' | 'images'> & {
  bed_config: unknown;
  amenities: string[] | null;
  images: string[] | null;
};

function normalizeBedConfig(value: unknown): RoomTypeBed[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
    .map((b) => ({
      type: typeof b.type === 'string' ? b.type : '',
      count: typeof b.count === 'number' ? b.count : 1,
    }))
    .filter((b) => b.type);
}

function rowToRoomType(row: RoomTypeRow): RoomType {
  return {
    ...row,
    bed_config: normalizeBedConfig(row.bed_config),
    amenities: row.amenities ?? [],
    images: row.images ?? [],
  };
}

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

/** True when a property exposes bookable room types (i.e. show the room picker). */
export function hasBookableRoomTypes(roomTypes: RoomType[] | undefined): boolean {
  return !!roomTypes && roomTypes.some((r) => r.is_bookable && r.is_active);
}
