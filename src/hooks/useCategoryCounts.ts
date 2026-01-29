import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface CategoryCounts {
  yachts: number;
  tours: number;
  restaurants: number;
  properties: number;
  services: number;
  flowers: number;
  clinics: number;
  fitness: number;
  events: number;
  education: number;
  cleaning: number;
  babysitters: number;
  pets: number;
}

// Mapping from category slug/mini_app_type to database table
const CATEGORY_TABLE_MAP: Record<string, keyof CategoryCounts> = {
  'yachts': 'yachts',
  'yacht': 'yachts',
  'tours': 'tours',
  'tour': 'tours',
  'restaurants': 'restaurants',
  'food': 'restaurants',
  'property': 'properties',
  'real-estate': 'properties',
  'flowers': 'flowers',
  'flower-delivery': 'flowers',
  'medical': 'clinics',
  'clinic': 'clinics',
  'fitness': 'fitness',
  'gym': 'fitness',
  'events': 'events',
  'event': 'events',
  'education': 'education',
  'kids': 'education',
  'kids-education': 'education',
  'cleaning': 'cleaning',
  'laundry': 'cleaning',
  'babysitter': 'babysitters',
  'babysitters': 'babysitters',
  'pets': 'pets',
  'pet': 'pets',
  'services': 'services',
};

async function fetchCategoryCounts(): Promise<CategoryCounts> {
  // Run all queries in parallel for maximum efficiency
  const [
    yachtsResult,
    toursResult,
    restaurantsResult,
    propertiesResult,
    servicesResult,
    flowersResult,
    clinicsResult,
    fitnessResult,
    eventsResult,
    educationResult,
    cleaningResult,
    babysittersResult,
    petsResult,
  ] = await Promise.all([
    supabase.from('yachts').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('tours').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bouquets').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('gyms').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('education_providers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('cleaning_services').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('babysitters').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('pet_services').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  return {
    yachts: yachtsResult.count || 0,
    tours: toursResult.count || 0,
    restaurants: restaurantsResult.count || 0,
    properties: propertiesResult.count || 0,
    services: servicesResult.count || 0,
    flowers: flowersResult.count || 0,
    clinics: clinicsResult.count || 0,
    fitness: fitnessResult.count || 0,
    events: eventsResult.count || 0,
    education: educationResult.count || 0,
    cleaning: cleaningResult.count || 0,
    babysitters: babysittersResult.count || 0,
    pets: petsResult.count || 0,
  };
}

export function useCategoryCounts() {
  const query = useQuery({
    queryKey: ['category-counts'],
    queryFn: fetchCategoryCounts,
    ...CACHE_PROFILES.STATIC, // Cache for longer since counts don't change often
  });

  // Get count for a specific category by slug or mini_app_type
  const getCount = (slugOrType: string): number | undefined => {
    if (!query.data) return undefined;
    
    const tableKey = CATEGORY_TABLE_MAP[slugOrType];
    if (tableKey && query.data[tableKey] !== undefined) {
      return query.data[tableKey];
    }
    
    // For services, return total services count
    if (slugOrType === 'services' || slugOrType === 'home-services') {
      return query.data.services;
    }
    
    return undefined;
  };

  return {
    counts: query.data,
    isLoading: query.isLoading,
    error: query.error,
    getCount,
  };
}

// Mini-app category slugs - categories with full booking flow
export const MINI_APP_SLUGS = new Set([
  'yachts',
  'tours',
  'restaurants',
  'property',
  'real-estate',
  'beauty',
  'beauty-spa',
  'fitness',
  'medical',
  'events',
  'education',
  'kids-education',
  'flowers',
  'flower-delivery',
  'pharmacy',
  'pets',
  'transport',
  'market',
  'marketplace',
  'cleaning',
  'water',
  'babysitter',
]);

// Check if a category slug represents a mini-app
export function isMiniAppCategory(slug: string, miniAppType?: string | null): boolean {
  return MINI_APP_SLUGS.has(slug) || (miniAppType !== null && miniAppType !== undefined && MINI_APP_SLUGS.has(miniAppType));
}
