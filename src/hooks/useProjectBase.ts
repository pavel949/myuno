/**
 * Shared utilities for property_projects hooks.
 * Used by both Offplan (buyer catalog) and Newbuilds (developer portal).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { BaseProject, ProjectStatus, ListingPurpose } from '@/types/project';

export type PropertyProjectRow = Database['public']['Tables']['property_projects']['Row'];

/** Columns shared by both offplan and newbuild list queries */
export const BASE_PROJECT_COLUMNS = `
  id,
  slug,
  name_en,
  name_ru,
  cover_image,
  district,
  location_area,
  address,
  lat,
  lng,
  price_from,
  price_to,
  project_status,
  listing_purpose,
  completion_date,
  construction_progress,
  is_featured,
  is_approved,
  is_active,
  developer_id,
  developer_name,
  amenities,
  muuno_score,
  total_units,
  units_available,
  units_sold,
  created_at
` as const;

/** Map a property_projects DB row to the shared BaseProject shape */
export function mapProjectRow(row: PropertyProjectRow): BaseProject {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameRu: row.name_ru,
    coverImage: row.cover_image,
    district: row.district,
    locationArea: row.location_area,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    priceFrom: row.price_from,
    priceTo: row.price_to,
    projectStatus: (row.project_status as ProjectStatus) || 'offplan',
    listingPurpose: (row.listing_purpose as ListingPurpose) || 'offplan',
    completionDate: row.completion_date,
    constructionProgress: row.construction_progress || 0,
    isFeatured: row.is_featured || false,
    isApproved: row.is_approved ?? true,
    developerId: row.developer_id,
    developerName: row.developer_name,
    amenities: row.amenities,
    muunoScore: row.muuno_score,
    totalUnits: row.total_units,
    unitsAvailable: row.units_available || 0,
    unitsSold: row.units_sold || 0,
    createdAt: row.created_at || '',
  };
}

/** Unique districts from active property_projects — shared by offplan and newbuild filters */
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

      const districts = new Set(
        data?.map((p) => p.district).filter(Boolean) as string[],
      );
      return Array.from(districts).sort();
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Unique location areas from active property_projects — used by newbuild area filters */
export function useProjectLocations() {
  return useQuery({
    queryKey: ['project-locations'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('property_projects')
        .select('location_area, district')
        .eq('is_active', true)
        .eq('is_approved', true);

      if (error) throw error;

      const areas = new Set<string>();
      (data || []).forEach((p) => {
        if (p.location_area) areas.add(p.location_area);
        else if (p.district) areas.add(p.district);
      });
      return Array.from(areas).sort();
    },
    staleTime: 10 * 60 * 1000,
  });
}
