/**
 * roomTypeModel — pure types + normalization for hotel room types (Part 5B).
 *
 * Kept free of Supabase / react-query so it is unit-testable in isolation (same
 * split as strEligibility.ts). The data hooks in src/hooks/useRoomTypes.ts
 * consume these and re-export them for existing callers.
 */

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

/** Raw DB row before normalization (bed_config arrives as untyped jsonb). */
export type RoomTypeRow = Omit<RoomType, 'bed_config' | 'amenities' | 'images'> & {
  bed_config: unknown;
  amenities: string[] | null;
  images: string[] | null;
};

/**
 * Coerce the `bed_config` jsonb into a clean RoomTypeBed[]. Defensive against
 * nulls, non-arrays, and malformed entries (a hand-edited/legacy row must never
 * crash the guest render). Entries without a usable `type` are dropped; a
 * missing/invalid `count` defaults to 1.
 */
export function normalizeBedConfig(value: unknown): RoomTypeBed[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
    .map((b) => ({
      type: typeof b.type === 'string' ? b.type : '',
      count: typeof b.count === 'number' && b.count > 0 ? b.count : 1,
    }))
    .filter((b) => b.type);
}

export function rowToRoomType(row: RoomTypeRow): RoomType {
  return {
    ...row,
    bed_config: normalizeBedConfig(row.bed_config),
    amenities: row.amenities ?? [],
    images: row.images ?? [],
  };
}

/** True when a property exposes bookable room types (i.e. show the room picker). */
export function hasBookableRoomTypes(roomTypes: RoomType[] | undefined): boolean {
  return !!roomTypes && roomTypes.some((r) => r.is_bookable && r.is_active);
}
