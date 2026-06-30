/**
 * useRoomTypes — hotel room types (Phase 2 / Part 5B).
 *
 * The `room_types` / `room_type_rate_seasons` tables are created by
 * supabase/migrations/20260630120000_hotel_room_types.sql, which must be applied
 * via Lovable Cloud (then `types.ts` regenerated). Until that lands, these hooks
 * are intentionally INERT — they return empty so the hotel guest flow gracefully
 * falls back to the Phase-1 whole-property booking. Once the migration is applied
 * and types regenerated, replace the stub bodies with the real Supabase queries
 * (the shapes below already match the migration columns), e.g.:
 *
 *   supabase.from('room_types').select('*')
 *     .eq('property_id', propertyId).eq('is_active', true).order('sort_order')
 *
 * and the room-type rate seasons map straight into buildPricingRulesFromSeasons()
 * / calculatePricing() in src/lib/pricingEngine.ts (same shape as
 * property_rate_seasons).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

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
    // Inert until the migration is applied + types regenerated (see file header).
    queryFn: async (): Promise<RoomType[]> => [],
  });
}

/** True when a property exposes bookable room types (i.e. show the room picker). */
export function hasBookableRoomTypes(roomTypes: RoomType[] | undefined): boolean {
  return !!roomTypes && roomTypes.some((r) => r.is_bookable && r.is_active);
}
