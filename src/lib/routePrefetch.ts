/**
 * Route prefetching utilities for faster navigation
 * Prefetches both code chunks and data when user hovers over navigation items
 */

import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

// Route to module mapping for code prefetching
const routeModules: Record<string, () => Promise<unknown>> = {
  '/yachts': () => import('@/pages/yachts/YachtsIndex'),
  '/tours': () => import('@/pages/tours/ToursIndex'),
  '/property': () => import('@/pages/property/PropertyIndex'),
  '/transport': () => import('@/pages/transport/TransportIndex'),
  '/flowers': () => import('@/pages/flowers/FlowersIndex'),
  '/water': () => import('@/pages/water/WaterActivitiesIndex'),
  '/events': () => import('@/pages/events/EventsIndex'),
  '/restaurants': () => import('@/pages/restaurants/RestaurantsIndex'),
  '/beauty': () => import('@/pages/beauty/BeautySpaIndex'),
  '/medical': () => import('@/pages/medical/MedicalIndex'),
  '/market': () => import('@/pages/market/MarketIndex'),
  '/fitness': () => import('@/pages/fitness/FitnessIndex'),
  '/education': () => import('@/pages/education/EducationIndex'),
  '/services': () => import('@/pages/services/ServicesIndex'),
  '/legal': () => import('@/pages/legal/LegalServicesIndex'),
  '/insurance': () => import('@/pages/insurance/InsuranceIndex'),
};

// Route to data query mapping
const routeDataQueries: Record<string, (queryClient: QueryClient) => void> = {
  '/yachts': (qc) => {
    qc.prefetchQuery({
      queryKey: ['yachts', 'featured'],
      queryFn: async () => {
        const { data } = await supabase
          .from('yachts')
          .select('id, name_en, name_ru, cover_image, rating, price_per_day')
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('rating', { ascending: false })
          .limit(12);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  },
  '/tours': (qc) => {
    qc.prefetchQuery({
      queryKey: ['tours', 'all', undefined, undefined],
      queryFn: async () => {
        const { data } = await supabase
          .from('tours')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(20);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  },
  '/property': (qc) => {
    qc.prefetchQuery({
      queryKey: ['properties', 'featured'],
      queryFn: async () => {
        const { data } = await supabase
          .from('properties')
          .select('id, title_en, title_ru, cover_image, rating, price, district')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(12);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  },
  '/transport': (qc) => {
    qc.prefetchQuery({
      queryKey: ['vehicles', 'all'],
      queryFn: async () => {
        const { data } = await supabase
          .from('vehicles')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .limit(20);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  },
  '/flowers': (qc) => {
    qc.prefetchQuery({
      queryKey: ['flower-shops', 'featured'],
      queryFn: async () => {
        const { data } = await supabase
          .from('flower_shops')
          .select('id, name_en, name_ru, cover_image, rating')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(12);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  },
  '/water': (qc) => {
    qc.prefetchQuery({
      queryKey: ['water_activities', { is_active: true }],
      queryFn: async () => {
        const { data } = await supabase
          .from('water_activities')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(20);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  },
  '/events': (qc) => {
    qc.prefetchQuery({
      queryKey: ['events', 'upcoming'],
      queryFn: async () => {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(20);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  },
  '/restaurants': (qc) => {
    qc.prefetchQuery({
      queryKey: ['restaurants', 'featured'],
      queryFn: async () => {
        const { data } = await supabase
          .from('restaurants')
          .select('id, name_en, name_ru, cover_image, rating, price_range')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(12);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  },
};

// Track prefetched routes to avoid duplicate prefetches
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch both code and data for a route
 * Call this on mouseEnter/touchStart for navigation items
 */
export function prefetchRoute(path: string, queryClient?: QueryClient) {
  // Normalize path
  const normalizedPath = path.split('?')[0];
  
  // Check if already prefetched in this session
  if (prefetchedRoutes.has(normalizedPath)) {
    return;
  }
  
  prefetchedRoutes.add(normalizedPath);
  
  // Prefetch code chunk
  const moduleLoader = routeModules[normalizedPath];
  if (moduleLoader) {
    moduleLoader().catch(() => {
      // Ignore prefetch errors silently
      prefetchedRoutes.delete(normalizedPath);
    });
  }
  
  // Prefetch data if queryClient is provided
  if (queryClient) {
    const dataQuery = routeDataQueries[normalizedPath];
    if (dataQuery) {
      dataQuery(queryClient);
    }
  }
}

/**
 * Clear prefetch cache (useful for testing or forced refresh)
 */
export function clearPrefetchCache() {
  prefetchedRoutes.clear();
}
