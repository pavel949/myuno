/**
 * @module hooks/useKnowledgePillars
 * @description M9.6 — Knowledge Hub pillar pages: list, search, by-slug.
 *
 * Data lives in `public.knowledge_pillars` (RLS public-readable for
 * status='live' or 'placeholder'). Seeded from `pillarPages.ts`.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KnowledgePillar {
  slug: string;
  cluster: string;
  h1_ru: string;
  h1_en: string;
  meta_title_ru: string;
  meta_title_en: string;
  meta_description_ru: string;
  meta_description_en: string;
  body_ru: string;
  body_en: string;
  hreflang: Array<{ lang: string; href: string }>;
  related_slugs: string[];
  status: 'placeholder' | 'live' | 'archived';
  word_count: number;
  source_section: string | null;
  updated_at: string;
}

const STALE_MS = 5 * 60 * 1000;

export function useKnowledgePillars(search?: string) {
  return useQuery({
    queryKey: ['knowledge-pillars', search ?? ''],
    staleTime: STALE_MS,
    queryFn: async (): Promise<KnowledgePillar[]> => {
      let q = supabase
        .from('knowledge_pillars')
        .select('*')
        .in('status', ['live', 'placeholder'])
        .order('cluster', { ascending: true });

      const term = (search ?? '').trim();
      if (term.length >= 2) {
        // ILIKE across both languages — simple, deterministic, no extra deps.
        const pattern = `%${term}%`;
        q = q.or(
          `h1_ru.ilike.${pattern},h1_en.ilike.${pattern},meta_description_ru.ilike.${pattern},meta_description_en.ilike.${pattern},body_ru.ilike.${pattern},body_en.ilike.${pattern}`,
        );
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as KnowledgePillar[];
    },
  });
}

export function useKnowledgePillar(slug: string | undefined) {
  return useQuery({
    queryKey: ['knowledge-pillar', slug],
    enabled: Boolean(slug),
    staleTime: STALE_MS,
    queryFn: async (): Promise<KnowledgePillar | null> => {
      if (!slug) return null;
      // Slug stored with leading slash; accept both `/guides/foo` and `guides/foo`
      const normalized = slug.startsWith('/') ? slug : `/${slug}`;
      const { data, error } = await supabase
        .from('knowledge_pillars')
        .select('*')
        .eq('slug', normalized)
        .maybeSingle();
      if (error) throw error;
      return (data as KnowledgePillar | null) ?? null;
    },
  });
}
