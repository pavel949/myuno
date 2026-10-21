import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OfficialNewsItem {
  id: string;
  source: string;
  source_label: string;
  url: string;
  title: string;
  title_ru: string | null;
  summary: string | null;
  summary_ru: string | null;
  image_url: string | null;
  lang: string;
  published_at: string | null;
  fetched_at: string;
}

export function useOfficialNews(limit = 5) {
  return useQuery({
    queryKey: ['official_news', limit],
    queryFn: async (): Promise<OfficialNewsItem[]> => {
      const { data, error } = await supabase
        .from('official_news')
        .select('id, source, source_label, url, title, title_ru, summary, summary_ru, image_url, lang, published_at, fetched_at')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('fetched_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as OfficialNewsItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

