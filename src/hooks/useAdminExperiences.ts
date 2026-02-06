import { useSupabaseCRUD } from './useSupabaseCRUD';
import { Json } from '@/integrations/supabase/types';
import { ExperienceType } from './useExperiences';

export interface AdminExperience {
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
  booking_url?: string;
  source_page_url?: string;
  pickup_included?: boolean;
  inclusions?: Json;
  exclusions?: Json;
  slug?: string;
  status?: string;
  notes?: Json;
  created_at: string;
  updated_at: string;
}

export interface UseAdminExperiencesOptions {
  providerId?: string;
  experienceType?: ExperienceType | 'all';
}

export function useAdminExperiences(options: UseAdminExperiencesOptions = {}) {
  const { providerId, experienceType } = options;
  
  // Build additional filters based on experience type
  const additionalFilters = experienceType && experienceType !== 'all' 
    ? [{ column: 'experience_type', value: experienceType }]
    : undefined;

  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<AdminExperience>({
    table: 'experiences',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    additionalFilters,
    select: '*',
  });

  return {
    experiences: items,
    isLoading,
    createExperience: async (data: Partial<AdminExperience>) => create({
      ...data,
      experience_type: data.experience_type || 'tour',
      is_active: data.is_active ?? true,
    }),
    updateExperience: async (id: string, updates: Partial<AdminExperience>) => update(id, updates),
    deleteExperience: async (id: string) => remove(id),
    refetch,
  };
}
