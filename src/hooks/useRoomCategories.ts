import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type RoomCategory = Database['public']['Tables']['property_room_categories']['Row'];
export type RatePlan = Database['public']['Tables']['property_rate_plans']['Row'];
type CategoryInsert = Database['public']['Tables']['property_room_categories']['Insert'];
type PlanInsert = Database['public']['Tables']['property_rate_plans']['Insert'];

export interface CategoryRoom { id: string; unit_number: string | null; title_en: string | null; room_category_id: string | null }

export function useRoomCategories(propertyId?: string) {
  return useQuery({
    queryKey: ['room-categories', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const [cats, plans, rooms] = await Promise.all([
        supabase.from('property_room_categories').select('*').eq('property_id', propertyId!).order('sort_order'),
        supabase.from('property_rate_plans').select('*, property_room_categories!inner(property_id)').eq('property_room_categories.property_id', propertyId!),
        supabase.from('properties').select('id, unit_number, title_en, room_category_id').eq('parent_property_id', propertyId!),
      ]);
      if (cats.error) throw cats.error;
      if (plans.error) throw plans.error;
      if (rooms.error) throw rooms.error;
      return {
        categories: (cats.data ?? []) as RoomCategory[],
        plans: (plans.data ?? []) as unknown as RatePlan[],
        rooms: (rooms.data ?? []) as CategoryRoom[],
      };
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return async () => {
    // Category prices, plans and room assignments also feed guest quotes and availability.
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['room-categories'] }),
      qc.invalidateQueries({ queryKey: ['room-category-offers'] }),
    ]);
  };
}

export function useSaveCategory() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (row: CategoryInsert & { id?: string }) => {
      const { id, ...rest } = row;
      const query = id
        ? supabase.from('property_room_categories').update(rest).eq('id', id)
        : supabase.from('property_room_categories').insert(rest);
      const { data, error } = await query.select('id').single();
      if (error) throw error;
      if (!data || typeof data.id !== 'string' || !data.id.trim() || (id && data.id !== id)) {
        throw new Error('Could not confirm saved category');
      }
      return data.id;
    },
    onSuccess: inv,
  });
}

export function useSavePlan() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (row: PlanInsert & { id?: string }) => {
      const { id, ...rest } = row;
      const query = id
        ? supabase.from('property_rate_plans').update(rest).eq('id', id)
        : supabase.from('property_rate_plans').insert(rest);
      const { data, error } = await query.select('id').single();
      if (error) throw error;
      if (!data || typeof data.id !== 'string' || !data.id.trim() || (id && data.id !== id)) {
        throw new Error('Could not confirm saved rate plan');
      }
      return data.id;
    },
    onSuccess: inv,
  });
}

export function useAssignRoomCategory() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (p: { roomId: string; parentId: string; categoryId: string | null }) => {
      const { data, error } = await supabase.from('properties')
        .update({ parent_property_id: p.categoryId ? p.parentId : null, room_category_id: p.categoryId })
        .eq('id', p.roomId).select('id').single();
      if (error) throw error;
      if (!data || data.id !== p.roomId) throw new Error('Could not confirm room assignment');
      return data.id;
    },
    onSuccess: inv,
  });
}

export function useSetPropertyKind() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; kind: 'unit' | 'resort' | 'hotel' }) => {
      const { data, error } = await supabase.from('properties').update({ property_kind: p.kind })
        .eq('id', p.id).select('id').single();
      if (error) throw error;
      if (!data || data.id !== p.id) throw new Error('Could not confirm property kind');
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['structure-properties'] }),
  });
}

