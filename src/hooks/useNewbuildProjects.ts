/**
 * Developer portal hooks for newbuild projects.
 * Used by the /newbuilds editorial section and /developer-portal CRUD.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { NewbuildProject, ProjectStatus, ListingPurpose } from '@/types/project';

type PropertyProjectRow = Database['public']['Tables']['property_projects']['Row'];

// Re-export shared types for backwards compatibility
export type { NewbuildProject } from '@/types/project';
// Re-export shared location hook as useNewbuildLocations
export { useProjectLocations as useNewbuildLocations } from '@/hooks/useProjectBase';

export interface NewbuildFilters {
  location_area?: string;
  unit_type?: string;
  status?: string;
  price_min?: number;
  price_max?: number;
  developer_id?: string;
  search_text?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'progress' | 'featured';
}

export function mapToNewbuildProject(row: PropertyProjectRow): NewbuildProject {
  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name_en,
    name_ru: row.name_ru,
    tagline: row.tagline,
    description_en: row.description_en,
    description_ru: row.description_ru,
    cover_image: row.cover_image,
    gallery_urls: row.gallery_urls || row.images,
    images: row.images,
    video_url: row.video_url,
    location_area: row.location_area || row.district,
    district: row.district,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    price_from: row.price_from,
    price_to: row.price_to,
    unit_types: row.unit_types,
    total_units: row.total_units,
    units_available: row.units_available,
    units_sold: row.units_sold,
    completion_date: row.completion_date,
    construction_progress: row.construction_progress || 0,
    project_status: (row.project_status as ProjectStatus) || 'offplan',
    listing_purpose: (row.listing_purpose as ListingPurpose) || 'offplan',
    is_featured: row.is_featured || false,
    is_approved: row.is_approved ?? true,
    developer_id: row.developer_id,
    developer_name: row.developer_name,
    amenities: row.amenities,
    muuno_score: row.muuno_score,
    investment_enabled: row.investment_enabled || false,
    funding_goal: row.funding_goal,
    min_investment: row.min_investment,
    roi_projected: row.roi_projected,
    risk_level: row.risk_level,
    created_at: row.created_at || '',
  };
}

export function useNewbuildProjects(filters?: NewbuildFilters) {
  return useQuery({
    queryKey: ['newbuild-projects', filters],
    queryFn: async (): Promise<NewbuildProject[]> => {
      let query = supabase
        .from('property_projects')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true);

      if (filters?.location_area) query = query.eq('location_area', filters.location_area);
      if (filters?.status) query = query.eq('project_status', filters.status);
      if (filters?.developer_id) query = query.eq('developer_id', filters.developer_id);
      if (filters?.price_min) query = query.gte('price_from', filters.price_min);
      if (filters?.price_max) query = query.lte('price_from', filters.price_max);
      if (filters?.search_text) {
        const term = `%${filters.search_text}%`;
        query = query.or(`name_en.ilike.${term},name_ru.ilike.${term},location_area.ilike.${term},developer_name.ilike.${term}`);
      }

      switch (filters?.sort) {
        case 'price_asc': query = query.order('price_from', { ascending: true }); break;
        case 'price_desc': query = query.order('price_from', { ascending: false }); break;
        case 'progress': query = query.order('construction_progress', { ascending: false }); break;
        case 'newest': query = query.order('created_at', { ascending: false }); break;
        default:
          query = query.order('is_featured', { ascending: false }).order('muuno_score', { ascending: false, nullsFirst: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(mapToNewbuildProject);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewbuildProject(slugOrId?: string) {
  return useQuery({
    queryKey: ['newbuild-project', slugOrId],
    queryFn: async (): Promise<NewbuildProject | null> => {
      if (!slugOrId) return null;

      // Try slug first, fall back to id
      let { data, error } = await supabase
        .from('property_projects')
        .select('*')
        .eq('slug', slugOrId)
        .maybeSingle();

      if (!data && !error) {
        ({ data, error } = await supabase
          .from('property_projects')
          .select('*')
          .eq('id', slugOrId)
          .maybeSingle());
      }

      if (error) throw error;
      if (!data) return null;

      return mapToNewbuildProject(data);
    },
    enabled: !!slugOrId,
  });
}

export function useNewbuildStats() {
  return useQuery({
    queryKey: ['newbuild-stats'],
    queryFn: async () => {
      const [projectsRes, developersRes] = await Promise.all([
        supabase.from('property_projects').select('id, price_from', { count: 'exact' }).eq('is_active', true).eq('is_approved', true),
        supabase.from('developers').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      const projects = projectsRes.data || [];
      const pricesWithValue = projects.filter(p => p.price_from);
      const avgPrice = pricesWithValue.length
        ? pricesWithValue.reduce((s, p) => s + (p.price_from || 0), 0) / pricesWithValue.length
        : 0;

      return {
        projectCount: projectsRes.count || 0,
        developerCount: developersRes.count || 0,
        avgPrice: Math.round(avgPrice),
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}
