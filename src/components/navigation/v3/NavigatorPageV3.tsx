/**
 * NavigatorPage v3 — situation-first discovery, grouped by Master-Taxonomy cluster.
 *
 * Canonical /discover surface. Renders life situations sourced from
 * `life_situations` (admin-managed) AND groups them under the 6 Master-Taxonomy
 * surface clusters (Arrive / Live / Manage / Invest / Legal / Build) using the
 * static SSOT `CLUSTER_LIFE_SITUATIONS`. Each card navigates to
 * `/discover/:code` where services are listed via `resolve_life_os_context`.
 *
 * Why grouped: the previous flat 20-card grid had no context — clients couldn't
 * understand "why these cards / where am I". Cluster sections provide
 * navigational anchors and explain the surface intent.
 *
 * GA on 2026-06-16 (migration 20260616013024). Cluster grouping added
 * 2026-06-18 as part of admin/navigator UX pass.
 */
import React, { useMemo, useState, useCallback } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  CLUSTERS,
  CLUSTER_LIFE_SITUATIONS,
  type ClusterId,
} from '@/lib/catalog/taxonomy';
import { NavigatorClusterSection } from './NavigatorClusterSection';
import type { LifeSituation } from '@/hooks/useLifeOS';

const CLUSTER_ORDER: ClusterId[] = ['arrive', 'live', 'legal', 'invest', 'manage', 'build'];

/** Build situationCode -> primary clusterId map from SSOT. */
function buildSituationClusterMap(): Record<string, ClusterId> {
  const map: Record<string, { clusterId: ClusterId; weight: number; isPrimary: boolean }> = {};
  for (const link of CLUSTER_LIFE_SITUATIONS) {
    const existing = map[link.situationCode];
    if (
      !existing ||
      (link.isPrimary && !existing.isPrimary) ||
      (link.isPrimary === existing.isPrimary && link.weight > existing.weight)
    ) {
      map[link.situationCode] = {
        clusterId: link.clusterId,
        weight: link.weight,
        isPrimary: link.isPrimary,
      };
    }
  }
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.clusterId]));
}

export default function NavigatorPageV3() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: situations, isLoading, isError } = useLifeSituations();
  const { data: counts } = useSituationServiceCounts();
  const { personas, effectivePersonas, togglePersona, setPersonas } = useUserPersonas();
  const [query, setQuery] = useState('');
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [activeCluster, setActiveCluster] = useState<ClusterId | 'all'>('all');

  const situationClusterMap = useMemo(buildSituationClusterMap, []);

  const rankedSituations = useMemo(() => {
    if (!situations) return [];
    return rankSituationsByPersonas(situations, effectivePersonas);
  }, [situations, effectivePersonas]);

  const filteredSituations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rankedSituations;
    return rankedSituations.filter((s) => {
      const haystack = [s.title_ru, s.title_en, s.description_ru, s.description_en, s.code]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rankedSituations, query]);

  // Group by primary cluster from SSOT; unknown codes fall into 'live' bucket.
  const grouped = useMemo(() => {
    const buckets: Record<ClusterId, LifeSituation[]> = {
      arrive: [], live: [], manage: [], invest: [], legal: [], build: [],
    };
    for (const s of filteredSituations) {
      const cid = situationClusterMap[s.code] ?? 'live';
      buckets[cid].push(s);
    }
    return buckets;
  }, [filteredSituations, situationClusterMap]);

  const visibleClusters = useMemo(
    () => CLUSTER_ORDER.filter((cid) => grouped[cid].length > 0),
    [grouped],
  );

  const hasRealPersonas = personas.length > 0;

  const scrollToCluster = useCallback((cid: ClusterId) => {
    setActiveCluster(cid);
    const el = document.getElementById(`cluster-${cid}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24 md:px-6 md:pt-10 max-w-6xl mx-auto">
        <header className="mb-6 md:mb-8">
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
              ? 'Выберите ситуацию — покажем нужные сервисы, контакты и шаги. Карточки сгруппированы по сферам жизни.'
              : 'Pick a situation — we show services, contacts and next steps. Cards are grouped by life area.'}
          </p>

          {/* Persona chip-row */}
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

          {/* Search */}
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

          {/* Map link — moved to hero area, no longer floating in corner */}
          <div className="mt-4">
            <Link
              to="/map"
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium',
                'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors',
              )}
              aria-label={isRu ? 'Карта Пхукета' : 'Phuket map'}
            >
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
              {isRu ? 'Показать на карте Пхукета' : 'See on Phuket map'}
            </Link>
          </div>
        </header>

        {/* Sticky cluster tabs — quick scroll to section */}
        {!isLoading && visibleClusters.length > 1 && (
          <div
            className="sticky top-[56px] z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-6 bg-background/95 backdrop-blur border-b border-border"
            role="tablist"
            aria-label={isRu ? 'Сферы жизни' : 'Life areas'}
          >
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => { setActiveCluster('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                role="tab"
                aria-selected={activeCluster === 'all'}
                className={cn(
                  'shrink-0 px-3 py-1.5 text-[12px] font-medium border whitespace-nowrap transition-colors',
                  activeCluster === 'all'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40',
                )}
              >
                {isRu ? 'Все' : 'All'}
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{filteredSituations.length}</span>
              </button>
              {visibleClusters.map((cid) => {
                const cluster = CLUSTERS.find((c) => c.id === cid)!;
                const label = isRu ? cluster.labelRu : cluster.labelEn;
                const isActive = activeCluster === cid;
                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => scrollToCluster(cid)}
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      'shrink-0 px-3 py-1.5 text-[12px] font-medium border whitespace-nowrap transition-colors',
                      isActive
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40',
                    )}
                    style={isActive ? undefined : { borderLeftWidth: 2, borderLeftColor: cluster.color }}
                  >
                    {label}
                    <span className="ml-1.5 font-mono text-[10px] opacity-60">{grouped[cid].length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        {/* Grouped sections by cluster */}
        {!isLoading && situations && situations.length > 0 && filteredSituations.length > 0 && (
          <div className="space-y-10 md:space-y-12">
            {visibleClusters.map((cid) => (
              <NavigatorClusterSection
                key={cid}
                clusterId={cid}
                situations={grouped[cid]}
                counts={counts}
              />
            ))}
          </div>
        )}

        {/* Empty search */}
        {!isLoading && situations && situations.length > 0 && filteredSituations.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm mb-4">
              {isRu ? `Ничего не найдено по запросу «${query}».` : `No matches for "${query}".`}
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[13px] underline text-primary hover:no-underline"
            >
              {isRu ? 'Сбросить поиск' : 'Clear search'}
            </button>
          </div>
        )}

        {/* Empty DB — fallback to 6 cluster CTAs */}
        {!isLoading && situations && situations.length === 0 && (
          <div className="border border-border bg-card p-8 text-center space-y-6">
            <div>
              <h2 className="text-[20px] font-serif font-semibold text-foreground mb-2">
                {isRu ? 'Ситуации скоро появятся' : 'Situations are coming soon'}
              </h2>
              <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
                {isRu
                  ? 'Пока выберите сферу жизни — мы покажем все доступные сервисы.'
                  : 'Meanwhile pick a life area — we will show all available services.'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {CLUSTER_ORDER.map((cid) => {
                const c = CLUSTERS.find((x) => x.id === cid)!;
                return (
                  <Link
                    key={cid}
                    to={c.homeRoute ?? '/'}
                    className="border border-border hover:border-primary/40 p-4 text-left transition-colors"
                    style={{ borderLeftWidth: 3, borderLeftColor: c.color }}
                  >
                    <div className="text-[13px] font-semibold text-foreground">
                      {isRu ? c.labelRu : c.labelEn}
                    </div>
                  </Link>
                );
              })}
            </div>
            <a
              href="https://wa.me/66922407355"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[13px] underline text-primary hover:no-underline"
            >
              {isRu ? 'Связаться с консьержем' : 'Talk to concierge'}
            </a>
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
