import { useSupabaseCRUD } from './useSupabaseCRUD';
import { Json } from '@/integrations/supabase/types';
import { ExperienceType, BookingModel } from './useExperiences';

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
  booking_model?: BookingModel;
  created_at: string;
  updated_at: string;
}

export interface UseAdminExperiencesOptions {
  providerId?: string;
  experienceType?: ExperienceType | 'all';
}

export function useAdminExperiences(options: UseAdminExperiencesOptions = {}) {
  const { providerId, experienceType } = options;
  
  const additionalFilters: Array<{ column: string; value: string | number | boolean }> = [
    { column: 'vertical', value: 'experience' },
  ];

  if (experienceType && experienceType !== 'all') {
    additionalFilters.push({ column: 'attributes->>experience_type', value: experienceType });
  }

  type ListingRow = Record<string, unknown> & {
    id: string;
    provider_id?: string;
    attributes?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };

  const { items: rawItems, isLoading, create, update, remove, refetch } = useSupabaseCRUD<ListingRow>({
    table: 'listings',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    additionalFilters,
    select: '*',
  });

  // Transform raw listings to AdminExperience shape
  const experiences: AdminExperience[] = (rawItems || []).map((raw) => {
    const attrs = (raw.attributes as Record<string, unknown> | undefined) || {};
    const r = raw as Record<string, unknown>;
    const a = attrs as Record<string, unknown>;
    return {
      id: raw.id,
      provider_id: raw.provider_id,
      experience_type: attrs.experience_type || 'tour',
      title_en: raw.name_en,
      title_ru: raw.name_ru || '',
      description_en: raw.description_en,
      description_ru: raw.description_ru,
      category: raw.category || attrs.category,
      difficulty: attrs.difficulty,
      duration_minutes: attrs.duration_minutes,
      price: raw.price,
      price_per: raw.price_period || attrs.price_per,
      currency: raw.currency,
      min_participants: attrs.min_participants,
      max_participants: attrs.max_participants,
      meeting_point: raw.address || attrs.meeting_point,
      meeting_point_lat: raw.lat || attrs.meeting_point_lat,
      meeting_point_lng: raw.lng || attrs.meeting_point_lng,
      location_name: attrs.location_name,
      includes: attrs.includes,
      excludes: attrs.excludes,
      highlights: attrs.highlights,
      requirements: attrs.requirements,
      itinerary: attrs.itinerary,
      cover_image: raw.cover_image,
      images: raw.images,
      available_days: attrs.available_days,
      start_times: attrs.start_times,
      tags: raw.tags,
      equipment_included: attrs.equipment_included,
      is_certified: attrs.is_certified,
      certification_details: attrs.certification_details,
      safety_briefing_required: attrs.safety_briefing_required,
      age_restriction: attrs.age_restriction,
      is_active: raw.is_active,
      is_featured: raw.is_featured,
      rating: raw.rating,
      review_count: raw.review_count,
      approval_status: raw.approval_status,
      external_link: attrs.external_link,
      booking_url: attrs.booking_url,
      source_page_url: attrs.source_page_url,
      pickup_included: attrs.pickup_included,
      inclusions: attrs.inclusions,
      exclusions: attrs.exclusions,
      slug: raw.slug,
      status: attrs.status,
      notes: raw.notes,
      booking_model: attrs.booking_model,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    } as AdminExperience;
  });

  const mapToListing = (data: Partial<AdminExperience>) => {
    const { title_en, title_ru, experience_type, category, difficulty, duration_minutes,
      min_participants, max_participants, meeting_point, meeting_point_lat, meeting_point_lng,
      location_name, includes, excludes, highlights, requirements, itinerary,
      available_days, start_times, equipment_included, is_certified, certification_details,
      safety_briefing_required, age_restriction, external_link, booking_url, source_page_url,
      pickup_included, inclusions, exclusions, status, booking_model, price_per,
      ...rest } = data;

    return {
      ...rest,
      vertical: 'experience',
      name_en: title_en,
      name_ru: title_ru,
      category: category,
      price_period: price_per,
      address: meeting_point,
      lat: meeting_point_lat,
      lng: meeting_point_lng,
      attributes: {
        experience_type: experience_type || 'tour',
        difficulty, duration_minutes, min_participants, max_participants,
        location_name, includes, excludes, highlights, requirements, itinerary,
        available_days, start_times, equipment_included, is_certified, certification_details,
        safety_briefing_required, age_restriction, external_link, booking_url, source_page_url,
        pickup_included, inclusions, exclusions, status, booking_model,
        meeting_point, meeting_point_lat, meeting_point_lng,
      },
    };
  };

  return {
    experiences,
    isLoading,
    createExperience: async (data: Partial<AdminExperience>) => create(mapToListing({
      ...data,
      experience_type: data.experience_type || 'tour',
      is_active: data.is_active ?? true,
    }) as any),
    updateExperience: async (id: string, updates: Partial<AdminExperience>) => update(id, mapToListing(updates) as any),
    deleteExperience: async (id: string) => remove(id),
    refetch,
  };
}
