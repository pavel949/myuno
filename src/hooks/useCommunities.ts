/**
 * useCommunities — fetches public.communities directory.
 * Supports filtering by kind, country code, religion, search query.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CommunityKind = 'religion' | 'club' | 'consulate' | 'meetup';
export type ReligionBranch =
  | 'buddhist'
  | 'christian_catholic'
  | 'christian_orthodox'
  | 'christian_protestant'
  | 'muslim'
  | 'jewish'
  | 'hindu'
  | 'sikh'
  | 'other';

export interface Community {
  id: string;
  slug: string;
  kind: CommunityKind;
  name_en: string;
  name_ru: string | null;
  name_th: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_th: string | null;
  religion: ReligionBranch | null;
  country_code: string | null;
  consulate_type: string | null;
  language_primary: string | null;
  tags: string[] | null;
  address: string | null;
  city: string | null;
  province: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  telegram: string | null;
  source_url: string | null;
  is_active: boolean;
}

export interface CommunitiesFilters {
  kind?: CommunityKind | 'all';
  search?: string;
  countryCode?: string;
  religion?: ReligionBranch;
  languagePrimary?: string;
  city?: string;
}

export function useCommunities(filters: CommunitiesFilters = {}) {
  return useQuery({
    queryKey: ['communities', filters],
    queryFn: async (): Promise<Community[]> => {
      let q = supabase
        .from('communities')
        .select(
          'id, slug, kind, name_en, name_ru, name_th, description_en, description_ru, description_th, religion, country_code, consulate_type, language_primary, tags, address, city, province, lat, lng, google_place_id, phone, email, website, whatsapp, telegram, source_url, is_active'
        )
        .eq('is_active', true);

      if (filters.kind && filters.kind !== 'all') q = q.eq('kind', filters.kind);
      if (filters.countryCode) q = q.eq('country_code', filters.countryCode);
      if (filters.religion) q = q.eq('religion', filters.religion);
      if (filters.languagePrimary) q = q.eq('language_primary', filters.languagePrimary);
      if (filters.city) q = q.eq('city', filters.city);
      if (filters.search && filters.search.trim()) {
        const term = `%${filters.search.trim()}%`;
        q = q.or(`name_en.ilike.${term},name_ru.ilike.${term},name_th.ilike.${term}`);
      }

      const { data, error } = await q.order('kind').order('country_code', { ascending: true, nullsFirst: false }).order('name_en');
      if (error) throw error;
      return (data ?? []) as Community[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useCommunityBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['community', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<Community | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return (data as Community | null) ?? null;
    },
  });
}
