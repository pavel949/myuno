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
  available_from?: string;
  min_stay_nights?: number;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
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
        .single();

      if (error) {
        // If not found in DB, return null (component will use fallback)
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Property;
    },
    enabled: !!id,
  });
}

// Get property with linked owner data (rental terms)
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

      // Try to get linked owner property for rental terms
      const { data: ownerProperty } = await supabase
        .from('owner_properties')
        .select(`
          price_per_night,
          min_stay_nights,
          max_guests,
          deposit_amount,
          deposit_currency,
          check_in_time,
          check_out_time,
          house_rules,
          house_rules_ru,
          cancellation_policy,
          instant_booking
        `)
        .eq('marketplace_property_id', marketplacePropertyId)
        .single();

      return {
        ...property,
        rentalTerms: ownerProperty || null,
      } as Property & { rentalTerms: any };
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
