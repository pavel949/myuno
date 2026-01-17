import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorActivity {
  id: string;
  provider_id?: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category: string;
  difficulty?: string;
  duration_minutes?: number;
  price?: number;
  price_per?: string;
  currency?: string;
  min_participants?: number;
  max_participants?: number;
  age_restriction?: number;
  meeting_point?: string;
  meeting_point_lat?: number;
  meeting_point_lng?: number;
  location_name?: string;
  includes?: string[];
  requirements?: string[];
  equipment_included?: boolean;
  is_certified?: boolean;
  certification_details?: string;
  safety_briefing_required?: boolean;
  cover_image?: string;
  images?: string[];
  available_days?: string[];
  available_times?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorActivities(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorActivity>({
    table: 'water_activities',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
  });

  return {
    activities: items,
    isLoading,
    createActivity: async (activityData: Partial<VendorActivity>) => create(activityData),
    updateActivity: async (activityId: string, updates: Partial<VendorActivity>) => update(activityId, updates),
    deleteActivity: async (activityId: string) => remove(activityId),
    refetch,
  };
}
