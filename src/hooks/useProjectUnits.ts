/**
 * useProjectUnits — reads units for a public project page.
 * Source: `project_units` (canonical operational table). Falls back to
 * `development_units` for legacy projects that haven't been migrated yet.
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

interface ProjectUnitRow {
  id: string;
  unit_code: string | null;
  unit_type: string | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  price_per_sqm: number | null;
  floor: number | null;
  floor_number: number | null;
  floor_plan_url: string | null;
  view_type: string | null;
  status: string | null;
  unit_status: string | null;
}

function mapRow(u: ProjectUnitRow): ProjectUnit {
  const floor = u.floor ?? u.floor_number ?? null;
  return {
    id: u.id,
    name: u.unit_code || u.unit_type || 'Unit',
    name_ru: null,
    unit_type: u.unit_type || 'studio',
    area_sqm: Number(u.area_sqm ?? 0),
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    price: Number(u.price ?? 0),
    price_per_sqm: u.price_per_sqm !== null ? Number(u.price_per_sqm) : null,
    floor_from: floor,
    floor_to: floor,
    floor_plan_url: u.floor_plan_url,
    views: u.view_type ? [u.view_type] : null,
    features: null,
    total_units: 1,
    available_units: u.unit_status === 'available' || u.status === 'available' ? 1 : 0,
    status: u.unit_status ?? u.status ?? 'available',
  };
}

export function useProjectUnits(projectId?: string) {
  return useQuery({
    queryKey: ['project-units', projectId],
    queryFn: async (): Promise<ProjectUnit[]> => {
      if (!projectId) return [];

      // Primary source — `project_units` (canonical)
      const { data, error } = await supabase
        .from('project_units')
        .select(
          'id, unit_code, unit_type, area_sqm, bedrooms, bathrooms, price, price_per_sqm, floor, floor_number, floor_plan_url, view_type, status, unit_status',
        )
        .eq('project_id', projectId)
        .order('price', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return (data as ProjectUnitRow[]).map(mapRow);
      }

      // Fallback — legacy `development_units` (deprecated, kept for compatibility)
      const { data: legacy, error: legacyErr } = await supabase
        .from('development_units')
        .select('*')
        .eq('development_id', projectId)
        .order('price', { ascending: true });

      if (legacyErr) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (legacy || []).map((u: any) => ({
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
