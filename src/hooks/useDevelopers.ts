/**
 * Hook for fetching developers (public catalog).
 * Returns DeveloperUI which keeps both snake_case (DB) and camelCase fields,
 * so legacy callers continue to work.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toDeveloperUI, type DeveloperRow, type DeveloperUI } from '@/lib/adapters/developerAdapter';

/** Public alias kept for backward compatibility. */
export type Developer = DeveloperUI;

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

      return data.map((d) => toDeveloperUI(d as DeveloperRow));
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

      return toDeveloperUI(data as DeveloperRow);
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

      return toDeveloperUI(data as DeveloperRow);
    },
    enabled: !!slugOrId,
    staleTime: 5 * 60 * 1000,
  });
}
