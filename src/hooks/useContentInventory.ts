/**
 * useContentInventory — loads every editorial source for /admin/content.
 * Partial failure is reported per source so one broken table never hides the rest.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fromInvestment, fromLegal, fromNews, fromRelocation, sortByUpdated,
  type ContentItem, type InvestmentRow, type LegalRow, type NewsRow, type RelocationRow,
} from '@/lib/content/contentInventory';

export interface ContentInventory {
  items: ContentItem[];
  failedSources: string[];
}

export function useContentInventory() {
  return useQuery({
    queryKey: ['hq-content-inventory'],
    queryFn: async (): Promise<ContentInventory> => {
      const [reloc, invest, legal, news] = await Promise.all([
        supabase.from('relocation_articles').select('id, slug, title_en, title_ru, summary_en, summary_ru, content_en, content_ru, is_published, updated_at, category').limit(500),
        supabase.from('investment_articles').select('id, slug, title_en, title_ru, excerpt_en, excerpt_ru, body_en, body_ru, is_published, updated_at, author_name').limit(500),
        supabase.from('legal_documents').select('id, doc_key, title_en, title_ru, content_md, is_active, published_at, created_at, version').limit(200),
        supabase.from('official_news').select('id, title, title_ru, summary, summary_ru, lang, url, published_at, fetched_at, source_label').order('fetched_at', { ascending: false }).limit(100),
      ]);
      const failedSources: string[] = [];
      const items: ContentItem[] = [];
      if (reloc.error) failedSources.push('relocation_articles'); else items.push(...((reloc.data ?? []) as RelocationRow[]).map(fromRelocation));
      if (invest.error) failedSources.push('investment_articles'); else items.push(...((invest.data ?? []) as InvestmentRow[]).map(fromInvestment));
      if (legal.error) failedSources.push('legal_documents'); else items.push(...((legal.data ?? []) as LegalRow[]).map(fromLegal));
      if (news.error) failedSources.push('official_news'); else items.push(...((news.data ?? []) as NewsRow[]).map(fromNews));
      if (failedSources.length === 4) throw new Error('All content sources failed to load');
      return { items: sortByUpdated(items), failedSources };
    },
  });
}
