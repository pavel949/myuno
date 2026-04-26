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
    const attrs = (r.attributes as Record<string, unknown> | undefined) || {};
    const r = raw as Record<string, unknown>;
    const a = attrs as Record<string, unknown>;
    return {
      id: r.id,
      provider_id: r.provider_id,
      experience_type: a.experience_type || 'tour',
      title_en: r.name_en,
      title_ru: r.name_ru || '',
      description_en: r.description_en,
      description_ru: r.description_ru,
      category: r.category || a.category,
      difficulty: a.difficulty,
      duration_minutes: a.duration_minutes,
      price: r.price,
      price_per: r.price_period || a.price_per,
      currency: r.currency,
      min_participants: a.min_participants,
      max_participants: a.max_participants,
      meeting_point: r.address || a.meeting_point,
      meeting_point_lat: r.lat || a.meeting_point_lat,
      meeting_point_lng: r.lng || a.meeting_point_lng,
      location_name: a.location_name,
      includes: a.includes,
      excludes: a.excludes,
      highlights: a.highlights,
      requirements: a.requirements,
      itinerary: a.itinerary,
      cover_image: r.cover_image,
      images: r.images,
      available_days: a.available_days,
      start_times: a.start_times,
      tags: r.tags,
      equipment_included: a.equipment_included,
      is_certified: a.is_certified,
      certification_details: a.certification_details,
      safety_briefing_required: a.safety_briefing_required,
      age_restriction: a.age_restriction,
      is_active: r.is_active,
      is_featured: r.is_featured,
      rating: r.rating,
      review_count: r.review_count,
      approval_status: r.approval_status,
      external_link: a.external_link,
      booking_url: a.booking_url,
      source_page_url: a.source_page_url,
      pickup_included: a.pickup_included,
      inclusions: a.inclusions,
      exclusions: a.exclusions,
      slug: r.slug,
      status: a.status,
      notes: r.notes,
      booking_model: a.booking_model,
      created_at: r.created_at,
      updated_at: r.updated_at,
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
