import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type StayRestriction = Database['public']['Tables']['property_stay_restrictions']['Row'];
type RestrictionInput = Database['public']['Tables']['property_stay_restrictions']['Insert'];

export function usePropertyStayRestriction(propertyId: string, categoryId: string | null, date: string) {
  return useQuery({
    queryKey: ['property-stay-restrictions', propertyId, categoryId, date],
    enabled: Boolean(propertyId && date),
    queryFn: async () => {
      let query = supabase.from('property_stay_restrictions').select('*')
        .eq('property_id', propertyId).eq('date', date);
      query = categoryId ? query.eq('category_id', categoryId) : query.is('category_id', null);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveStayRestriction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: RestrictionInput) => {
      const { id, ...values } = row;
      const query = id
        ? supabase.from('property_stay_restrictions').update(values).eq('id', id).eq('property_id', row.property_id)
        : supabase.from('property_stay_restrictions').insert(values);
      const { error } = await query.select('id').single();
      if (error) throw error;
    },
    onSuccess: async (_, row) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['property-stay-restrictions', row.property_id] }),
        qc.invalidateQueries({ queryKey: ['room-category-offers', row.property_id] }),
      ]);
    },
  });
}