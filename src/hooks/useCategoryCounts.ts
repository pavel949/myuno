import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { PUBLIC_CATALOG_APPROVAL_STATUS } from '@/lib/real-estate/canonicalModel';

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
  'services': 'services',
};

// Vertical name in listings table → CategoryCounts key
const VERTICAL_TO_KEY: Record<string, keyof CategoryCounts> = {
  yacht: 'yachts',
  experience: 'tours', // tours = experiences with type 'tour'
  restaurant: 'restaurants',
  bouquet: 'flowers',
  clinic: 'clinics',
  education: 'education',
  cleaning: 'cleaning',
  babysitter: 'babysitters',
  pet_service: 'pets',
  vehicle: 'yachts', // vehicles counted separately below
};

async function fetchCategoryCounts(): Promise<CategoryCounts> {
  // Single query to listings table for all verticals!
  const [listingsResult, propertiesResult, servicesResult, eventsResult, fitnessResult] = await Promise.all([
    supabase.rpc('get_listing_counts_by_vertical' as any) as any,
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('gyms').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  // Fallback: if RPC doesn't exist, query listings directly
  const verticalCounts: Record<string, number> = {};
  if (listingsResult.error || !listingsResult.data) {
    // Fallback: direct count query
    const { data } = await supabase
      .from('listings')
      .select('vertical')
      .eq('is_active', true);
    if (data) {
      for (const row of data) {
        verticalCounts[row.vertical] = (verticalCounts[row.vertical] || 0) + 1;
      }
    }
  } else {
    for (const row of listingsResult.data as any[]) {
      verticalCounts[row.vertical] = Number(row.count || row.cnt || 0);
    }
  }

  return {
    yachts: verticalCounts['yacht'] || 0,
    tours: verticalCounts['experience'] || 0,
    restaurants: verticalCounts['restaurant'] || 0,
    properties: propertiesResult.count || 0,
    services: servicesResult.count || 0,
    flowers: verticalCounts['bouquet'] || 0,
    clinics: verticalCounts['clinic'] || 0,
    fitness: fitnessResult.count || 0,
    events: eventsResult.count || 0,
    education: verticalCounts['education'] || 0,
    cleaning: verticalCounts['cleaning'] || 0,
    babysitters: verticalCounts['babysitter'] || 0,
    pets: verticalCounts['pet_service'] || 0,
  };
}

export function useCategoryCounts() {
  const query = useQuery({
    queryKey: ['category-counts'],
    queryFn: fetchCategoryCounts,
    ...CACHE_PROFILES.STATIC,
  });

  const getCount = (slugOrType: string): number | undefined => {
    if (!query.data) return undefined;
    const tableKey = CATEGORY_TABLE_MAP[slugOrType];
    if (tableKey && query.data[tableKey] !== undefined) {
      return query.data[tableKey];
    }
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

export const MINI_APP_SLUGS = new Set([
  'yachts', 'tours', 'restaurants', 'property', 'real-estate',
  'beauty', 'beauty-spa', 'fitness', 'medical', 'events',
  'education', 'kids-education', 'flowers', 'flower-delivery',
  'pharmacy', 'pets', 'transport', 'market', 'marketplace',
  'cleaning', 'water', 'babysitter',
]);

export function isMiniAppCategory(slug: string, miniAppType?: string | null): boolean {
  return MINI_APP_SLUGS.has(slug) || (miniAppType !== null && miniAppType !== undefined && MINI_APP_SLUGS.has(miniAppType));
}
