/**
 * useRoomTypeMutations — owner CRUD for hotel room types (Phase 2 / Part 5B).
 *
 * Writes to `room_types` (created by 20260630120000_hotel_room_types.sql, applied
 * via Lovable Cloud). RLS scopes writes to the owner (auth.uid() = owner_id) or
 * admin/UNO team. Until the migration lands these calls error against a missing
 * table and surface a toast — the owner UI simply has nothing to manage yet.
 * `'table' as never` / `row as never` mirror the project idiom for not-yet-typed
 * tables (see useFinancialPlanning.ts upsert).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RoomTypeBed } from '@/hooks/useRoomTypes';

export interface RoomTypeUpsert {
  id?: string;
  property_id: string;
  name_en: string;
  name_ru?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  max_occupancy: number;
  bed_config?: RoomTypeBed[];
  amenities?: string[];
  images?: string[];
  base_price_per_night?: number | null;
  currency?: string | null;
  total_units?: number;
  refundable?: boolean;
  sort_order?: number;
  is_bookable?: boolean;
  is_active?: boolean;
}

/** Create or update a room type. owner_id is stamped from the authenticated user. */
export function useSaveRoomType() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: RoomTypeUpsert): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      const row = {
        ...(input.id ? { id: input.id } : {}),
        property_id: input.property_id,
        owner_id: user.id,
        name_en: input.name_en,
        name_ru: input.name_ru ?? null,
        description_en: input.description_en ?? null,
        description_ru: input.description_ru ?? null,
        max_occupancy: input.max_occupancy,
        bed_config: input.bed_config ?? [],
        amenities: input.amenities ?? [],
        images: input.images ?? [],
        base_price_per_night: input.base_price_per_night ?? null,
        currency: input.currency ?? 'THB',
        total_units: input.total_units ?? 1,
        refundable: input.refundable ?? true,
        sort_order: input.sort_order ?? 0,
        is_bookable: input.is_bookable ?? true,
        is_active: input.is_active ?? true,
      };

      const { error } = await supabase
        .from('room_types' as never)
        .upsert(row as never, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room-types', vars.property_id] });
    },
  });
}

/** Permanently delete a room type (cascade removes its rate seasons). */
export function useDeleteRoomType() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; propertyId: string }): Promise<void> => {
      const { error } = await supabase
        .from('room_types' as never)
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room-types', vars.propertyId] });
    },
  });
}
