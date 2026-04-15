/**
 * Buyer-facing read-only hooks for off-plan projects.
 * No mutations — this module is a catalog for buyers/investors.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapProjectRow } from '@/hooks/useProjectBase';
import type {
  OffplanProject,
  ProjectStatus,
  ProjectDeveloper,
} from '@/types/project';

// Re-export shared types for backwards compatibility
export type { OffplanProject, ProjectStatus } from '@/types/project';
// Re-export shared district hook
export { useProjectDistricts } from '@/hooks/useProjectBase';

export interface OffplanFilters {
  status?: ProjectStatus[];
  district?: string;
  developerId?: string;
  minPrice?: number;
  maxPrice?: number;
  minScore?: number;
  investmentOnly?: boolean;
}

/** Select columns for the offplan list query (with developer join) */
const OFFPLAN_SELECT = `
  id, slug, name_en, name_ru, cover_image, district, location_area, address,
  lat, lng, price_from, price_to, project_status, listing_purpose,
  completion_date, construction_progress,
  is_featured, is_approved, is_active,
  developer_id, developer_name,
  amenities, muuno_score, total_units, units_available, units_sold,
  created_at,
  investment_enabled, funding_goal, min_investment, roi_projected, risk_level,
  developers (id, name_en, logo_url, muuno_score, is_verified)
`;

function mapToOffplanProject(row: Record<string, unknown>): OffplanProject {
  const r = row as Record<string, unknown>;
  const dev = r.developers as ProjectDeveloper | null;
  const base = mapProjectRow(r as Parameters<typeof mapProjectRow>[0]);

  return {
    ...base,
    isActive: (r.is_active as boolean) || false,
    developer: dev,
    developerLogo: dev?.logo_url || null,
    developerScore: dev?.muuno_score || null,
    developerVerified: dev?.is_verified || false,
    investmentEnabled: (r.investment_enabled as boolean) || false,
    fundingGoal: r.funding_goal as number | null,
    minInvestment: r.min_investment as number | null,
    roiProjected: r.roi_projected as number | null,
    riskLevel: r.risk_level as string | null,
  };
}

export function useOffplanProjects(filters?: OffplanFilters) {
  return useQuery({
    queryKey: ['offplan-projects', filters],
    queryFn: async (): Promise<OffplanProject[]> => {
      let query = supabase
        .from('property_projects')
        .select(OFFPLAN_SELECT)
        .eq('is_active', true);

      if (filters?.status && filters.status.length > 0) {
        query = query.in('project_status', filters.status);
      }
      if (filters?.district) {
        query = query.eq('district', filters.district);
      }
      if (filters?.developerId) {
        query = query.eq('developer_id', filters.developerId);
      }
      if (filters?.minPrice) {
        query = query.gte('price_from', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte('price_from', filters.maxPrice);
      }
      if (filters?.minScore) {
        query = query.gte('muuno_score', filters.minScore);
      }
      if (filters?.investmentOnly) {
        query = query.eq('investment_enabled', true);
      }

      query = query
        .order('is_featured', { ascending: false })
        .order('muuno_score', { ascending: false, nullsFirst: false });

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];

      return data.map((row) => mapToOffplanProject(row as Record<string, unknown>));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single offplan project by ID — avoids N+1 (replaces useOffplanProjects + .find) */
export function useOffplanProject(id?: string) {
  return useQuery({
    queryKey: ['offplan-project', id],
    queryFn: async (): Promise<OffplanProject | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('property_projects')
        .select(OFFPLAN_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapToOffplanProject(data as Record<string, unknown>);
    },
    enabled: !!id,
  });
}
