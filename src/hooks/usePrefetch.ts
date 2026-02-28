import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES, PREFETCH_ROUTES, queryKeys } from '@/lib/queryConfig';

/**
 * Smart prefetching hook that loads popular data during idle time
 * Uses requestIdleCallback for non-blocking prefetching
 * 
 * NOTE: Cities are NOT prefetched here because they are already
 * fetched by LocationContext on app mount. This prevents duplicate requests.
 */
export function usePrefetchPopularData() {
  const queryClient = useQueryClient();

  const prefetchCategories = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.categories.groups,
      queryFn: async () => {
        const { data } = await supabase
          .from('category_groups')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        return data || [];
      },
      ...CACHE_PROFILES.STATIC,
    });

    await queryClient.prefetchQuery({
      queryKey: queryKeys.categories.all,
      queryFn: async () => {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        return data || [];
      },
      ...CACHE_PROFILES.STATIC,
    });
  }, [queryClient]);

  const prefetchFeaturedContent = useCallback(async () => {
    // Prefetch featured listings (restaurants, tours from unified table)
    await queryClient.prefetchQuery({
      queryKey: ['listings', 'featured-prefetch'],
      queryFn: async () => {
        const { data } = await supabase
          .from('listings')
          .select('id, vertical, name_en, name_ru, cover_image, rating, price')
          .eq('is_active', true)
          .eq('is_featured', true)
          .in('vertical', ['restaurant', 'experience', 'yacht'])
          .limit(18);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });

    // Prefetch featured properties (separate table)
    await queryClient.prefetchQuery({
      queryKey: ['properties', { featured: true }],
      queryFn: async () => {
        const { data } = await supabase
          .from('properties')
          .select('id, title_en, title_ru, images, price, rating, district')
          .eq('is_active', true)
          .eq('is_featured', true)
          .limit(6);
        return data || [];
      },
      ...CACHE_PROFILES.SEMI_STATIC,
    });
  }, [queryClient]);

  // Removed prefetchCities - now handled by LocationContext via useCities hook
  // which uses React Query with shared cache key ['cities']

  // Use requestIdleCallback for non-blocking prefetch
  const scheduleIdlePrefetch = useCallback(() => {
    const doIdlePrefetch = (callback: () => void): number => {
      if ('requestIdleCallback' in window) {
        return (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(callback, { timeout: 2000 });
      }
      // Fallback for Safari
      return setTimeout(callback, 100) as unknown as number;
    };

    const cancelIdlePrefetch = (id: number) => {
      if ('cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };

    // Schedule prefetching in sequence during idle time
    const idleId = doIdlePrefetch(async () => {
      try {
        await prefetchCategories();
        await prefetchFeaturedContent();
      } catch (error) {
        // Silently fail - prefetching is optional
        console.debug('Prefetch failed:', error);
      }
    });

    return () => cancelIdlePrefetch(idleId);
  }, [prefetchCategories, prefetchFeaturedContent]);

  // Schedule on mount
  scheduleIdlePrefetch();
}

/**
 * Prefetch data for a specific route before navigation
 */
export function usePrefetchRoute() {
  const queryClient = useQueryClient();

  const prefetchRoute = useCallback(async (path: string) => {
    // Only prefetch known routes
    if (!PREFETCH_ROUTES.includes(path as typeof PREFETCH_ROUTES[number])) {
      return;
    }

    switch (path) {
      case '/properties':
        await queryClient.prefetchQuery({
          queryKey: ['properties', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('properties')
              .select('*')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;

      case '/restaurants':
        await queryClient.prefetchQuery({
          queryKey: ['restaurants', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('listings')
              .select('*')
              .eq('vertical', 'restaurant')
              .eq('is_active', true)
              .order('rating', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;

      case '/tours':
        await queryClient.prefetchQuery({
          queryKey: ['tours', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('listings')
              .select('*')
              .eq('vertical', 'experience')
              .eq('is_active', true)
              .order('rating', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;

      case '/beauty':
        await queryClient.prefetchQuery({
          queryKey: ['salons', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('salons')
              .select('*')
              .eq('is_active', true)
              .order('rating', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;

      case '/flowers':
        await queryClient.prefetchQuery({
          queryKey: ['flower-shops', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('flower_shops')
              .select('*')
              .eq('is_active', true)
              .order('rating', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;
    }
  }, [queryClient]);

  return { prefetchRoute };
}
