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
import { Link } from 'react-router-dom';
import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useSituationServiceCounts } from '@/hooks/useSituationServiceCounts';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { rankSituationsByPersonas } from '@/lib/situationBlend';
import { ROLE_META, personaColor } from '@/lib/roleBlend';
import { RoleSheet } from '@/components/home/RoleSheet';
import { SituationCard } from './SituationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function NavigatorPageV3() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: situations, isLoading, isError } = useLifeSituations();
  const { data: counts } = useSituationServiceCounts();
  const { personas, effectivePersonas, togglePersona, setPersonas } = useUserPersonas();
  const [query, setQuery] = useState('');
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);

  // Role-aware ordering: rank by persona×cluster fit, fall back to DB priority.
  const rankedSituations = useMemo(() => {
    if (!situations) return [];
    return rankSituationsByPersonas(situations, effectivePersonas);
  }, [situations, effectivePersonas]);

  const filteredSituations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rankedSituations;
    return rankedSituations.filter((s) => {
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
  }, [rankedSituations, query]);

  const hasRealPersonas = personas.length > 0;

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24 md:px-6 md:pt-10 max-w-6xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">
              {isRu ? 'Навигатор' : 'Navigator'}
            </p>
            <Link
              to="/map"
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 -mt-1 text-[12px] font-medium',
                'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors',
              )}
              aria-label={isRu ? 'Карта Пхукета' : 'Phuket map'}
            >
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">{isRu ? 'На карте' : 'Map'}</span>
            </Link>
          </div>
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

          {/* Persona chip-row — explains the ordering and exposes the role editor. */}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">
              {isRu ? 'Для роли:' : 'For role:'}
            </span>
            {hasRealPersonas ? (
              effectivePersonas.slice(0, 4).map((persona) => {
                const meta = ROLE_META[persona];
                if (!meta) return null;
                return (
                  <span
                    key={persona}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium text-foreground"
                    style={{
                      background: personaColor(persona, 0.12),
                      borderLeft: `2px solid ${personaColor(persona)}`,
                    }}
                  >
                    {isRu ? meta.labelRu : meta.label}
                  </span>
                );
              })
            ) : (
              <span className="text-[12px] italic text-muted-foreground">
                {isRu ? 'роль не выбрана — показываем универсальный набор' : 'no role yet — generic order'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setRoleSheetOpen(true)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium',
                'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors',
              )}
            >
              <SlidersHorizontal className="w-3 h-3" strokeWidth={2} />
              {isRu ? 'Изменить' : 'Edit'}
            </button>
          </div>

          <div className="mt-5 relative max-w-xl">
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

      <RoleSheet
        open={roleSheetOpen}
        personas={personas}
        onClose={() => setRoleSheetOpen(false)}
        onToggle={togglePersona}
        onReorder={setPersonas}
      />
    </AppLayout>
  );
}
