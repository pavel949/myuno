import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';

interface RecommendedItem {
  id: string;
  item_type: string;
  title_en: string;
  title_ru: string;
  image: string;
  rating: number;
  price: number;
  location?: string;
  reason: 'history' | 'popular' | 'similar' | 'new';
}

// Default fallback image for items without cover_image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';

// Fetch function for recommendations
const fetchRecommendations = async (userId?: string): Promise<RecommendedItem[]> => {
  const items: RecommendedItem[] = [];

  // Fetch user's view history for personalization
  let viewedTypes: string[] = [];
  if (userId) {
    const { data: historyData } = await supabase
      .from('view_history')
      .select('item_type')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(10);
    
    viewedTypes = [...new Set((historyData || []).map(h => h.item_type))];
  }

  // Parallel fetch all data sources
  const [toursRes, propertiesRes, eventsRes, waterActivitiesRes] = await Promise.all([
    supabase
      .from('tours')
      .select('id, title_en, title_ru, cover_image, rating, price')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(8),
    supabase
      .from('properties')
      .select('id, title_en, title_ru, cover_image, rating, price, district')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(8),
    supabase
      .from('events')
      .select('id, title_en, title_ru, cover_image, rating, price, location_name')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(8),
    supabase
      .from('water_activities')
      .select('id, title_en, title_ru, cover_image, rating, price, location_name')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(8),
  ]);

  // Transform tours
  if (toursRes.data && toursRes.data.length > 0) {
    toursRes.data.forEach(tour => {
      items.push({
        id: tour.id,
        item_type: 'tour',
        title_en: tour.title_en,
        title_ru: tour.title_ru,
        image: tour.cover_image || DEFAULT_IMAGE,
        rating: tour.rating || 0,
        price: tour.price || 0,
        reason: 'popular'
      });
    });
  }

  // Transform properties
  if (propertiesRes.data && propertiesRes.data.length > 0) {
    propertiesRes.data.forEach(prop => {
      items.push({
        id: prop.id,
        item_type: 'property',
        title_en: prop.title_en,
        title_ru: prop.title_ru,
        image: prop.cover_image || DEFAULT_IMAGE,
        rating: prop.rating || 0,
        price: prop.price || 0,
        location: prop.district || undefined,
        reason: viewedTypes.includes('property') ? 'history' : 'popular'
      });
    });
  }

  // Transform events
  if (eventsRes.data && eventsRes.data.length > 0) {
    eventsRes.data.forEach(event => {
      items.push({
        id: event.id,
        item_type: 'event',
        title_en: event.title_en,
        title_ru: event.title_ru,
        image: event.cover_image || DEFAULT_IMAGE,
        rating: event.rating || 0,
        price: event.price || 0,
        location: event.location_name || undefined,
        reason: viewedTypes.includes('event') ? 'history' : 'popular'
      });
    });
  }

  // Transform water activities
  if (waterActivitiesRes.data && waterActivitiesRes.data.length > 0) {
    waterActivitiesRes.data.forEach(activity => {
      items.push({
        id: activity.id,
        item_type: 'water_activity',
        title_en: activity.title_en,
        title_ru: activity.title_ru,
        image: activity.cover_image || DEFAULT_IMAGE,
        rating: activity.rating || 0,
        price: activity.price || 0,
        location: activity.location_name || undefined,
        reason: viewedTypes.includes('water_activity') ? 'history' : 'popular'
      });
    });
  }

  // Shuffle and prioritize by history
  const historyItems = items.filter(i => i.reason === 'history');
  const otherItems = items.filter(i => i.reason !== 'history');
  
  // Shuffle other items
  const shuffled = [...historyItems, ...otherItems.sort(() => Math.random() - 0.5)];
  
  return shuffled.slice(0, 12);
};

export function useRecommendations() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recommendations', user?.id || 'anonymous'],
    queryFn: () => fetchRecommendations(user?.id),
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return {
    recommendations: data || [],
    isLoading,
    refetch
  };
}
