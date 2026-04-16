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
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorEvent>('event', providerId);
  return { events: items, isLoading, createEvent: create, updateEvent: update, deleteEvent: remove, refetch };
}
