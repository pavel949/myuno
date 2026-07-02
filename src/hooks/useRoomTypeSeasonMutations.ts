/**
 * useRoomTypeSeasonMutations — owner CRUD for per-room-type seasonal rates and
 * availability overrides (Phase 2b / Part 5B).
 *
 * Writes to `room_type_rate_seasons` (20260630120000) and
 * `room_type_availability` (20260701090000). RLS scopes writes to the owner.
 * Dormant until the tables ship (Save surfaces a toast error). `'table' as never`
 * / `row as never` mirror the project idiom for not-yet-typed tables.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RoomTypeSeasonUpsert {
  id?: string;
  room_type_id: string;
  name_en: string;
  name_ru?: string | null;
  start_date: string;
  end_date: string;
  nightly_rate: number;
  weekly_rate?: number | null;
  monthly_rate?: number | null;
  min_stay_nights?: number | null;
  weekly_discount?: number | null;
  monthly_discount?: number | null;
  currency?: string | null;
  is_active?: boolean;
}

/** Create or update a room-type rate season. owner_id stamped from auth. */
export function useSaveRoomTypeSeason() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: RoomTypeSeasonUpsert): Promise<void> => {
      if (!user) throw new Error('Not authenticated');
      const row = {
        ...(input.id ? { id: input.id } : {}),
        room_type_id: input.room_type_id,
        owner_id: user.id,
        name_en: input.name_en,
        name_ru: input.name_ru ?? null,
        start_date: input.start_date,
        end_date: input.end_date,
        nightly_rate: input.nightly_rate,
        weekly_rate: input.weekly_rate ?? null,
        monthly_rate: input.monthly_rate ?? null,
        min_stay_nights: input.min_stay_nights ?? 1,
        weekly_discount: input.weekly_discount ?? null,
        monthly_discount: input.monthly_discount ?? null,
        currency: input.currency ?? 'THB',
        is_active: input.is_active ?? true,
      };
      const { error } = await supabase
        .from('room_type_rate_seasons' as never)
        .upsert(row as never, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room-type-rate-seasons', vars.room_type_id] });
    },
  });
}

/** Permanently delete a room-type rate season. */
export function useDeleteRoomTypeSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; roomTypeId: string }): Promise<void> => {
      const { error } = await supabase
        .from('room_type_rate_seasons' as never)
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['room-type-rate-seasons', vars.roomTypeId] });
    },
  });
}
