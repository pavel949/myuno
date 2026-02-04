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

      return data.map((d) => ({
        id: d.id,
        nameEn: d.name_en,
        nameRu: d.name_ru,
        slug: d.slug,
        logoUrl: d.logo_url,
        coverImage: d.cover_image,
        descriptionEn: d.description_en,
        descriptionRu: d.description_ru,
        foundedYear: d.founded_year,
        projectsCompleted: d.projects_completed || 0,
        totalUnitsSold: d.total_units_sold || 0,
        averageRating: Number(d.average_rating) || 0,
        website: d.website,
        phone: d.phone,
        email: d.email,
        address: d.address,
        isVerified: d.is_verified || false,
        isFeatured: d.is_featured || false,
        muunoScore: d.muuno_score,
      }));
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
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
