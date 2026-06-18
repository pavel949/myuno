/**
 * NavigatorPage v3 — civic-grade /discover surface.
 *
 * Single vertical column: persona chip-row → "For you" top-3 → clusters as
 * compact lists, role-gated. One source of truth for service counts (RPC).
 * Calm, authoritative, GOV-style — answers one question per screen:
 * "what should I do next?".
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, SlidersHorizontal, X, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLifeSituations, useLifeOSRole, type LifeOSRole } from '@/hooks/useLifeOS';
import { useSituationServiceCounts } from '@/hooks/useSituationServiceCounts';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { rankSituationsByPersonas } from '@/lib/situationBlend';
import { ROLE_META } from '@/lib/roleBlend';
import { RoleSheet } from '@/components/home/RoleSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CLUSTER_LIFE_SITUATIONS, type ClusterId } from '@/lib/catalog/taxonomy';
import { NavigatorClusterSection } from './NavigatorClusterSection';
import { PersonalGrid } from '@/components/superapp/PersonalGrid';
import type { LifeSituation } from '@/hooks/useLifeOS';

const CLUSTER_ORDER: ClusterId[] = ['arrive', 'live', 'legal', 'manage', 'invest', 'build'];

/** Which clusters each LifeOSRole sees, in order (first = default emphasis). */
const ROLE_VISIBLE_CLUSTERS: Record<LifeOSRole, ClusterId[]> = {
  guest:     ['arrive', 'live', 'legal'],
  resident:  ['live', 'legal', 'arrive'],
  owner:     ['manage', 'live', 'legal', 'invest'],
  mc:        ['manage', 'legal', 'invest'],
  investor:  ['invest', 'manage', 'legal', 'build'],
  developer: ['build', 'invest', 'manage', 'legal'],
  vendor:    ['manage', 'legal', 'live'],
};

/** Clusters explicitly hidden per role — never shown, even in "Other areas". */
const ROLE_HIDDEN_CLUSTERS: Record<LifeOSRole, ClusterId[]> = {
  guest:     ['manage', 'build', 'invest'],
  resident:  ['manage', 'build'],
  owner:     ['build'],
  mc:        ['build'],
  investor:  [],
  developer: [],
  vendor:    ['build', 'invest'],
};

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
  const role = useLifeOSRole();
  const [query, setQuery] = useState('');
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);

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

  // Group situations by primary cluster
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

  // code -> {ru,en} label map for MiniAppCard hint resolution
  const situationLabels = useMemo(() => {
    const m: Record<string, { ru: string; en: string }> = {};
    for (const s of situations ?? []) {
      m[s.code] = { ru: s.title_ru, en: s.title_en };
    }
    return m;
  }, [situations]);



  // Role-gated cluster order — hidden clusters disappear entirely
  const roleClusters = ROLE_VISIBLE_CLUSTERS[role];
  const hiddenClusters = ROLE_HIDDEN_CLUSTERS[role];
  const visibleClusters = useMemo(() => {
    const hidden = new Set(hiddenClusters);
    const primary = roleClusters.filter(
      (cid) => !hidden.has(cid) && grouped[cid].length > 0,
    );
    const rest = CLUSTER_ORDER.filter(
      (cid) =>
        !hidden.has(cid) &&
        !primary.includes(cid) &&
        grouped[cid].length > 0,
    );
    return { primary, rest };
  }, [roleClusters, hiddenClusters, grouped]);

  // Top-3 "For you" — first 3 ranked situations matching a visible cluster
  const forYou = useMemo(() => {
    const allowed = new Set([...visibleClusters.primary, ...visibleClusters.rest]);
    return filteredSituations
      .filter((s) => allowed.has(situationClusterMap[s.code] ?? 'live'))
      .slice(0, 3);
  }, [filteredSituations, visibleClusters, situationClusterMap]);

  const hasRealPersonas = personas.length > 0;

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24 md:px-6 md:pt-10 max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
            {isRu ? 'Навигатор' : 'Navigator'}
          </p>
          <h1 className="text-[28px] sm:text-[34px] font-serif font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            {isRu ? 'Что вам сейчас нужно?' : 'What do you need now?'}
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15px] text-muted-foreground leading-[1.5] max-w-2xl">
            {isRu
              ? 'Выберите ситуацию — покажем сервисы, контакты и понятные шаги. Сгруппировано по сферам жизни и адаптировано под вашу роль.'
              : 'Pick a situation — we surface services, contacts and clear next steps, grouped by life area and tuned to your role.'}
          </p>

          {/* Persona chip-row */}
          <div className="mt-6 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {isRu ? 'Роль' : 'Role'}
            </span>
            {hasRealPersonas ? (
              effectivePersonas.slice(0, 3).map((persona) => {
                const meta = ROLE_META[persona];
                if (!meta) return null;
                return (
                  <span
                    key={persona}
                    className="inline-flex items-center px-2.5 py-1 text-[12px] font-medium text-foreground bg-muted border-l-2 border-primary"
                  >
                    {isRu ? meta.labelRu : meta.label}
                  </span>
                );
              })
            ) : (
              <span className="text-[12px] text-muted-foreground italic">
                {isRu ? 'не выбрана' : 'not set'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setRoleSheetOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors min-h-[28px]"
            >
              <SlidersHorizontal className="w-3 h-3" strokeWidth={2} />
              {isRu ? 'Изменить' : 'Edit'}
            </button>
          </div>

          {/* Search */}
          <div className="mt-5 relative">
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

          {/* Map link */}
          <div className="mt-4">
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
              {isRu ? 'Показать на карте' : 'See on map'}
            </Link>
          </div>
        </header>

        {isError && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 text-sm mb-6">
            {isRu ? 'Не удалось загрузить ситуации.' : 'Failed to load situations.'}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-none" />
            ))}
          </div>
        )}

        {/* Personalized mini-apps grid (superapp surface) */}
        {!isLoading && !query && (
          <div className="-mx-4 md:-mx-6 mb-8">
            <PersonalGrid limit={8} />
          </div>
        )}

        {/* "For you" situations */}
        {!isLoading && !query && forYou.length > 0 && (
          <section className="mb-10" aria-labelledby="for-you-title">
            <header className="flex items-baseline justify-between gap-3 pb-3 mb-1 border-b-2 border-primary">
              <h2
                id="for-you-title"
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary"
              >
                {isRu ? 'Ситуации для вас' : 'Situations for you'}
              </h2>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {forYou.length}
              </span>
            </header>
            <ul className="divide-y divide-border">
              {forYou.map((s) => {
                const title = isRu ? s.title_ru : s.title_en;
                const desc = isRu ? s.description_ru : s.description_en;
                const c = counts?.[s.id];
                return (
                  <li key={s.id}>
                    <Link
                      to={`/discover/${s.code}`}
                      className="group flex items-center gap-4 py-5 -mx-2 px-2 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors min-h-[64px]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[17px] font-semibold text-foreground leading-tight tracking-[-0.005em]">
                          {title}
                        </div>
                        {desc && (
                          <div className="mt-1 text-[13px] text-muted-foreground leading-snug line-clamp-2">
                            {desc}
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-[12px] text-muted-foreground tabular-nums shrink-0">
                        {typeof c === 'number' && c > 0 ? c : '—'}
                      </span>
                      <ArrowRight
                        className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Primary clusters */}
        {!isLoading && filteredSituations.length > 0 && (
          <div className="space-y-10">
            {visibleClusters.primary.map((cid) => (
              <NavigatorClusterSection
                key={cid}
                clusterId={cid}
                situations={grouped[cid]}
                counts={counts}
              />
            ))}
          </div>
        )}

        {/* Other clusters (muted, expandable) */}
        {!isLoading && visibleClusters.rest.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
              {isRu ? 'Другие сферы' : 'Other areas'}
            </p>
            <div className="space-y-10">
              {visibleClusters.rest.map((cid) => (
                <NavigatorClusterSection
                  key={cid}
                  clusterId={cid}
                  situations={grouped[cid]}
                  counts={counts}
                  hideAppGrid
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty search */}
        {!isLoading && situations && situations.length > 0 && filteredSituations.length === 0 && (
          <div className="text-center py-16 border border-border">
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

        {/* Empty DB */}
        {!isLoading && situations && situations.length === 0 && (
          <div className="border border-border bg-card p-8 text-center">
            <h2 className="text-[18px] font-serif font-semibold text-foreground mb-2">
              {isRu ? 'Ситуации скоро появятся' : 'Situations are coming soon'}
            </h2>
            <a
              href="https://wa.me/66922407355"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-[13px] underline text-primary hover:no-underline"
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
