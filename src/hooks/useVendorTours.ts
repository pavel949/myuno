import { useSupabaseCRUD } from './useSupabaseCRUD';
import { Json } from '@/integrations/supabase/types';

export interface VendorTour {
  id: string;
  provider_id?: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category?: string;
  difficulty?: string;
  duration_hours?: number;
  price?: number;
  currency?: string;
  max_participants?: number;
  meeting_point?: string;
  meeting_point_lat?: number;
  meeting_point_lng?: number;
  includes?: string[];
  excludes?: string[];
  highlights?: string[];
  itinerary?: Json;
  cover_image?: string;
  images?: string[];
  available_days?: string[];
  start_times?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorTours(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorTour>({
    table: 'tours',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
  });

  return {
    tours: items,
    isLoading,
    createTour: async (tourData: Partial<VendorTour>) => create(tourData),
    updateTour: async (tourId: string, updates: Partial<VendorTour>) => update(tourId, updates),
    deleteTour: async (tourId: string) => remove(tourId),
    refetch,
  };
}
