import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InvestmentArticle {
  id: string;
  slug: string;
  category: string;
  asset_class: string | null;
  title_ru: string;
  title_en: string;
  excerpt_ru: string | null;
  excerpt_en: string | null;
  body_ru: string | null;
  body_en: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  read_time_min: number | null;
  avg_ticket_thb: number | null;
  typical_roi_pct: number | null;
  risks_summary: string | null;
  is_published: boolean;
  view_count: number | null;
  sort_order: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useInvestmentArticles(category?: string) {
  return useQuery({
    queryKey: ['investment-articles', category ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('investment_articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('published_at', { ascending: false });
      if (category) q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as InvestmentArticle[];
    },
    staleTime: 60_000,
  });
}

export function useInvestmentArticle(slug: string | undefined) {
  return useQuery({
    enabled: !!slug,
    queryKey: ['investment-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('investment_articles')
        .select('*')
        .eq('slug', slug!)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return data as InvestmentArticle | null;
    },
  });
}
