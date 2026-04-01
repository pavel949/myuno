/**
 * Hook for development unit types within a project
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DevelopmentUnit {
  id: string;
  development_id: string;
  name: string;
  name_ru: string | null;
  unit_type: string;
  area_sqm: number;
  bedrooms: number;
  bathrooms: number;
  floor_from: number | null;
  floor_to: number | null;
  price: number;
  price_per_sqm: number | null;
  total_units: number;
  available_units: number;
  floor_plan_url: string | null;
  views: string[] | null;
  features: string[] | null;
  status: string;
  created_at: string;
}

export function useDevelopmentUnits(developmentId?: string) {
  return useQuery({
    queryKey: ['development-units', developmentId],
    queryFn: async (): Promise<DevelopmentUnit[]> => {
      if (!developmentId) return [];
      const { data, error } = await supabase
        .from('development_units' as any)
        .select('*')
        .eq('development_id', developmentId)
        .order('price', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as DevelopmentUnit[];
    },
    enabled: !!developmentId,
  });
}

export function useCreateDevelopmentUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<DevelopmentUnit, 'id' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('development_units' as any)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['development-units', vars.development_id] });
      toast.success('Unit type added');
    },
    onError: () => toast.error('Failed to add unit type'),
  });
}

export function useDeleteDevelopmentUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, developmentId }: { id: string; developmentId: string }) => {
      const { error } = await supabase
        .from('development_units' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return developmentId;
    },
    onSuccess: (developmentId) => {
      queryClient.invalidateQueries({ queryKey: ['development-units', developmentId] });
      toast.success('Unit type removed');
    },
    onError: () => toast.error('Failed to remove unit type'),
  });
}
