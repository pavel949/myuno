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
import defaultFallback from '@/assets/categories/default-market.jpg';
const DEFAULT_IMAGE = defaultFallback;

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

  // Fetch tours from listings table
  const [listingsRes, propertiesRes, eventsRes, waterActivitiesRes] = await Promise.all([
    supabase
      .from('listings')
      .select('id, vertical, name_en, name_ru, cover_image, rating, price')
      .eq('is_active', true)
      .in('vertical', ['experience', 'yacht', 'restaurant'])
      .order('rating', { ascending: false })
      .limit(12),
    supabase
      .from('properties')
      .select('id, title_en, title_ru, cover_image, rating, price, district')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
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

  // Transform listings
  if (listingsRes.data && listingsRes.data.length > 0) {
    listingsRes.data.forEach(listing => {
      items.push({
        id: listing.id,
        item_type: listing.vertical || 'listing',
        title_en: listing.name_en,
        title_ru: listing.name_ru || listing.name_en,
        image: listing.cover_image || DEFAULT_IMAGE,
        rating: listing.rating || 0,
        price: listing.price || 0,
        reason: viewedTypes.includes(listing.vertical || '') ? 'history' : 'popular'
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
