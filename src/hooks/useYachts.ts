import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface Yacht {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  yacht_type: string;
  cover_image: string | null;
  images: string[];
  capacity: number;
  price_half_day: number | null;
  price_full_day: number | null;
  price_sunset: number | null;
  price_overnight: number | null;
  currency: string;
  location_name: string | null;
  location_ru: string | null;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  features_en: string[] | null;
  features_ru: string[] | null;
  length_meters: number | null;
  year_built: number | null;
  beam: string | null;
  draft: string | null;
  engines: string | null;
  cruising_speed: string | null;
  max_speed: string | null;
  fuel_capacity: string | null;
  cabins: number | null;
  bathrooms: number | null;
  has_crew: boolean | null;
  has_catering: boolean | null;
  provider_id?: string | null;
  approval_status?: string | null;
  is_active?: boolean;
  addons?: unknown;
  charter_options?: unknown;
  departure_times?: string[] | null;
  booking_flow?: string | null;
  deposit_percent?: number | null;
  balance_due_hours?: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListingRow = Record<string, any>;

function transformYacht(raw: ListingRow): Yacht {
  const attrs = raw.attributes || {};
  return {
    id: raw.id,
    name_en: raw.name_en,
    name_ru: raw.name_ru || '',
    description_en: raw.description_en,
    description_ru: raw.description_ru,
    yacht_type: raw.category || attrs.yacht_type || 'motor_yacht',
    cover_image: raw.cover_image,
    images: raw.images || [],
    capacity: attrs.capacity || 0,
    price_half_day: attrs.price_half_day || null,
    price_full_day: raw.price || attrs.price_full_day || null,
    price_sunset: attrs.price_sunset || null,
    price_overnight: attrs.price_overnight || null,
    currency: raw.currency || 'THB',
    location_name: raw.address || attrs.location_name || null,
    location_ru: attrs.location_ru || null,
    rating: raw.rating || 0,
    review_count: raw.review_count || 0,
    is_verified: raw.is_verified ?? false,
    is_featured: raw.is_featured ?? false,
    features_en: attrs.features_en || raw.features || null,
    features_ru: attrs.features_ru || null,
    length_meters: attrs.length_meters || null,
    year_built: attrs.year_built || null,
    beam: attrs.beam || null,
    draft: attrs.draft || null,
    engines: attrs.engines || null,
    cruising_speed: attrs.cruising_speed || null,
    max_speed: attrs.max_speed || null,
    fuel_capacity: attrs.fuel_capacity || null,
    cabins: attrs.cabins || null,
    bathrooms: attrs.bathrooms || null,
    has_crew: attrs.has_crew ?? null,
    has_catering: attrs.has_catering ?? null,
    provider_id: raw.provider_id,
    approval_status: raw.approval_status,
    is_active: raw.is_active ?? true,
    addons: attrs.addons,
    charter_options: attrs.charter_options,
    departure_times: attrs.departure_times || null,
    booking_flow: attrs.booking_flow || null,
    deposit_percent: attrs.deposit_percent || null,
    balance_due_hours: attrs.balance_due_hours || null,
  };
}

async function fetchYachts(yachtType?: string): Promise<Yacht[]> {
  let query = supabase
    .from('listings')
    .select('*')
    .eq('vertical', 'yacht')
    .eq('is_active', true)
    .order('is_featured', { ascending: false });

  if (yachtType && yachtType !== 'all') {
    query = query.eq('category', yachtType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(transformYacht);
}

async function fetchYachtById(id: string): Promise<Yacht | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('vertical', 'yacht')
    .maybeSingle();

  if (error) throw error;
  return data ? transformYacht(data) : null;
}

export function useYachts(yachtType?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['yachts', yachtType || 'all'],
    queryFn: () => fetchYachts(yachtType),
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { yachts: data || [], isLoading };
}

export function useYacht(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['yacht', id],
    queryFn: () => fetchYachtById(id),
    enabled: !!id,
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { yacht: data ?? null, isLoading };
}
