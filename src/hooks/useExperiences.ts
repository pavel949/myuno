import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import type { Json } from '@/integrations/supabase/types';

// ====== TYPES ======
export type ExperienceType = 'tour' | 'activity' | 'class';

export interface ItineraryItem {
  time?: string;
  title_en: string;
  title_ru?: string;
  description_en?: string;
  description_ru?: string;
}

export interface IncludeItem {
  text_en: string;
  text_ru?: string;
  icon?: string;
}

export type BookingModel = 'group' | 'private';

export interface Experience {
  id: string;
  experience_type: ExperienceType;
  title_en: string;
  title_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string | null;
  cover_image: string | null;
  images: string[];
  price: number | null;
  price_per: string | null;
  currency: string;
  duration_minutes: number | null;
  max_participants: number | null;
  min_participants: number | null;
  difficulty: string | null;
  equipment_included: boolean;
  is_certified: boolean;
  certification_details: string | null;
  safety_briefing_required: boolean;
  age_restriction: number | null;
  includes: IncludeItem[];
  excludes: IncludeItem[];
  requirements: IncludeItem[];
  highlights: IncludeItem[];
  itinerary: ItineraryItem[];
  location_name: string | null;
  meeting_point: string | null;
  meeting_point_lat: number | null;
  meeting_point_lng: number | null;
  available_days: string[];
  start_times: string[];
  tags: string[];
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  provider_id: string | null;
  external_link: string | null;
  booking_url: string | null;
  source_page_url: string | null;
  short_description: string | null;
  long_description: string | null;
  pickup_included: boolean;
  inclusions: string[];
  exclusions: string[];
  slug: string | null;
  status: string | null;
  booking_model: BookingModel;
}

// ====== CATEGORIES ======
// Synced with actual database values
export const EXPERIENCE_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🌟' },
  // Tours
  { id: 'islands', labelEn: 'Islands', labelRu: 'Острова', icon: '🏝️' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура', icon: '🛕' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа', icon: '🌿' },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Приключения', icon: '🧗' },
  { id: 'water-sports', labelEn: 'Water Sports', labelRu: 'Водный спорт', icon: '🏄' },
  { id: 'wildlife', labelEn: 'Wildlife', labelRu: 'Животные', icon: '🐘' },
  { id: 'sea_canoe', labelEn: 'Sea Canoe', labelRu: 'Каноэ', icon: '🛶' },
  { id: 'city-tour', labelEn: 'City Tour', labelRu: 'Городской тур', icon: '🏛️' },
  { id: 'food-tour', labelEn: 'Food Tour', labelRu: 'Гастротур', icon: '🍜' },
  { id: 'cooking_class', labelEn: 'Cooking Class', labelRu: 'Кулинарный класс', icon: '👨‍🍳' },
  { id: 'zipline', labelEn: 'Zipline', labelRu: 'Зиплайн', icon: '🏗️' },
  // Activities
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг', icon: '🤿' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг', icon: '🥽' },
  { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка', icon: '🎣' },
  { id: 'kayaking', labelEn: 'Kayaking', labelRu: 'Каякинг', icon: '🛶' },
  { id: 'parasailing', labelEn: 'Parasailing', labelRu: 'Парасейлинг', icon: '🪂' },
  { id: 'jet-ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл', icon: '🚤' },
  { id: 'surfing', labelEn: 'Surfing', labelRu: 'Серфинг', icon: '🏄‍♂️' },
  { id: 'wakeboarding', labelEn: 'Wakeboarding', labelRu: 'Вейкбординг', icon: '🏂' },
  { id: 'extreme', labelEn: 'Extreme', labelRu: 'Экстрим', icon: '🤸' },
  { id: 'shooting', labelEn: 'Shooting Range', labelRu: 'Тир', icon: '🎯' },
  { id: 'escape-room', labelEn: 'Escape Room', labelRu: 'Квест-комната', icon: '🔐' },
  { id: 'golf', labelEn: 'Golf', labelRu: 'Гольф', icon: '⛳' },
  { id: 'paintball', labelEn: 'Paintball', labelRu: 'Пейнтбол', icon: '🎨' },
  { id: 'martial-arts', labelEn: 'Martial Arts', labelRu: 'Единоборства', icon: '🥊' },
] as const;

// ====== OPTIONS ======
export interface UseExperiencesOptions {
  type?: ExperienceType | 'all';
  category?: string;
  featured?: boolean;
  limit?: number;
  search?: string;
}

// ====== TRANSFORM HELPER ======
const parseJsonArray = (data: Json | null): unknown[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [];
};

const transformExperience = (raw: Record<string, unknown>): Experience => {
  return {
    id: raw.id as string,
    experience_type: (raw.experience_type as ExperienceType) || 'tour',
    title_en: raw.title_en as string,
    title_ru: raw.title_ru as string,
    description_en: raw.description_en as string | null,
    description_ru: raw.description_ru as string | null,
    category: raw.category as string | null,
    cover_image: raw.cover_image as string | null,
    images: (raw.images as string[]) || [],
    price: raw.price as number | null,
    price_per: raw.price_per as string | null,
    currency: (raw.currency as string) || 'THB',
    duration_minutes: raw.duration_minutes as number | null,
    max_participants: raw.max_participants as number | null,
    min_participants: raw.min_participants as number | null,
    difficulty: raw.difficulty as string | null,
    equipment_included: (raw.equipment_included as boolean) ?? false,
    is_certified: (raw.is_certified as boolean) ?? false,
    certification_details: raw.certification_details as string | null,
    safety_briefing_required: (raw.safety_briefing_required as boolean) ?? false,
    age_restriction: raw.age_restriction as number | null,
    includes: parseJsonArray(raw.includes as Json) as IncludeItem[],
    excludes: parseJsonArray(raw.excludes as Json) as IncludeItem[],
    requirements: parseJsonArray(raw.requirements as Json) as IncludeItem[],
    highlights: parseJsonArray(raw.highlights as Json) as IncludeItem[],
    itinerary: parseJsonArray(raw.itinerary as Json) as ItineraryItem[],
    location_name: raw.location_name as string | null,
    meeting_point: raw.meeting_point as string | null,
    meeting_point_lat: raw.meeting_point_lat as number | null,
    meeting_point_lng: raw.meeting_point_lng as number | null,
    available_days: (raw.available_days as string[]) || [],
    start_times: (raw.start_times as string[]) || [],
    tags: (raw.tags as string[]) || [],
    rating: (raw.rating as number) || 0,
    review_count: (raw.review_count as number) || 0,
    is_active: (raw.is_active as boolean) ?? true,
    is_featured: (raw.is_featured as boolean) ?? false,
    provider_id: raw.provider_id as string | null,
    external_link: raw.external_link as string | null,
    booking_url: raw.booking_url as string | null,
    source_page_url: raw.source_page_url as string | null,
    short_description: raw.short_description as string | null,
    long_description: raw.long_description as string | null,
    pickup_included: (raw.pickup_included as boolean) ?? false,
    inclusions: parseJsonArray(raw.inclusions as Json) as string[],
    exclusions: parseJsonArray(raw.exclusions as Json) as string[],
    slug: raw.slug as string | null,
    status: raw.status as string | null,
    booking_model: (raw.booking_model as BookingModel) || 'group',
  };
};

// ====== FETCH FUNCTIONS ======
const fetchExperiences = async (options: UseExperiencesOptions): Promise<Experience[]> => {
  let query = supabase
    .from('experiences')
    .select('*')
    .eq('is_active', true);

  // Filter by type
  if (options.type && options.type !== 'all') {
    query = query.eq('experience_type', options.type);
  }

  // Filter by category
  if (options.category && options.category !== 'all') {
    query = query.eq('category', options.category);
  }

  // Filter by featured
  if (options.featured) {
    query = query.eq('is_featured', true);
  }

  // Search
  if (options.search) {
    query = query.or(`title_en.ilike.%${options.search}%,title_ru.ilike.%${options.search}%`);
  }

  // Order by rating
  query = query.order('rating', { ascending: false });

  // Limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((item) => transformExperience(item as Record<string, unknown>));
};

const fetchExperienceById = async (id: string): Promise<Experience | null> => {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? transformExperience(data as Record<string, unknown>) : null;
};

// ====== HOOKS ======
export const useExperiences = (options: UseExperiencesOptions = {}) => {
  const queryKey = useMemo(
    () => ['experiences', options.type || 'all', options.category || 'all', options.featured, options.limit, options.search],
    [options.type, options.category, options.featured, options.limit, options.search]
  );

  const { data, isLoading, refetch, error } = useQuery({
    queryKey,
    queryFn: () => fetchExperiences(options),
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { 
    experiences: data || [], 
    isLoading, 
    refetch, 
    error 
  };
};

export const useExperience = (experienceId: string | undefined) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['experience', experienceId],
    queryFn: () => fetchExperienceById(experienceId!),
    enabled: !!experienceId,
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { experience: data, isLoading, error, refetch };
};

// ====== HELPER FUNCTIONS ======
export const formatDuration = (minutes: number | null, language: string = 'en'): string => {
  const isRu = language === 'ru';
  if (!minutes) return isRu ? 'Не указано' : 'N/A';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return isRu ? `${mins} мин` : `${mins}min`;
  }
  
  if (mins === 0) {
    return isRu ? `${hours}ч` : `${hours}h`;
  }
  
  return isRu ? `${hours}ч ${mins}мин` : `${hours}h ${mins}min`;
};

export const getDifficultyColor = (difficulty: string | null): string => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'moderate':
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'challenging':
    case 'hard':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'expert':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getExperienceTypeLabel = (type: ExperienceType, language: string = 'en'): string => {
  const isRu = language === 'ru';
  if (type === 'tour') {
    return isRu ? 'Тур' : 'Tour';
  }
  return isRu ? 'Активность' : 'Activity';
};
