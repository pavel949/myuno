import { publicNewbuildUnit } from '@/lib/real-estate/publicNewbuildPresentation';
import { resolveSalesUnitStatus } from '@/lib/real-estate/unitStatus';
/**
 * useProjectUnits — reads units for a public project page.
 * Source: `project_units` (canonical operational table). Falls back to
 * `development_units` for legacy projects that haven't been migrated yet.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLegacyUnitTablesEnabled } from '@/lib/real-estate/unitSourceFlag';

export interface ProjectUnit {
  id: string;
  property_id: string | null;
  unit_code?: string | null;
  name: string;
  name_ru: string | null;
  unit_type: string;
  area_sqm: number;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  price_per_sqm: number | null;
  currency: string | null;
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
  property_id: string | null;
  unit_code: string | null;
  unit_type: string | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  price_per_sqm: number | null;
  currency: string | null;
  floor: number | null;
  floor_number: number | null;
  floor_plan_url: string | null;
  view_type: string | null;
  status: string | null;
  unit_status: string | null;
}

const PROJECT_UNIT_COLUMNS = 'id, property_id, unit_code, unit_type, area_sqm, bedrooms, bathrooms, price, price_per_sqm, currency, floor, floor_number, floor_plan_url, view_type, status, unit_status';

function mapRow(u: ProjectUnitRow): ProjectUnit {
  const floor = u.floor ?? u.floor_number ?? null;
  return {
    id: u.id,
    property_id: u.property_id ?? null,
    unit_code: u.unit_code?.trim() || null,
    name: u.unit_code || u.unit_type || 'Unit',
    name_ru: null,
    unit_type: u.unit_type || 'studio',
    area_sqm: Number(u.area_sqm ?? 0),
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    price: u.price == null ? null : Number(u.price),
    price_per_sqm: u.price_per_sqm !== null ? Number(u.price_per_sqm) : null,
    currency: u.currency ?? null,
    floor_from: floor,
    floor_to: floor,
    floor_plan_url: u.floor_plan_url,
    views: u.view_type ? [u.view_type] : null,
    features: null,
    total_units: 1,
    available_units: resolveSalesUnitStatus(u) === 'available' ? 1 : 0,
    status: resolveSalesUnitStatus(u),
  };
}

export function useProjectUnits(projectId?: string) {
  const legacyEnabled = useLegacyUnitTablesEnabled();

  return useQuery({
    queryKey: ['project-units', projectId, legacyEnabled],
    queryFn: async (): Promise<ProjectUnit[]> => {
      if (!projectId) return [];

      // Primary source — `project_units` (canonical)
      const { data, error } = await supabase
        .from('project_units')
        .select(PROJECT_UNIT_COLUMNS)
        .eq('project_id', projectId)
        .order('id');

      if (error) throw error;
      if (data && data.length > 0) {
        return (data as ProjectUnitRow[]).map(u => publicNewbuildUnit(mapRow(u)));
      }

      // Fallback — legacy `development_units`. Only when the kill-switch flag
      // `feature_flag:legacy_unit_tables` is on (rollback path).
      if (!legacyEnabled) return [];

      const { data: legacy, error: legacyErr } = await supabase
        .from('development_units')
        .select('*')
        .eq('development_id', projectId)
        .order('id');

      if (legacyErr) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (legacy || []).map((u: any) => publicNewbuildUnit({
        id: u.id,
        property_id: u.property_id ?? null,
        name: u.name,
        name_ru: u.name_ru,
        unit_type: u.unit_type || 'studio',
        area_sqm: u.area_sqm,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        price: u.price,
        price_per_sqm: u.price_per_sqm,
        currency: u.currency ?? null,
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

export function usePublicProjectUnit(projectId?: string, unitId?: string) {
  return useQuery({
    queryKey: ['public-project-unit', projectId, unitId],
    queryFn: async (): Promise<ProjectUnit | null> => {
      if (!projectId || !unitId) return null;

      const { data, error } = await supabase
        .from('project_units')
        .select(PROJECT_UNIT_COLUMNS)
        .eq('project_id', projectId)
        .eq('id', unitId)
        .maybeSingle();

      if (error) throw error;
      return data?.unit_code?.trim() ? publicNewbuildUnit(mapRow(data)) : null;
    },
    enabled: Boolean(projectId && unitId),
    staleTime: 5 * 60 * 1000,
  });
}
