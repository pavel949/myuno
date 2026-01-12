import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewHistory } from './useViewHistory';

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

export function useRecommendations() {
  const { user } = useAuth();
  const { history } = useViewHistory();
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const historyRef = useRef(history);

  // Update ref when history changes
  historyRef.current = history;

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    const items: RecommendedItem[] = [];
    const viewedTypes = [...new Set(historyRef.current.slice(0, 10).map(h => h.item_type))];

    try {
      // Fetch popular tours
      const { data: tours } = await supabase
        .from('tours')
        .select('id, title_en, title_ru, cover_image, rating, price')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(5);

      if (tours) {
        tours.forEach(tour => {
          items.push({
            id: tour.id,
            item_type: 'tour',
            title_en: tour.title_en,
            title_ru: tour.title_ru,
            image: tour.cover_image || '',
            rating: tour.rating || 0,
            price: tour.price || 0,
            reason: 'popular'
          });
        });
      }

      // Fetch popular properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, cover_image, rating, price, district')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(5);

      if (properties) {
        properties.forEach(prop => {
          items.push({
            id: prop.id,
            item_type: 'property',
            title_en: prop.title_en,
            title_ru: prop.title_ru,
            image: prop.cover_image || '',
            rating: prop.rating || 0,
            price: prop.price || 0,
            location: prop.district || undefined,
            reason: viewedTypes.includes('property') ? 'history' : 'popular'
          });
        });
      }

      // Fetch popular events
      const { data: events } = await supabase
        .from('events')
        .select('id, title_en, title_ru, cover_image, rating, price, location_name')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(5);

      if (events) {
        events.forEach(event => {
          items.push({
            id: event.id,
            item_type: 'event',
            title_en: event.title_en,
            title_ru: event.title_ru,
            image: event.cover_image || '',
            rating: event.rating || 0,
            price: event.price || 0,
            location: event.location_name || undefined,
            reason: viewedTypes.includes('event') ? 'history' : 'popular'
          });
        });
      }

      // Fetch water activities
      const { data: waterActivities } = await supabase
        .from('water_activities')
        .select('id, title_en, title_ru, cover_image, rating, price, location_name')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(5);

      if (waterActivities) {
        waterActivities.forEach(activity => {
          items.push({
            id: activity.id,
            item_type: 'water_activity',
            title_en: activity.title_en,
            title_ru: activity.title_ru,
            image: activity.cover_image || '',
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
      
      // Shuffle
      const shuffled = [...historyItems, ...otherItems.sort(() => Math.random() - 0.5)];
      
      setRecommendations(shuffled.slice(0, 12));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch once on mount to avoid infinite loops
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    refetch: fetchRecommendations
  };
}
