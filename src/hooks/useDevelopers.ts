/**
 * Hook for fetching developers (public catalog).
 * Returns DeveloperUI which keeps both snake_case (DB) and camelCase fields,
 * so legacy callers continue to work.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toDeveloperUI, type DeveloperRow, type DeveloperUI } from '@/lib/adapters/developerAdapter';

const PUBLIC_DEVELOPER_COLUMNS = [
  'id', 'slug', 'name_en', 'name_ru', 'description_en', 'description_ru',
  'logo_url', 'cover_image', 'website', 'phone', 'email', 'address',
  'founded_year', 'projects_completed', 'projects_ongoing', 'total_units_sold',
  'total_units_delivered', 'average_rating', 'is_verified', 'is_featured',
  'is_active', 'muuno_score', 'devmod_status', 'created_at', 'updated_at',
].join(', ');

/** Public alias kept for backward compatibility. */
export type Developer = DeveloperUI;

export function useDevelopers() {
  return useQuery({
    queryKey: ['developers'],
    queryFn: async (): Promise<Developer[]> => {
      const { data, error } = await supabase
        .from('developers_public')
        .select(PUBLIC_DEVELOPER_COLUMNS)
        .eq('is_active', true)
        .eq('devmod_status', 'active')
        .order('is_featured', { ascending: false })
        .order('muuno_score', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((d) => toDeveloperUI(d as unknown as DeveloperRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeveloper(id: string) {
  return useQuery({
    queryKey: ['developer', id],
    queryFn: async (): Promise<Developer | null> => {
      const { data, error } = await supabase
        .from('developers_public')
        .select(PUBLIC_DEVELOPER_COLUMNS)
        .eq('id', id)
        .eq('is_active', true)
        .eq('devmod_status', 'active')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return toDeveloperUI(data as unknown as DeveloperRow);
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
        .from('developers_public')
        .select(PUBLIC_DEVELOPER_COLUMNS)
        .eq('slug', slugOrId)
        .eq('is_active', true)
        .eq('devmod_status', 'active')
        .maybeSingle();

      if (!data && !error) {
        ({ data, error } = await supabase
          .from('developers_public')
          .select(PUBLIC_DEVELOPER_COLUMNS)
          .eq('id', slugOrId)
          .eq('is_active', true)
          .eq('devmod_status', 'active')
          .maybeSingle());
      }

      if (error) throw error;
      if (!data) return null;

      return toDeveloperUI(data as unknown as DeveloperRow);
    },
    enabled: !!slugOrId,
    staleTime: 5 * 60 * 1000,
  });
}
