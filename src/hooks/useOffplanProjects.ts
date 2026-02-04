/**
 * Hook for fetching off-plan property projects with filters
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ProjectStatus = 'offplan' | 'under_construction' | 'completed';

export interface OffplanProject {
  id: string;
  nameEn: string;
  nameRu: string;
  coverImage: string | null;
  district: string | null;
  isFeatured: boolean;
  isActive: boolean;
  // Developer info
  developerId: string | null;
  developerName: string | null;
  developerLogo: string | null;
  developerScore: number | null;
  developerVerified: boolean;
  // Project status
  projectStatus: ProjectStatus;
  completionDate: string | null;
  constructionProgress: number;
  // Pricing
  priceFrom: number | null;
  priceTo: number | null;
  // Investment metrics
  investmentEnabled: boolean;
  fundingGoal: number | null;
  amountRaised: number | null;
  minInvestment: number | null;
  roiProjected: number | null;
  muunoScore: number | null;
  riskLevel: string | null;
  // Units
  unitsAvailable: number;
  unitsSold: number;
  amenities: string[] | null;
}

export interface OffplanFilters {
  status?: ProjectStatus[];
  district?: string;
  developerId?: string;
  minPrice?: number;
  maxPrice?: number;
  minScore?: number;
  investmentOnly?: boolean;
}

export function useOffplanProjects(filters?: OffplanFilters) {
  return useQuery({
    queryKey: ['offplan-projects', filters],
    queryFn: async (): Promise<OffplanProject[]> => {
      // Fetch projects with developer info
      let query = supabase
        .from('property_projects')
        .select(`
          id,
          name_en,
          name_ru,
          cover_image,
          district,
          is_featured,
          is_active,
          developer_id,
          developer_name,
          project_status,
          completion_date,
          construction_progress,
          price_from,
          price_to,
          investment_enabled,
          funding_goal,
          min_investment,
          roi_projected,
          muuno_score,
          risk_level,
          units_available,
          units_sold,
          amenities,
          developers (
            id,
            name_en,
            logo_url,
            muuno_score,
            is_verified
          )
        `)
        .eq('is_active', true);

      // Apply filters
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

      // Order by featured first, then by muuno score
      query = query
        .order('is_featured', { ascending: false })
        .order('muuno_score', { ascending: false, nullsFirst: false });

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      return data.map((p): OffplanProject => {
        const developer = p.developers as any;
        
        return {
          id: p.id,
          nameEn: p.name_en,
          nameRu: p.name_ru,
          coverImage: p.cover_image,
          district: p.district,
          isFeatured: p.is_featured || false,
          isActive: p.is_active || false,
          // Developer
          developerId: p.developer_id,
          developerName: developer?.name_en || p.developer_name,
          developerLogo: developer?.logo_url || null,
          developerScore: developer?.muuno_score || null,
          developerVerified: developer?.is_verified || false,
          // Status
          projectStatus: (p.project_status as ProjectStatus) || 'offplan',
          completionDate: p.completion_date,
          constructionProgress: p.construction_progress || 0,
          // Pricing
          priceFrom: p.price_from,
          priceTo: p.price_to,
          // Investment
          investmentEnabled: p.investment_enabled || false,
          fundingGoal: p.funding_goal,
          amountRaised: null, // amount_raised is stored in investment_projects table
          minInvestment: p.min_investment,
          roiProjected: p.roi_projected,
          muunoScore: p.muuno_score,
          riskLevel: p.risk_level,
          // Units
          unitsAvailable: p.units_available || 0,
          unitsSold: p.units_sold || 0,
          amenities: p.amenities,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to get unique districts for filter dropdown
export function useProjectDistricts() {
  return useQuery({
    queryKey: ['project-districts'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('property_projects')
        .select('district')
        .eq('is_active', true)
        .not('district', 'is', null);

      if (error) throw error;
      
      const districts = new Set(data?.map(p => p.district).filter(Boolean) as string[]);
      return Array.from(districts).sort();
    },
    staleTime: 10 * 60 * 1000,
  });
}
