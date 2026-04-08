/**
 * Hook for fetching development units for a specific project
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectUnit {
  id: string;
  name: string;
  name_ru: string | null;
  unit_type: string;
  area_sqm: number;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number;
  price_per_sqm: number | null;
  floor_from: number | null;
  floor_to: number | null;
  floor_plan_url: string | null;
  views: string[] | null;
  features: string[] | null;
  total_units: number | null;
  available_units: number | null;
  status: string | null;
}

export function useProjectUnits(projectId?: string) {
  return useQuery({
    queryKey: ['project-units', projectId],
    queryFn: async (): Promise<ProjectUnit[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('development_units')
        .select('*')
        .eq('development_id', projectId)
        .order('price', { ascending: true });
      if (error) throw error;
      return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        name_ru: u.name_ru,
        unit_type: u.unit_type || 'studio',
        area_sqm: u.area_sqm,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        price: u.price,
        price_per_sqm: u.price_per_sqm,
        floor_from: u.floor_from,
        floor_to: u.floor_to,
        floor_plan_url: u.floor_plan_url,
        views: u.views,
        features: u.features,
        total_units: u.total_units,
        available_units: u.available_units,
        status: u.status || 'available',
      }));
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
