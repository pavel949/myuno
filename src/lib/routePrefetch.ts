/**
 * Route prefetching utilities for faster navigation
 * Prefetches both code chunks and data when user hovers over navigation items
 */

import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { PUBLIC_CATALOG_APPROVAL_STATUS } from '@/lib/real-estate/canonicalModel';

// Route to module mapping for code prefetching
const routeModules: Record<string, () => Promise<unknown>> = {
  '/yachts': () => import('@/pages/yachts/YachtsIndex'),
  '/tours': () => import('@/pages/experiences/ExperiencesIndex'),
  '/property': () => import('@/pages/property/PropertyIndex'),
  '/transport': () => import('@/pages/transport/TransportIndex'),
  '/flowers': () => import('@/pages/flowers/FlowersIndex'),
  '/water': () => import('@/pages/experiences/ExperiencesIndex'),
  '/experiences': () => import('@/pages/experiences/ExperiencesIndex'),
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

// Helper to prefetch from listings table by vertical
const prefetchListings = (qc: QueryClient, vertical: string, queryKey: string[], limit = 12) => {
  qc.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('vertical', vertical)
        .eq('is_active', true)
        .eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS)
        .order('rating', { ascending: false })
        .limit(limit);
      return data || [];
    },
    ...CACHE_PROFILES.SEMI_STATIC,
  });
};

// Route to data query mapping
const routeDataQueries: Record<string, (queryClient: QueryClient) => void> = {
  '/yachts': (qc) => prefetchListings(qc, 'yacht', ['yachts', 'featured']),
  '/tours': (qc) => prefetchListings(qc, 'experience', ['tours', 'all', undefined as any, undefined as any], 20),
  '/transport': (qc) => prefetchListings(qc, 'vehicle', ['vehicles', 'all'], 20),
  '/restaurants': (qc) => prefetchListings(qc, 'restaurant', ['restaurants', 'featured']),
  '/property': (qc) => {
    qc.prefetchQuery({
      queryKey: ['properties', 'featured'],
      queryFn: async () => {
        const { data } = await supabase
          .from('properties')
          .select('id, title_en, title_ru, cover_image, rating, price, district')
          .eq('is_active', true)
          .eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS)
          .order('rating', { ascending: false })
          .limit(12);
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
};

// Track prefetched routes to avoid duplicate prefetches
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch both code and data for a route
 */
export function prefetchRoute(path: string, queryClient?: QueryClient) {
  const normalizedPath = path.split('?')[0];
  if (prefetchedRoutes.has(normalizedPath)) return;
  prefetchedRoutes.add(normalizedPath);
  
  const moduleLoader = routeModules[normalizedPath];
  if (moduleLoader) {
    moduleLoader().catch(() => { prefetchedRoutes.delete(normalizedPath); });
  }
  
  if (queryClient) {
    const dataQuery = routeDataQueries[normalizedPath];
    if (dataQuery) dataQuery(queryClient);
  }
}

export function clearPrefetchCache() {
  prefetchedRoutes.clear();
}
