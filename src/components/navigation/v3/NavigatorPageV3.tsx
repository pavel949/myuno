/**
 * NavigatorPage v3 — situation-first discovery.
 *
 * Replaces the v2 cluster/persona grid with a flat grid of life situations
 * sourced from `life_situations` (admin-managed). Each card navigates to
 * `/discover/:code` where services are listed via `resolve_life_os_context`.
 *
 * Gated by `feature_flag:navigator_v3` (system_settings). When OFF, the
 * existing NavigatorPage renders instead. See `NavigatorEntry`.
 */
import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useSituationServiceCounts } from '@/hooks/useSituationServiceCounts';
import { SituationCard } from './SituationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function NavigatorPageV3() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: situations, isLoading, isError } = useLifeSituations();
  const { data: counts } = useSituationServiceCounts();
  const [query, setQuery] = useState('');

  const filteredSituations = useMemo(() => {
    if (!situations) return [];
    const q = query.trim().toLowerCase();
    if (!q) return situations;
    return situations.filter((s) => {
      const haystack = [
        s.title_ru,
        s.title_en,
        s.description_ru,
        s.description_en,
        s.code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [situations, query]);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24 md:px-6 md:pt-10 max-w-6xl mx-auto">
        <header className="mb-8 md:mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">
            {isRu ? 'Навигатор' : 'Navigator'}
          </p>
          <h1 className="text-[28px] sm:text-[36px] lg:text-[40px] font-serif font-semibold leading-[1.1] tracking-[-0.02em] text-foreground max-w-3xl">
            {isRu ? (
              <>Что у тебя сейчас <span className="italic text-accent">в жизни</span>?</>
            ) : (
              <>What&apos;s happening in <span className="italic text-accent">your life</span>?</>
            )}
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15px] text-muted-foreground max-w-xl leading-[1.5]">
            {isRu
              ? 'Выберите ситуацию — покажем нужные сервисы, контакты и шаги.'
              : 'Pick a situation — we show services, contacts and next steps.'}
          </p>

          <div className="mt-6 relative max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground pointer-events-none"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isRu ? 'Поиск по ситуациям…' : 'Search situations…'}
              className={cn(
                'w-full pl-[46px] pr-12 py-3.5 text-[14px] outline-none',
                'border border-border bg-card text-foreground placeholder:text-muted-foreground',
                'focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
              )}
              aria-label={isRu ? 'Поиск по ситуациям' : 'Search situations'}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isRu ? 'Очистить' : 'Clear'}
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </header>

        {isError && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 text-sm">
            {isRu ? 'Не удалось загрузить ситуации.' : 'Failed to load situations.'}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] rounded-none" />
            ))}
          </div>
        )}

        {!isLoading && situations && situations.length > 0 && filteredSituations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSituations.map((situation) => (
              <SituationCard
                key={situation.id}
                situation={situation}
                serviceCount={counts?.[situation.id]}
              />
            ))}
          </div>
        )}

        {!isLoading && situations && situations.length > 0 && filteredSituations.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {isRu ? `Ничего не найдено по запросу «${query}».` : `No matches for "${query}".`}
          </div>
        )}

        {!isLoading && situations && situations.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {isRu ? 'Пока нет активных ситуаций.' : 'No active situations yet.'}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
