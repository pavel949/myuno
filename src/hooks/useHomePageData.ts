/**
 * Coordinated data loading for the home page
 * Eliminates duplicate queries by centralizing featured content fetching
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { useAuth } from '@/contexts/AuthContext';

// Default fallback image for items without cover_image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';

export interface HomeItem {
  id: string;
  item_type: 'tour' | 'property' | 'event' | 'water_activity';
  title_en: string;
  title_ru: string;
  image: string;
  rating: number;
  price: number;
  location?: string;
  reason: 'history' | 'popular' | 'similar' | 'new';
}

interface FeaturedTour {
  id: string;
  title_en: string;
  title_ru: string;
  cover_image: string | null;
  rating: number | null;
  price: number | null;
}

// Fetch functions for different data types
const fetchFeaturedTours = async (): Promise<FeaturedTour[]> => {
  const { data, error } = await supabase
    .from('experiences')
    .select('id, title_en, title_ru, cover_image, rating, price')
    .eq('is_active', true)
    .eq('experience_type', 'tour')
    .order('rating', { ascending: false })
    .limit(8);
  
  if (error) throw error;
  return data || [];
};

const fetchFeaturedProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title_en, title_ru, cover_image, rating, price, district')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(8);
  
  if (error) throw error;
  return data || [];
};

const fetchFeaturedEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('id, title_en, title_ru, cover_image, rating, price, location_name')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(8);
  
  if (error) throw error;
  return data || [];
};

const fetchFeaturedWaterActivities = async () => {
  const { data, error } = await supabase
    .from('water_activities')
    .select('id, title_en, title_ru, cover_image, rating, price, location_name')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(8);
  
  if (error) throw error;
  return data || [];
};

const fetchUserViewHistory = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('view_history')
    .select('item_type')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(10);
  
  return [...new Set((data || []).map(h => h.item_type))];
};

/**
 * Hook for coordinated home page data loading
 * Uses TanStack Query for centralized caching and deduplication
 */
export function useHomePageData() {
  const { user } = useAuth();
  
  // Fetch user view history for personalization (only if logged in)
  const { data: viewedTypes = [] } = useQuery({
    queryKey: ['view-history', user?.id],
    queryFn: () => fetchUserViewHistory(user!.id),
    enabled: !!user?.id,
    ...CACHE_PROFILES.DYNAMIC,
  });

  // Parallel queries for all featured content
  const results = useQueries({
    queries: [
      {
        queryKey: ['home', 'featured-tours'],
        queryFn: fetchFeaturedTours,
        ...CACHE_PROFILES.SEMI_STATIC,
      },
      {
        queryKey: ['home', 'featured-properties'],
        queryFn: fetchFeaturedProperties,
        ...CACHE_PROFILES.SEMI_STATIC,
      },
      {
        queryKey: ['home', 'featured-events'],
        queryFn: fetchFeaturedEvents,
        ...CACHE_PROFILES.SEMI_STATIC,
      },
      {
        queryKey: ['home', 'featured-water-activities'],
        queryFn: fetchFeaturedWaterActivities,
        ...CACHE_PROFILES.SEMI_STATIC,
      },
    ],
  });

  const [toursResult, propertiesResult, eventsResult, waterActivitiesResult] = results;
  const isLoading = results.some(r => r.isLoading);

  // Transform data into unified recommendations format
  const recommendations: HomeItem[] = [];

  if (toursResult.data) {
    toursResult.data.forEach(tour => {
      recommendations.push({
        id: tour.id,
        item_type: 'tour',
        title_en: tour.title_en,
        title_ru: tour.title_ru,
        image: tour.cover_image || DEFAULT_IMAGE,
        rating: tour.rating || 0,
        price: tour.price || 0,
        reason: 'popular',
      });
    });
  }

  if (propertiesResult.data) {
    propertiesResult.data.forEach(prop => {
      recommendations.push({
        id: prop.id,
        item_type: 'property',
        title_en: prop.title_en,
        title_ru: prop.title_ru,
        image: prop.cover_image || DEFAULT_IMAGE,
        rating: prop.rating || 0,
        price: prop.price || 0,
        location: prop.district || undefined,
        reason: viewedTypes.includes('property') ? 'history' : 'popular',
      });
    });
  }

  if (eventsResult.data) {
    eventsResult.data.forEach(event => {
      recommendations.push({
        id: event.id,
        item_type: 'event',
        title_en: event.title_en,
        title_ru: event.title_ru,
        image: event.cover_image || DEFAULT_IMAGE,
        rating: event.rating || 0,
        price: event.price || 0,
        location: event.location_name || undefined,
        reason: viewedTypes.includes('event') ? 'history' : 'popular',
      });
    });
  }

  if (waterActivitiesResult.data) {
    waterActivitiesResult.data.forEach(activity => {
      recommendations.push({
        id: activity.id,
        item_type: 'water_activity',
        title_en: activity.title_en,
        title_ru: activity.title_ru,
        image: activity.cover_image || DEFAULT_IMAGE,
        rating: activity.rating || 0,
        price: activity.price || 0,
        location: activity.location_name || undefined,
        reason: viewedTypes.includes('water_activity') ? 'history' : 'popular',
      });
    });
  }

  // Shuffle and prioritize by history
  const historyItems = recommendations.filter(i => i.reason === 'history');
  const otherItems = recommendations.filter(i => i.reason !== 'history');
  const shuffledOthers = [...otherItems].sort(() => Math.random() - 0.5);
  const sortedRecommendations = [...historyItems, ...shuffledOthers].slice(0, 12);

  return {
    tours: toursResult.data || [],
    properties: propertiesResult.data || [],
    events: eventsResult.data || [],
    waterActivities: waterActivitiesResult.data || [],
    recommendations: sortedRecommendations,
    isLoading,
    isToursLoading: toursResult.isLoading,
    isPropertiesLoading: propertiesResult.isLoading,
    isEventsLoading: eventsResult.isLoading,
    isWaterActivitiesLoading: waterActivitiesResult.isLoading,
  };
}

/**
 * Simplified hook for just recommendations
 * Uses the same cached data as useHomePageData
 */
export function useOptimizedRecommendations() {
  const { recommendations, isLoading } = useHomePageData();
  
  return {
    recommendations,
    isLoading,
    refetch: () => {}, // TanStack Query handles refetching automatically
  };
}
