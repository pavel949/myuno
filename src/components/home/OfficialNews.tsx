/**
 * OfficialNews — compact home strip with latest news from official Phuket/Thailand sources.
 * Sources: TAT, Government PR, Phuket Provincial Gov, Nation, Bangkok Post.
 * Data lives in public.official_news (populated by fetch-official-news edge function).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Newspaper } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOfficialNews } from '@/hooks/useOfficialNews';

const formatDate = (iso: string | null, locale: string) => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch { return ''; }
};

export const OfficialNews: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useOfficialNews(4);

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="px-4 mt-6" aria-label={isRu ? 'Официальные новости' : 'Official news'}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-accent" strokeWidth={2} />
          {isRu ? 'Официальные новости' : 'Official news'}
        </h2>
        <Link
          to="/arrive/news"
          className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {isRu ? 'Все' : 'All'} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-3 animate-pulse">
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-2 bg-muted rounded w-1/3" />
              </div>
            ))
          : (data ?? []).map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block px-4 py-3 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-foreground line-clamp-2">
                      {n.title}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1">
                      {n.source_label}
                      {n.published_at ? ` · ${formatDate(n.published_at, isRu ? 'ru-RU' : 'en-GB')}` : ''}
                    </span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              </a>
            ))}
      </div>
    </section>
  );
};

export default OfficialNews;
