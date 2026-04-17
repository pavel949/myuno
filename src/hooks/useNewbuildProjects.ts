/**
 * Hooks for newbuilds section — reuses property_projects + developers tables
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeProjectFacilityIds } from '@/lib/propertyAttributeRegistry';

export interface NewbuildProject {
  id: string;
  slug: string | null;
  name_en: string;
  name_ru: string | null;
  tagline: string | null;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  gallery_urls: string[] | null;
  images: string[] | null;
  video_url: string | null;
  location_area: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_from: number | null;
  price_to: number | null;
  unit_types: string[] | null;
  total_units: number | null;
  units_available: number | null;
  units_sold: number | null;
  completion_date: string | null;
  construction_progress: number;
  project_status: string;
  is_featured: boolean;
  is_approved: boolean;
  developer_id: string | null;
  developer_name: string | null;
  amenities: string[] | null;
  muuno_score: number | null;
  created_at: string;
  // New sales/CRM fields
  commission_pct: number | null;
  payment_plan: any[] | null;
  marketing_materials: string[] | null;
  exclusive: boolean;
  management_company_id: string | null;
  contact_id: string | null;
  min_price_per_sqm: number | null;
  ownership_types: string[] | null;
}

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

      // Sort
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

      return (data || []).map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name_en: p.name_en,
        name_ru: p.name_ru,
        tagline: p.tagline,
        description_en: p.description_en,
        description_ru: p.description_ru,
        cover_image: p.cover_image,
        gallery_urls: p.gallery_urls || p.images,
        images: p.images,
        video_url: p.video_url,
        location_area: p.location_area || p.district,
        district: p.district,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        price_from: p.price_from,
        price_to: p.price_to,
        unit_types: p.unit_types,
        total_units: p.total_units,
        units_available: p.units_available,
        units_sold: p.units_sold,
        completion_date: p.completion_date,
        construction_progress: p.construction_progress || 0,
        project_status: p.project_status || 'under_construction',
        is_featured: p.is_featured || false,
        is_approved: p.is_approved ?? true,
        developer_id: p.developer_id,
        developer_name: p.developer_name,
        amenities: Array.isArray(p.amenities) ? normalizeProjectFacilityIds(p.amenities) : p.amenities,
        muuno_score: p.muuno_score,
        created_at: p.created_at,
        commission_pct: p.commission_pct ?? null,
        payment_plan: p.payment_plan ?? null,
        marketing_materials: p.marketing_materials ?? [],
        exclusive: p.exclusive ?? false,
        management_company_id: p.management_company_id ?? null,
        contact_id: p.contact_id ?? null,
        min_price_per_sqm: p.min_price_per_sqm ?? null,
        ownership_types: p.ownership_types ?? [],
      }));
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

      const p = data as any;
      return {
        id: p.id,
        slug: p.slug,
        name_en: p.name_en,
        name_ru: p.name_ru,
        tagline: p.tagline,
        description_en: p.description_en,
        description_ru: p.description_ru,
        cover_image: p.cover_image,
        gallery_urls: p.gallery_urls || p.images,
        images: p.images,
        video_url: p.video_url,
        location_area: p.location_area || p.district,
        district: p.district,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        price_from: p.price_from,
        price_to: p.price_to,
        unit_types: p.unit_types,
        total_units: p.total_units,
        units_available: p.units_available,
        units_sold: p.units_sold,
        completion_date: p.completion_date,
        construction_progress: p.construction_progress || 0,
        project_status: p.project_status || 'under_construction',
        is_featured: p.is_featured || false,
        is_approved: p.is_approved ?? true,
        developer_id: p.developer_id,
        developer_name: p.developer_name,
        amenities: Array.isArray(p.amenities) ? normalizeProjectFacilityIds(p.amenities) : p.amenities,
        muuno_score: p.muuno_score,
        created_at: p.created_at,
        commission_pct: p.commission_pct ?? null,
        payment_plan: p.payment_plan ?? null,
        marketing_materials: p.marketing_materials ?? [],
        exclusive: p.exclusive ?? false,
        management_company_id: p.management_company_id ?? null,
        contact_id: p.contact_id ?? null,
        min_price_per_sqm: p.min_price_per_sqm ?? null,
        ownership_types: p.ownership_types ?? [],
      };
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
      const avgPrice = projects.length 
        ? projects.reduce((s, p) => s + (p.price_from || 0), 0) / projects.filter(p => p.price_from).length 
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

export function useNewbuildLocations() {
  return useQuery({
    queryKey: ['newbuild-locations'],
    queryFn: async (): Promise<string[]> => {
      const { data } = await supabase
        .from('property_projects')
        .select('location_area, district')
        .eq('is_active', true)
        .eq('is_approved', true);
      
      const areas = new Set<string>();
      (data || []).forEach((p: any) => {
        if (p.location_area) areas.add(p.location_area);
        else if (p.district) areas.add(p.district);
      });
      return Array.from(areas).sort();
    },
    staleTime: 10 * 60 * 1000,
  });
}
