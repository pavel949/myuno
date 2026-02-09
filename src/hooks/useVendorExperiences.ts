import { useSupabaseCRUD } from './useSupabaseCRUD';
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
  const additionalFilters = experienceType && experienceType !== 'all' 
    ? [{ column: 'experience_type', value: experienceType }]
    : undefined;

  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorExperience>({
    table: 'experiences',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    additionalFilters,
    select: `
      id,provider_id,experience_type,title_en,title_ru,description_en,description_ru,
      category,difficulty,duration_minutes,price,price_per,currency,
      min_participants,max_participants,meeting_point,meeting_point_lat,meeting_point_lng,location_name,
      includes,excludes,highlights,requirements,itinerary,
      cover_image,images,available_days,start_times,tags,
      equipment_included,is_certified,certification_details,safety_briefing_required,age_restriction,
      is_active,is_featured,rating,review_count,approval_status,external_link,
      created_at,updated_at
    `.replace(/\s+/g, ''),
  });

  return {
    experiences: items,
    isLoading,
    createExperience: async (data: Partial<VendorExperience>) => create({
      ...data,
      experience_type: data.experience_type || 'tour',
      is_active: data.is_active ?? true,
      approval_status: 'pending',
    }),
    updateExperience: async (id: string, updates: Partial<VendorExperience>) => update(id, updates),
    deleteExperience: async (id: string) => remove(id),
    refetch,
  };
}
