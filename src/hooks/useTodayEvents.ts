import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface TodayEvent {
  id: string;
  title_en: string;
  title_ru: string | null;
  event_date: string | null;
  event_time: string | null;
  cover_image: string | null;
  location_name: string | null;
  price: number | null;
  category: string | null;
}

export interface SmartRecommendation {
  id: string;
  type: 'tour' | 'restaurant' | 'beauty' | 'event' | 'property';
  title_en: string;
  title_ru: string | null;
  subtitle_en: string;
  subtitle_ru: string;
  cover_image: string | null;
  icon: string;
  path: string;
  rating: number | null;
  price: number | null;
}

export function useTodayEvents() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['today-events', today],
    queryFn: async (): Promise<TodayEvent[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title_en, title_ru, event_date, event_time, cover_image, location_name, price, category')
        .eq('is_active', true)
        .eq('event_date', today)
        .order('event_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    ...CACHE_PROFILES.STATIC,
  });
}

export function useSmartRecommendations() {
  return useQuery({
    queryKey: ['smart-recommendations'],
    queryFn: async (): Promise<SmartRecommendation[]> => {
      // Parallel fetch all data sources for better performance
      const [toursResult, restaurantsResult, salonsResult] = await Promise.all([
        supabase
          .from('experiences')
          .select('id, title_en, title_ru, cover_image, rating, price, duration_minutes')
          .eq('is_active', true)
          .eq('experience_type', 'tour')
          .order('rating', { ascending: false })
          .limit(2),
        supabase
          .from('restaurants')
          .select('id, name_en, name_ru, cover_image, rating, price_range')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(1),
        supabase
          .from('salons')
          .select('id, name_en, name_ru, cover_image, rating')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(1),
      ]);

      const recommendations: SmartRecommendation[] = [];

      // Process tours
      if (toursResult.data && toursResult.data.length > 0) {
        toursResult.data.forEach(tour => {
          recommendations.push({
            id: tour.id,
            type: 'tour',
            title_en: tour.title_en,
            title_ru: tour.title_ru,
            subtitle_en: tour.duration_minutes ? `${Math.round(tour.duration_minutes / 60)}h adventure` : 'Popular tour',
            subtitle_ru: tour.duration_minutes ? `${Math.round(tour.duration_minutes / 60)}ч приключения` : 'Популярный тур',
            cover_image: tour.cover_image,
            icon: '🏝️',
            path: `/tours/${tour.id}`,
            rating: tour.rating,
            price: tour.price,
          });
        });
      }

      // Process restaurants
      if (restaurantsResult.data && restaurantsResult.data.length > 0) {
        const restaurant = restaurantsResult.data[0];
        recommendations.push({
          id: restaurant.id,
          type: 'restaurant',
          title_en: restaurant.name_en,
          title_ru: restaurant.name_ru,
          subtitle_en: 'Book a table with a view',
          subtitle_ru: 'Столик с видом',
          cover_image: restaurant.cover_image,
          icon: '🌅',
          path: `/restaurants/${restaurant.id}`,
          rating: restaurant.rating,
          price: null,
        });
      }

      // Process salons
      if (salonsResult.data && salonsResult.data.length > 0) {
        const salon = salonsResult.data[0];
        recommendations.push({
          id: salon.id,
          type: 'beauty',
          title_en: salon.name_en,
          title_ru: salon.name_ru,
          subtitle_en: 'Treat yourself today',
          subtitle_ru: 'Побалуй себя',
          cover_image: salon.cover_image,
          icon: '💆',
          path: `/beauty/${salon.id}`,
          rating: salon.rating,
          price: null,
        });
      }

      // Fallback recommendations if no data
      if (recommendations.length === 0) {
        recommendations.push(
          {
            id: 'fallback-tour',
            type: 'tour',
            title_en: 'Island Hopping',
            title_ru: 'По островам',
            subtitle_en: 'Perfect weather today',
            subtitle_ru: 'Отличная погода сегодня',
            cover_image: null,
            icon: '🏝️',
            path: '/tours',
            rating: null,
            price: null,
          },
          {
            id: 'fallback-restaurant',
            type: 'restaurant',
            title_en: 'Sunset Dinner',
            title_ru: 'Ужин на закате',
            subtitle_en: 'Book a table with a view',
            subtitle_ru: 'Столик с видом',
            cover_image: null,
            icon: '🌅',
            path: '/restaurants',
            rating: null,
            price: null,
          },
          {
            id: 'fallback-spa',
            type: 'beauty',
            title_en: 'Spa Day',
            title_ru: 'День в СПА',
            subtitle_en: 'Treat yourself',
            subtitle_ru: 'Побалуй себя',
            cover_image: null,
            icon: '💆',
            path: '/beauty',
            rating: null,
            price: null,
          }
        );
      }

      return recommendations;
    },
    ...CACHE_PROFILES.SEMI_STATIC,
  });
}
