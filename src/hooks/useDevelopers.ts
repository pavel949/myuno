/**
 * Hook for fetching developers data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Developer {
  id: string;
  nameEn: string;
  nameRu: string;
  slug: string | null;
  logoUrl: string | null;
  coverImage: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  foundedYear: number | null;
  projectsCompleted: number;
  totalUnitsSold: number;
  averageRating: number;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  muunoScore: number | null;
}

/** Raw row from `developers` table */
type DeveloperRow = {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string | null;
  logo_url: string | null;
  cover_image: string | null;
  description_en: string | null;
  description_ru: string | null;
  founded_year: number | null;
  projects_completed: number | null;
  total_units_sold: number | null;
  average_rating: number | string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  muuno_score: number | null;
};

function mapDeveloperRow(data: DeveloperRow): Developer {
  return {
    id: data.id,
    nameEn: data.name_en,
    nameRu: data.name_ru,
    slug: data.slug,
    logoUrl: data.logo_url,
    coverImage: data.cover_image,
    descriptionEn: data.description_en,
    descriptionRu: data.description_ru,
    foundedYear: data.founded_year,
    projectsCompleted: data.projects_completed || 0,
    totalUnitsSold: data.total_units_sold || 0,
    averageRating: Number(data.average_rating) || 0,
    website: data.website,
    phone: data.phone,
    email: data.email,
    address: data.address,
    isVerified: data.is_verified || false,
    isFeatured: data.is_featured || false,
    muunoScore: data.muuno_score,
  };
}

export function useDevelopers() {
  return useQuery({
    queryKey: ['developers'],
    queryFn: async (): Promise<Developer[]> => {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('muuno_score', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((d) => mapDeveloperRow(d as DeveloperRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeveloper(id: string) {
  return useQuery({
    queryKey: ['developer', id],
    queryFn: async (): Promise<Developer | null> => {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapDeveloperRow(data as DeveloperRow);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Resolve developer by slug, then by id (legacy /newbuilds/developers/:slug redirects). */
export function useDeveloperSlugOrId(slugOrId?: string) {
  return useQuery({
    queryKey: ['developer-slug-or-id', slugOrId],
    queryFn: async (): Promise<Developer | null> => {
      if (!slugOrId) return null;

      let { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('slug', slugOrId)
        .eq('is_active', true)
        .maybeSingle();

      if (!data && !error) {
        ({ data, error } = await supabase
          .from('developers')
          .select('*')
          .eq('id', slugOrId)
          .eq('is_active', true)
          .maybeSingle());
      }

      if (error) throw error;
      if (!data) return null;

      return mapDeveloperRow(data as DeveloperRow);
    },
    enabled: !!slugOrId,
    staleTime: 5 * 60 * 1000,
  });
}
