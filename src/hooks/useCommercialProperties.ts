/**
 * Hooks for commercial RE and land plot listings.
 * Both share the `properties` table; discriminated by `asset_class`.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PUBLIC_CATALOG_APPROVAL_STATUS } from '@/lib/real-estate/canonicalModel';

export interface CommercialProperty {
  id: string;
  title_en: string;
  title_ru: string;
  description_en?: string | null;
  description_ru?: string | null;
  property_type: string;
  listing_type: string | null;
  asset_class: 'residential' | 'commercial' | 'land';
  district?: string | null;
  address?: string | null;
  cover_image?: string | null;
  images?: string[] | null;
  price?: number | null;
  sale_price?: number | null;
  monthly_rent_thb?: number | null;
  currency?: string | null;
  // Commercial-specific
  floor_area_sqm?: number | null;
  land_size_sqm?: number | null;
  land_size_rai?: number | null;
  frontage_m?: number | null;
  road_access?: string | null;
  zoning?: string | null;
  title_deed_type?: string | null;
  electricity_load_kw?: number | null;
  water_supply?: string | null;
  current_lease_term_months?: number | null;
  lease_remaining_months?: number | null;
  noi_annual_thb?: number | null;
  cap_rate_pct?: number | null;
  yield_pct?: number | null;
  existing_tenant_anonymized?: boolean | null;
  permitted_uses?: string[] | null;
  building_condition?: string | null;
  
  floor?: number | null;
  parking_type?: string | null;
  is_featured?: boolean | null;
  is_verified?: boolean | null;
  created_at: string;
}

const COMMERCIAL_COLUMNS = `
  id, title_en, title_ru, description_en, description_ru,
  property_type, listing_type, asset_class,
  district, address, cover_image, images,
  price, sale_price, monthly_rent_thb, currency,
  floor_area_sqm, land_size_sqm, land_size_rai,
  frontage_m, road_access, zoning, title_deed_type,
  electricity_load_kw, water_supply,
  current_lease_term_months, lease_remaining_months,
  noi_annual_thb, cap_rate_pct, yield_pct,
  existing_tenant_anonymized, permitted_uses, building_condition,
  floor, parking_type,
  is_featured, is_verified, created_at
`;

export interface CommercialFilters {
  intent?: 'rent' | 'sale' | 'all';
  propertyType?: string | 'all';
  district?: string | 'all';
  minPrice?: number;
  maxPrice?: number;
  minAreaSqm?: number;
  maxAreaSqm?: number;
}

export function useCommercialProperties(filters: CommercialFilters = {}) {
  return useQuery({
    queryKey: ['commercial-properties', filters],
    queryFn: async (): Promise<CommercialProperty[]> => {
      let query = supabase
        .from('properties')
        .select(COMMERCIAL_COLUMNS)
        .eq('asset_class', 'commercial')
        .eq('is_active', true)
        .eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60);

      if (filters.intent === 'rent') query = query.eq('listing_type', 'rent');
      if (filters.intent === 'sale') query = query.eq('listing_type', 'sale');
      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.district && filters.district !== 'all') {
        query = query.eq('district', filters.district);
      }
      if (filters.minAreaSqm !== undefined) query = query.gte('floor_area_sqm', filters.minAreaSqm);
      if (filters.maxAreaSqm !== undefined) query = query.lte('floor_area_sqm', filters.maxAreaSqm);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CommercialProperty[];
    },
    staleTime: 60_000,
  });
}

export function useCommercialProperty(id: string | undefined) {
  return useQuery({
    queryKey: ['commercial-property', id],
    enabled: !!id,
    queryFn: async (): Promise<CommercialProperty | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('properties')
        .select(COMMERCIAL_COLUMNS)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as CommercialProperty | null) ?? null;
    },
    staleTime: 60_000,
  });
}

export function useLandPlots(filters: CommercialFilters = {}) {
  return useQuery({
    queryKey: ['land-plots', filters],
    queryFn: async (): Promise<CommercialProperty[]> => {
      let query = supabase
        .from('properties')
        .select(COMMERCIAL_COLUMNS)
        .eq('asset_class', 'land')
        .eq('is_active', true)
        .eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60);

      if (filters.intent === 'rent') query = query.eq('listing_type', 'rent');
      if (filters.intent === 'sale') query = query.eq('listing_type', 'sale');
      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.district && filters.district !== 'all') {
        query = query.eq('district', filters.district);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CommercialProperty[];
    },
    staleTime: 60_000,
  });
}
