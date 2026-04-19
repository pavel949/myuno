/**
 * Hook for hotel-class commercial properties (operational hospitality assets).
 * Hotels = `asset_class='commercial' AND property_type IN HOTEL_PROPERTY_TYPES`.
 *
 * Supports filters specific to hotels: keys count, star rating, license,
 * management status (owner-operated, under HMA, seeking operator, for lease).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PUBLIC_CATALOG_APPROVAL_STATUS } from '@/lib/real-estate/canonicalModel';
import { HOTEL_PROPERTY_TYPES } from '@/lib/real-estate/commercialTaxonomy';
import type { CommercialProperty, CommercialFilters } from '@/hooks/useCommercialProperties';

export type HotelMode = 'buy' | 'lease' | 'management' | 'all';

export interface HotelFilters extends CommercialFilters {
  /** Acquisition / lease / HMA opportunity tab */
  mode?: HotelMode;
  minKeys?: number;
  maxKeys?: number;
  minStars?: number;
  licenseType?: string | 'all';
  managementStatus?: string | 'all';
  minOccupancy?: number;
}

const COLUMNS = `
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
  is_featured, is_verified, created_at,
  hotel_keys, hotel_star_rating, hotel_brand, hotel_license_type,
  hotel_adr_thb, hotel_revpar_thb, hotel_occupancy_pct, hotel_gop_margin_pct,
  hotel_management_status, hotel_operator_name, hotel_year_renovated
`;

export function useHotelProperties(filters: HotelFilters = {}) {
  return useQuery({
    queryKey: ['hotel-properties', filters],
    queryFn: async (): Promise<CommercialProperty[]> => {
      let query = supabase
        .from('properties')
        .select(COLUMNS)
        .eq('asset_class', 'commercial')
        .in('property_type', HOTEL_PROPERTY_TYPES as unknown as string[])
        .eq('is_active', true)
        .eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60);

      // Mode → maps to listing_type / management_status
      if (filters.mode === 'buy') query = query.eq('listing_type', 'sale');
      if (filters.mode === 'lease') query = query.eq('listing_type', 'rent');
      if (filters.mode === 'management') {
        query = query.eq('hotel_management_status', 'seeking_operator');
      }

      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.district && filters.district !== 'all') {
        query = query.eq('district', filters.district);
      }
      if (filters.minKeys !== undefined) query = query.gte('hotel_keys', filters.minKeys);
      if (filters.maxKeys !== undefined) query = query.lte('hotel_keys', filters.maxKeys);
      if (filters.minStars !== undefined) query = query.gte('hotel_star_rating', filters.minStars);
      if (filters.licenseType && filters.licenseType !== 'all') {
        query = query.eq('hotel_license_type', filters.licenseType);
      }
      if (filters.managementStatus && filters.managementStatus !== 'all' && filters.mode !== 'management') {
        query = query.eq('hotel_management_status', filters.managementStatus);
      }
      if (filters.minOccupancy !== undefined) {
        query = query.gte('hotel_occupancy_pct', filters.minOccupancy);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CommercialProperty[];
    },
    staleTime: 60_000,
  });
}
