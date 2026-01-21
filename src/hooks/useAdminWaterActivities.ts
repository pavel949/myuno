import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface AdminWaterActivity {
  id: string;
  provider_id: string | null;
  title_en: string;
  title_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string;
  cover_image: string | null;
  images: string[];
  price: number | null;
  price_per: string;
  currency: string;
  duration_minutes: number | null;
  max_participants: number;
  min_participants: number;
  difficulty: string;
  equipment_included: boolean;
  includes: string[];
  requirements: string[];
  location_name: string | null;
  meeting_point: string | null;
  meeting_point_lat: number | null;
  meeting_point_lng: number | null;
  available_times: string[];
  available_days: string[];
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_certified: boolean;
  certification_details: string | null;
  safety_briefing_required: boolean;
  age_restriction: number;
  created_at?: string;
  updated_at?: string;
}

export const useAdminWaterActivities = (providerId?: string) => {
  const { items, isLoading, error, create, update, remove, refetch } = useSupabaseCRUD<AdminWaterActivity>({
    table: 'water_activities',
    providerId,
    orderByColumn: 'title_en',
    orderAscending: true,
    showToasts: true,
  });

  return {
    activities: items,
    isLoading,
    error,
    createActivity: create,
    updateActivity: update,
    deleteActivity: remove,
    refetch,
  };
};
