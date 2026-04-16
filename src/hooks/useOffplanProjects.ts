/**
 * Hook for fetching off-plan property projects with filters
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OffplanCatalogFacet } from '@/lib/offplan/types';
import type { ProjectLifecycleStatus } from '@/lib/real-estate/canonicalModel';
import { applyProjectCatalogFilters, applyProjectCatalogSort, createProjectCatalogQuery } from './projectCatalogQuery';

export type ProjectStatus = ProjectLifecycleStatus;

export interface OffplanProject {
  id: string;
  nameEn: string;
  nameRu: string;
  coverImage: string | null;
  district: string | null;
  isFeatured: boolean;
  isActive: boolean;
  developerId: string | null;
  developerName: string | null;
  developerLogo: string | null;
  developerScore: number | null;
  developerVerified: boolean;
  projectStatus: ProjectStatus;
  completionDate: string | null;
  constructionProgress: number;
  priceFrom: number | null;
  priceTo: number | null;
  investmentEnabled: boolean;
  fundingGoal: number | null;
  amountRaised: number | null;
  minInvestment: number | null;
  roiProjected: number | null;
  muunoScore: number | null;
  riskLevel: string | null;
  unitsAvailable: number;
  unitsSold: number;
  amenities: string[] | null;
  offplanCatalog: OffplanCatalogFacet | null;
  featuredRank: number | null;
  featuredLabel: string | null;
  descriptionSummary: string | null;
  yieldEstimate: string | null;
  sourceUrl: string | null;
}

function parseOffplanCatalog(raw: unknown): OffplanCatalogFacet | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return {
    legacy_id: typeof o.legacy_id === 'number' ? o.legacy_id : undefined,
    rec: o.rec === 'BUY' || o.rec === 'WATCH' || o.rec === 'AVOID' ? o.rec : undefined,
    seg: typeof o.seg === 'string' ? o.seg : undefined,
    zone: typeof o.zone === 'string' ? o.zone : undefined,
    type: typeof o.type === 'string' ? o.type : undefined,
    beach: typeof o.beach === 'string' ? o.beach : undefined,
    own: typeof o.own === 'string' ? o.own : undefined,
    mgmt: typeof o.mgmt === 'string' ? o.mgmt : undefined,
    focus: typeof o.focus === 'string' ? o.focus : undefined,
    st_k: typeof o.st_k === 'string' ? o.st_k : undefined,
    tags: Array.isArray(o.tags) ? (o.tags.filter((t) => typeof t === 'string') as string[]) : undefined,
    rating: typeof o.rating === 'number' ? o.rating : undefined,
    comp_y: typeof o.comp_y === 'number' ? o.comp_y : undefined,
    comp_q: typeof o.comp_q === 'string' ? o.comp_q : undefined,
    min_br: typeof o.min_br === 'number' ? o.min_br : undefined,
  };
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
      const commonFilters = {
        isActive: true,
        statuses: filters?.status,
        district: filters?.district,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        minScore: filters?.minScore,
        developerId: filters?.developerId,
        investmentOnly: filters?.investmentOnly,
      };

      const mapMinimal = (p: any): OffplanProject => ({
        id: p.id,
        nameEn: p.name_en,
        nameRu: p.name_ru,
        coverImage: null,
        district: p.district,
        isFeatured: false,
        isActive: p.is_active || false,
        developerId: null,
        developerName: p.developer_name,
        developerLogo: null,
        developerScore: null,
        developerVerified: false,
        projectStatus: (p.project_status as ProjectStatus) || 'offplan',
        completionDate: p.completion_date,
        constructionProgress: p.construction_progress || 0,
        priceFrom: p.price_from,
        priceTo: null,
        investmentEnabled: false,
        fundingGoal: null,
        amountRaised: null,
        minInvestment: null,
        roiProjected: p.roi_projected,
        muunoScore: p.muuno_score,
        riskLevel: p.risk_level,
        unitsAvailable: 0,
        unitsSold: 0,
        amenities: p.amenities,
        offplanCatalog: parseOffplanCatalog((p as { offplan_catalog?: unknown }).offplan_catalog),
        featuredRank: p.featured_rank ?? null,
        featuredLabel: p.featured_label ?? null,
        descriptionSummary: p.description_summary ?? null,
        yieldEstimate: p.yield_estimate ?? null,
        sourceUrl: p.source_url ?? null,
      });

      const mapRich = (p: any): OffplanProject => {
        const developer = p.developers as any;
        return {
          ...mapMinimal(p),
          coverImage: p.cover_image ?? null,
          isFeatured: Boolean(p.is_featured),
          developerId: p.developer_id ?? null,
          developerName: (developer?.name_en as string | undefined) || p.developer_name,
          developerLogo: (developer?.logo_url as string | null | undefined) || null,
          developerScore: (developer?.muuno_score as number | null | undefined) ?? null,
          developerVerified: Boolean(developer?.is_verified),
          priceTo: p.price_to ?? null,
          investmentEnabled: Boolean(p.investment_enabled),
          fundingGoal: p.funding_goal ?? null,
          minInvestment: p.min_investment ?? null,
          unitsAvailable: p.units_available || 0,
          unitsSold: p.units_sold || 0,
        };
      };

      const richSelect = `
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
          offplan_catalog,
          featured_rank,
          featured_label,
          description_summary,
          yield_estimate,
          source_url,
          developers (
            id,
            name_en,
            logo_url,
            muuno_score,
            is_verified
          )
        `;

      const richSelectNoEmbed = richSelect.replace(/\s*developers\s*\([^)]*\)\s*/is, '').trim();

      const runRich = async (selectStr: string) => {
        let q = createProjectCatalogQuery(selectStr);
        q = applyProjectCatalogFilters(q, commonFilters);
        q = applyProjectCatalogSort(q, 'featured_score');
        return q;
      };

      let rich = await runRich(richSelect);

      // If FK/embed to developers is missing on a snapshot DB, retry without embed.
      if (
        rich.error &&
        /relationship|schema cache/i.test(String(rich.error.message || ''))
      ) {
        rich = await runRich(richSelectNoEmbed);
      }

      if (!rich.error && rich.data && rich.data.length > 0) {
        return rich.data.map((p: any) => mapRich(p));
      }

      if (!rich.error && rich.data) {
        return [];
      }

      // 2) Fallback schema (minimal columns; no offplan_catalog — may not exist)
      let fallbackQuery = supabase
        .from('property_projects')
        .select(`
          id,
          name_en,
          name_ru,
          district,
          is_active,
          developer_name,
          project_status,
          completion_date,
          construction_progress,
          price_from,
          roi_projected,
          muuno_score,
          risk_level,
          amenities
        `);

      fallbackQuery = applyProjectCatalogFilters(fallbackQuery, commonFilters);
      fallbackQuery = applyProjectCatalogSort(fallbackQuery, 'featured_score');
      const fallback = await fallbackQuery;
      if (fallback.error) throw fallback.error;
      if (!fallback.data) return [];
      return fallback.data.map(mapMinimal);
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
