import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export function useRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    const items: RecommendedItem[] = [];

    try {
      // Fetch user's view history for personalization
      let viewedTypes: string[] = [];
      if (user) {
        const { data: historyData } = await supabase
          .from('view_history')
          .select('item_type')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(10);
        
        viewedTypes = [...new Set((historyData || []).map(h => h.item_type))];
      }

      // Fetch popular tours - increase limit to ensure we have data
      const { data: tours } = await supabase
        .from('tours')
        .select('id, title_en, title_ru, cover_image, rating, price')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(8);

      if (tours && tours.length > 0) {
        tours.forEach(tour => {
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

      // Fetch popular properties - increase limit
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, cover_image, rating, price, district')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(8);

      if (properties && properties.length > 0) {
        properties.forEach(prop => {
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

      // Fetch popular events - increase limit
      const { data: events } = await supabase
        .from('events')
        .select('id, title_en, title_ru, cover_image, rating, price, location_name')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(8);

      if (events && events.length > 0) {
        events.forEach(event => {
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

      // Fetch water activities - increase limit
      const { data: waterActivities } = await supabase
        .from('water_activities')
        .select('id, title_en, title_ru, cover_image, rating, price, location_name')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(8);

      if (waterActivities && waterActivities.length > 0) {
        waterActivities.forEach(activity => {
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
      
      // Always show at least some items (up to 12)
      setRecommendations(shuffled.slice(0, 12));
      
      // If still empty, we'll let the component handle the fallback UI
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    refetch: fetchRecommendations
  };
}
