import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  RELOCATION_ARTICLE_SEEDS,
  type RelocationArticleRecord,
  type RelocationArticleCategory,
} from '@/data/relocationArticles.seed';

type RelocationArticleRow = {
  slug: string;
  category: string;
  title_en: string;
  title_ru: string;
  summary_en: string | null;
  summary_ru: string | null;
  content_en: string | null;
  content_ru: string | null;
  related_route: string | null;
  sort_order: number | null;
};

function rowToRecord(row: RelocationArticleRow): RelocationArticleRecord {
  return {
    slug: row.slug,
    category: row.category as RelocationArticleCategory,
    title_en: row.title_en,
    title_ru: row.title_ru,
    summary_en: row.summary_en ?? '',
    summary_ru: row.summary_ru ?? '',
    content_en: row.content_en ?? '',
    content_ru: row.content_ru ?? '',
    related_route: row.related_route ?? undefined,
    sort_order: row.sort_order ?? 0,
  };
}

async function fetchPublishedArticles(): Promise<RelocationArticleRecord[]> {
  // Table added in migration — regenerate Supabase types when convenient.
  // @ts-expect-error relocation_articles not yet in generated Database type
  const { data, error } = await supabase
    .from('relocation_articles')
    .select('slug, category, title_en, title_ru, summary_en, summary_ru, content_en, content_ru, related_route, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return RELOCATION_ARTICLE_SEEDS;
  }

  return (data as unknown as RelocationArticleRow[]).map(rowToRecord);
}

async function fetchArticleBySlug(slug: string): Promise<RelocationArticleRecord | null> {
  // @ts-expect-error relocation_articles not yet in generated Database type
  const { data, error } = await supabase
    .from('relocation_articles')
    .select('slug, category, title_en, title_ru, summary_en, summary_ru, content_en, content_ru, related_route, sort_order')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) {
    return RELOCATION_ARTICLE_SEEDS.find((a) => a.slug === slug) ?? null;
  }

  return rowToRecord(data as unknown as RelocationArticleRow);
}

export function useRelocationArticles() {
  return useQuery({
    queryKey: ['relocation_articles'],
    queryFn: fetchPublishedArticles,
    staleTime: 1000 * 60 * 10,
  });
}

export function useRelocationArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['relocation_article', slug],
    queryFn: () => fetchArticleBySlug(slug ?? ''),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 10,
  });
}
