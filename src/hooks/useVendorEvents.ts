import { useVerticalCRUD } from './useVerticalCRUD';
import { Json } from '@/integrations/supabase/types';

export interface VendorEvent {
  id: string;
  provider_id?: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category?: string;
  event_date?: string;
  event_time?: string;
  duration_hours?: number;
  price?: number;
  original_price?: number;
  currency?: string;
  max_spots?: number;
  spots_left?: number;
  location_name?: string;
  location_ru?: string;
  address?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  images?: string[];
  includes?: Json;
  excludes?: Json;
  itinerary?: Json;
  is_active?: boolean;
  is_featured?: boolean;
  is_hot?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorEvents(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorEvent>('event', providerId, {
    select: 'id,provider_id,title_en,title_ru,description_en,description_ru,category,event_date,event_time,duration_hours,price,original_price,currency,max_spots,spots_left,location_name,location_ru,address,lat,lng,cover_image,images,includes,excludes,itinerary,is_active,is_featured,is_hot,rating,review_count,created_at,updated_at',
  });

  return {
    events: items,
    isLoading,
    createEvent: async (data: Partial<VendorEvent>) => create(data),
    updateEvent: async (id: string, updates: Partial<VendorEvent>) => update(id, updates),
    deleteEvent: async (id: string) => remove(id),
    refetch,
  };
}
