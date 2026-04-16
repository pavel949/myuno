import { useVerticalCRUD } from './useVerticalCRUD';
import { Json } from '@/integrations/supabase/types';
import { ExperienceType, BookingModel } from './useExperiences';

export interface VendorExperience {
  id: string;
  provider_id?: string;
  experience_type: ExperienceType;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category?: string;
  difficulty?: string;
  duration_minutes?: number;
  price?: number;
  price_per?: string;
  currency?: string;
  min_participants?: number;
  max_participants?: number;
  meeting_point?: string;
  meeting_point_lat?: number;
  meeting_point_lng?: number;
  location_name?: string;
  includes?: Json;
  excludes?: Json;
  highlights?: Json;
  requirements?: Json;
  itinerary?: Json;
  cover_image?: string;
  images?: string[];
  available_days?: string[];
  start_times?: string[];
  tags?: string[];
  equipment_included?: boolean;
  is_certified?: boolean;
  certification_details?: string;
  safety_briefing_required?: boolean;
  age_restriction?: number;
  is_active?: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  approval_status?: string;
  external_link?: string;
  booking_model?: BookingModel;
  created_at: string;
  updated_at: string;
}

export function useVendorExperiences(providerId?: string, experienceType?: ExperienceType | 'all') {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorExperience>('experience', providerId);

  const filteredItems = experienceType && experienceType !== 'all'
    ? items.filter(item => item.experience_type === experienceType)
    : items;

  return {
    experiences: filteredItems,
    isLoading,
    createExperience: async (data: Partial<VendorExperience>) => create({
      ...data,
      experience_type: data.experience_type || 'tour',
      is_active: data.is_active ?? true,
      approval_status: 'pending',
    }),
    updateExperience: update,
    deleteExperience: remove,
    refetch,
  };
}
