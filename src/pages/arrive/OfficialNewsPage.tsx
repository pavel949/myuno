/**
 * OfficialNewsPage — full feed of official Phuket/Thailand news.
 * Route: /arrive/news (sub-route of ARRIVE cluster).
 */
import React from 'react';
import { ExternalLink, Newspaper, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOfficialNews } from '@/hooks/useOfficialNews';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const SOURCE_LINKS: Array<{ label: string; url: string }> = [
  { label: 'TAT Newsroom', url: 'https://www.tatnews.org/' },
  { label: 'Government PR Thailand', url: 'https://thailand.prd.go.th/' },
  { label: 'Phuket Provincial Gov', url: 'https://www.phuket.go.th/' },
  { label: 'The Nation Thailand', url: 'https://www.nationthailand.com/' },
  { label: 'Bangkok Post', url: 'https://www.bangkokpost.com/' },
];

const formatDate = (iso: string | null, locale: string) => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch { return ''; }
};

const OfficialNewsPage: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useOfficialNews(40);
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-official-news', { body: {} });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['official_news'] });
      toast.success(isRu ? 'Новости обновлены' : 'News refreshed');
    } catch (e) {
      toast.error(isRu ? 'Не удалось обновить' : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AppLayout showHeader={false} showFooter={false}>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {isRu ? 'Обновить' : 'Refresh'}
          </button>
        </div>

        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-accent" />
            {isRu ? 'Официальные новости' : 'Official news'}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2">
            {isRu
              ? 'Свежие сообщения официальных источников Пхукета и Таиланда.'
              : 'Latest updates from official Phuket and Thailand sources.'}
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden mb-6">
          {isLoading && (
            <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              {isRu ? 'Загрузка…' : 'Loading…'}
            </div>
          )}
          {!isLoading && (data ?? []).length === 0 && (
            <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              {isRu
                ? 'Новостей пока нет. Нажмите «Обновить».'
                : 'No news yet. Tap “Refresh”.'}
            </div>
          )}
          {(data ?? []).map((n) => {
            const title = isRu && n.title_ru ? n.title_ru : n.title;
            const summary = isRu && n.summary_ru ? n.summary_ru : n.summary;
            return (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block px-4 py-3 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-medium text-foreground">
                    {title}
                  </span>
                  {summary && (
                    <span className="block text-[12px] text-muted-foreground mt-1 line-clamp-2">
                      {summary}
                    </span>
                  )}
                  <span className="block text-[11px] text-muted-foreground mt-1.5">
                    {n.source_label}
                    {n.published_at ? ` · ${formatDate(n.published_at, isRu ? 'ru-RU' : 'en-GB')}` : ''}
                  </span>
                </span>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            </a>
          ))}
        </div>

        <section>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {isRu ? 'Источники' : 'Sources'}
          </h2>
          <ul className="space-y-1.5">
            {SOURCE_LINKS.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-foreground hover:text-accent inline-flex items-center gap-1"
                >
                  {s.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppLayout>
  );
};

export default OfficialNewsPage;
