import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Property {
  id: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  property_type: string;
  listing_type: string;
  price?: number;
  price_period?: string;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  max_guests?: number;
  amenities?: string[];
  images?: string[];
  cover_image?: string;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  instant_booking?: boolean;
  available_from?: string;
  min_stay_nights?: number;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
  // Unit-specific fields
  project_id?: string;
  floor?: number;
  unit_number?: string;
  view_type?: string;
  furnishing_level?: string;
  equipment?: string[];
  // Quick filter fields
  highlights?: string[];
  monthly_discount?: number;
  weekly_discount?: number;
}

export interface PropertyProject {
  id: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  developer_name?: string;
  year_built?: number;
  total_units?: number;
  cover_image?: string;
  images?: string[];
  video_url?: string;
  amenities?: string[];
  infrastructure?: string[];
}

export interface PropertyRentalTerms {
  price_per_night?: number;
  min_stay_nights?: number;
  max_guests?: number;
  deposit_amount?: number;
  deposit_currency?: string;
  deposit_type?: string;
  check_in_time?: string;
  check_out_time?: string;
  house_rules?: string;
  house_rules_ru?: string;
  cancellation_policy?: string;
  instant_booking?: boolean;
  weekly_discount?: number;
  monthly_discount?: number;
  seasonal_pricing?: Record<string, unknown>;
  electricity_included?: boolean;
  electricity_unit_price?: number;
  electricity_provider?: string;
  electricity_metering?: string;
  electricity_notes?: string;
  electricity_notes_ru?: string;
  water_included?: boolean;
  water_unit_price?: number;
  water_notes?: string;
  water_notes_ru?: string;
  included_services?: string[] | string;
  extra_services?: Array<{ id: string; price: number; currency: string }> | string;
  cleaning_included?: boolean;
  cleaning_frequency?: string;
  extra_cleaning_price?: number;
  linen_change_price?: number;
  linen_change_frequency?: string;
  early_checkin_price?: number;
  late_checkout_price?: number;
  late_checkout_penalty?: number;
  key_handover?: string;
  check_in_instructions?: string;
  check_in_instructions_ru?: string;
  transfer_available?: boolean;
  transfer_airport_price?: number;
  transfer_notes?: string;
  transfer_notes_ru?: string;
  extra_guest_price?: number;
  extra_guest_threshold?: number;
  internet_speed?: string;
  internet_provider?: string;
  manager_name?: string;
  manager_phone?: string;
  manager_line_id?: string;
  parking_included?: boolean;
  parking_spaces?: number;
  parking_notes?: string;
  pets_allowed?: boolean;
  pet_deposit?: number;
  pet_notes?: string;
  pet_notes_ru?: string;
  parties_allowed?: boolean;
  max_party_guests?: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  children_friendly?: boolean;
  has_crib?: boolean;
  has_high_chair?: boolean;
  smoking_penalty?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  host_languages?: string[];
}

export interface PropertyFilters {
  search?: string;
  propertyType?: string;
  listingType?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  amenities?: string[];
}

const PAGE_SIZE = 20;

// Fetch properties with pagination for infinite scroll
export function usePropertiesInfinite(filters: PropertyFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['properties-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      // Apply filters
      if (filters.search) {
        query = query.or(`title_en.ilike.%${filters.search}%,title_ru.ilike.%${filters.search}%`);
      }
      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.listingType && filters.listingType !== 'all') {
        query = query.eq('listing_type', filters.listingType);
      }
      if (filters.district) {
        query = query.eq('district', filters.district);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.bedrooms) {
        if (filters.bedrooms === '4+') {
          query = query.gte('bedrooms', 4);
        } else if (filters.bedrooms === 'studio') {
          query = query.eq('bedrooms', 0);
        } else {
          query = query.eq('bedrooms', parseInt(filters.bedrooms));
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return {
        properties: (data || []) as Property[],
        nextPage: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

// Fetch all properties (for simpler use cases with limit)
export function useProperties(filters: PropertyFilters = {}, limit = 50) {
  return useQuery({
    queryKey: ['properties', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters.search) {
        query = query.or(`title_en.ilike.%${filters.search}%,title_ru.ilike.%${filters.search}%`);
      }
      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.listingType && filters.listingType !== 'all') {
        query = query.eq('listing_type', filters.listingType);
      }
      if (filters.district) {
        query = query.eq('district', filters.district);
      }
      if (filters.bedrooms) {
        if (filters.bedrooms === '4+') {
          query = query.gte('bedrooms', 4);
        } else if (filters.bedrooms === 'studio') {
          query = query.eq('bedrooms', 0);
        } else {
          query = query.eq('bedrooms', parseInt(filters.bedrooms));
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Property[];
    },
  });
}

// Fetch single property by ID
export function useProperty(id?: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Property | null;
    },
    enabled: !!id,
  });
}

// Get property with linked owner data (rental terms) and project info
export function usePropertyWithRentalTerms(marketplacePropertyId?: string) {
  return useQuery({
    queryKey: ['property-with-terms', marketplacePropertyId],
    queryFn: async () => {
      if (!marketplacePropertyId) return null;

      // Get property from marketplace
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', marketplacePropertyId)
        .single();

      if (propError) {
        if (propError.code === 'PGRST116') return null;
        throw propError;
      }

      // Get project info if property has project_id
      let projectData: PropertyProject | null = null;
      if (property.project_id) {
        const { data: project } = await supabase
          .from('property_projects')
          .select('*')
          .eq('id', property.project_id)
          .single();
        projectData = project as PropertyProject | null;
      }

      // Try to get linked owner property for rental terms (all extended fields)
      const { data: ownerProperty } = await supabase
        .from('owner_properties')
        .select(`
          price_per_night,
          min_stay_nights,
          max_guests,
          deposit_amount,
          deposit_currency,
          deposit_type,
          check_in_time,
          check_out_time,
          house_rules,
          house_rules_ru,
          cancellation_policy,
          instant_booking,
          weekly_discount,
          monthly_discount,
          seasonal_pricing,
          electricity_included,
          electricity_unit_price,
          electricity_provider,
          electricity_metering,
          electricity_notes,
          electricity_notes_ru,
          water_included,
          water_unit_price,
          water_notes,
          water_notes_ru,
          included_services,
          extra_services,
          cleaning_included,
          cleaning_frequency,
          extra_cleaning_price,
          linen_change_price,
          linen_change_frequency,
          early_checkin_price,
          late_checkout_price,
          late_checkout_penalty,
          key_handover,
          check_in_instructions,
          check_in_instructions_ru,
          transfer_available,
          transfer_airport_price,
          transfer_notes,
          transfer_notes_ru,
          extra_guest_price,
          extra_guest_threshold,
          internet_speed,
          internet_provider,
          manager_name,
          manager_phone,
          manager_line_id,
          parking_included,
          parking_spaces,
          parking_notes,
          pets_allowed,
          pet_deposit,
          pet_notes,
          pet_notes_ru,
          parties_allowed,
          max_party_guests,
          quiet_hours_start,
          quiet_hours_end,
          children_friendly,
          has_crib,
          has_high_chair,
          smoking_penalty,
          emergency_contact_name,
          emergency_contact_phone,
          host_languages
        `)
        .eq('marketplace_property_id', marketplacePropertyId)
        .single();

      return {
        ...property,
        rentalTerms: ownerProperty || null,
        project: projectData,
      } as Property & { rentalTerms: PropertyRentalTerms | null; project: PropertyProject | null };
    },
    enabled: !!marketplacePropertyId,
  });
}

// Featured properties for homepage
export function useFeaturedProperties(limit = 6) {
  return useQuery({
    queryKey: ['featured-properties', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Property[];
    },
  });
}

// Instant booking properties
export function useInstantBookingProperties(limit = 10) {
  return useQuery({
    queryKey: ['instant-booking-properties', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .eq('instant_booking', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Property[];
    },
  });
}

// Count properties for stats
export function usePropertiesCount(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties-count', filters],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.listingType && filters.listingType !== 'all') {
        query = query.eq('listing_type', filters.listingType);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });
}

// Fetch properties by project ID
export function usePropertiesByProject(projectId?: string, limit = 20) {
  return useQuery({
    queryKey: ['properties-by-project', projectId, limit],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('price', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Property[];
    },
    enabled: !!projectId,
  });
}

// Get project statistics (units count, price ranges by bedroom type)
export function useProjectStats(projectId?: string) {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('properties')
        .select('id, bedrooms, price')
        .eq('project_id', projectId)
        .eq('is_active', true);

      if (error) throw error;

      const properties = data || [];
      
      const stats = {
        total: properties.length,
        byBedrooms: {} as Record<string, { count: number; minPrice: number | null; maxPrice: number | null }>,
      };

      properties.forEach(p => {
        const key = p.bedrooms === 0 ? 'studio' : `${p.bedrooms}br`;
        if (!stats.byBedrooms[key]) {
          stats.byBedrooms[key] = { count: 0, minPrice: null, maxPrice: null };
        }
        stats.byBedrooms[key].count++;
        if (p.price) {
          if (!stats.byBedrooms[key].minPrice || p.price < stats.byBedrooms[key].minPrice!) {
            stats.byBedrooms[key].minPrice = p.price;
          }
          if (!stats.byBedrooms[key].maxPrice || p.price > stats.byBedrooms[key].maxPrice!) {
            stats.byBedrooms[key].maxPrice = p.price;
          }
        }
      });

      return stats;
    },
    enabled: !!projectId,
  });
}
