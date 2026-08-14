/**
 * NavigatorPage v3 — civic-grade /discover surface.
 *
 * Single vertical column: compact role+search row → "For you" top-3 → first 3
 * clusters as compact lists, role-gated. Additional clusters collapsed behind
 * "More". One source of truth for service counts (RPC).
 * Calm, authoritative, GOV-style — answers one question per screen:
 * "what should I do next?".
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, SlidersHorizontal, X, ArrowRight, ChevronDown } from 'lucide-react';
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
import { resolveSituationHref } from '@/lib/navigation/situationLandingMap';
import { trackSituationClick } from '@/lib/analytics/track';
import { formatServices } from '@/lib/i18n/pluralize';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { createErrorHandler } from '@/lib/errorHandler';
import { NavigatorClusterSection } from './NavigatorClusterSection';
import { PersonalGrid } from '@/components/superapp/PersonalGrid';
import type { LifeSituation } from '@/hooks/useLifeOS';

const errorLog = createErrorHandler('NavigatorPageV3');

const CLUSTER_ORDER: ClusterId[] = ['arrive', 'live', 'legal', 'manage', 'invest', 'build'];
const MAX_VISIBLE_CLUSTERS = 3;

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

/** situationCode -> primary clusterId — derived from a static SSOT, computed once. */
const SITUATION_CLUSTER_MAP: Record<string, ClusterId> = buildSituationClusterMap();

export default function NavigatorPageV3() {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';
  const { data: situations, isLoading, isError } = useLifeSituations();
  const { data: counts, isError: countsError } = useSituationServiceCounts();
  const { personas, effectivePersonas, togglePersona, setPersonas } = useUserPersonas();
  const role = useLifeOSRole();
  const [query, setQuery] = useState('');
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Service counts are an enhancement, not a blocker — but surface the failure
  // to monitoring instead of silently showing every situation as "open".
  useEffect(() => {
    if (countsError) {
      errorLog.silent(new Error('useSituationServiceCounts failed'), 'load_service_counts');
    }
  }, [countsError]);

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
      const cid = SITUATION_CLUSTER_MAP[s.code] ?? 'live';
      buckets[cid].push(s);
    }
    return buckets;
  }, [filteredSituations]);

  // code -> {ru,en} label map for MiniAppCard hint resolution
  const situationLabels = useMemo(() => {
    const m: Record<string, { ru: string; en: string }> = {};
    for (const s of situations ?? []) {
      m[s.code] = { ru: s.title_ru, en: s.title_en };
    }
    return m;
  }, [situations]);

  // Role-gated cluster order — show at most 3 primary clusters, rest collapsible
  const roleClusters = ROLE_VISIBLE_CLUSTERS[role];
  const hiddenClusters = ROLE_HIDDEN_CLUSTERS[role];
  const visibleClusters = useMemo(() => {
    const hidden = new Set(hiddenClusters);
    const rolePrimary = roleClusters.filter(
      (cid) => !hidden.has(cid) && grouped[cid].length > 0,
    );
    const other = CLUSTER_ORDER.filter(
      (cid) =>
        !hidden.has(cid) &&
        !rolePrimary.includes(cid) &&
        grouped[cid].length > 0,
    );
    const primary = rolePrimary.slice(0, MAX_VISIBLE_CLUSTERS);
    const overflowRole = rolePrimary.slice(MAX_VISIBLE_CLUSTERS);
    const rest = [...overflowRole, ...other];
    return { primary, rest };
  }, [roleClusters, hiddenClusters, grouped]);

  // Top-3 "For you" — first 3 ranked situations matching a visible cluster
  const forYou = useMemo(() => {
    const allowed = new Set([...visibleClusters.primary, ...visibleClusters.rest]);
    return filteredSituations
      .filter((s) => allowed.has(SITUATION_CLUSTER_MAP[s.code] ?? 'live'))
      .slice(0, 3);
  }, [filteredSituations, visibleClusters]);

  const hasRealPersonas = personas.length > 0;

  const roleLabel = useMemo(() => {
    if (!hasRealPersonas) return t('discover.roleEmpty');
    const firstPersona = effectivePersonas[0];
    const meta = ROLE_META[firstPersona];
    if (!meta) return firstPersona;
    return isRu ? meta.labelRu : meta.label;
  }, [hasRealPersonas, effectivePersonas, isRu, t]);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24 md:px-6 md:pt-10 max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
            {t('discover.navigator')}
          </p>
          <h1 className="text-[28px] sm:text-[34px] font-serif font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            {t('discover.title')}
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15px] text-muted-foreground leading-[1.5] max-w-2xl">
            {t('discover.subtitle')}
          </p>

          {/* Role + search single row */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRoleSheetOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium border border-border text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors shrink-0 min-h-[44px]"
              aria-label={t('discover.editRole')}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {t('discover.role')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 bg-muted border-l-2 border-primary">
                {roleLabel}
              </span>
              <SlidersHorizontal aria-hidden="true" className="w-3 h-3 text-muted-foreground" strokeWidth={2} />
            </button>

            <div className="relative flex-1 min-w-0">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground pointer-events-none"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('discover.search.placeholder')}
                className={cn(
                  'w-full pl-[46px] pr-12 py-3.5 text-[14px] outline-none',
                  'border border-border bg-card text-foreground placeholder:text-muted-foreground',
                  'focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
                )}
                aria-label={t('discover.search.label')}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t('discover.clearSearch')}
                >
                  <X aria-hidden="true" className="w-4 h-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>

          {/* Map link */}
          <div className="mt-4 flex justify-end">
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <MapPin aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={1.75} />
              {t('discover.map')}
            </Link>
          </div>
        </header>

        {isError && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 text-sm mb-6">
            {t('discover.errorLoad')}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`nav-skeleton-${i}`} className="h-14 w-full rounded-none" />
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
                {t('discover.forYou')}
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
                const href = resolveSituationHref(s.code);
                return (
                  <li key={s.id}>
                    <Link
                      to={href}
                      onClick={() => trackSituationClick(s.code, {
                        source: 'navigator_v3_for_you',
                        href,
                        count: c,
                      })}
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
                        {typeof c === 'number' && c > 0 ? formatServices(c, language) : t('discover.open')}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
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
                situationLabels={situationLabels}
              />
            ))}
          </div>
        )}

        {/* Other clusters (collapsed behind "More") */}
        {!isLoading && visibleClusters.rest.length > 0 && (
          <div className="mt-12">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-border text-[13px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              {showMore ? t('discover.showLess') : t('discover.moreAreas').replace('{count}', String(visibleClusters.rest.length))}
              <ChevronDown
                aria-hidden="true"
                className={cn('w-4 h-4 transition-transform', showMore && 'rotate-180')}
                strokeWidth={1.75}
              />
            </button>
            {showMore && (
              <div className="mt-8 pt-8 border-t border-border space-y-10">
                {visibleClusters.rest.map((cid) => (
                  <NavigatorClusterSection
                    key={cid}
                    clusterId={cid}
                    situations={grouped[cid]}
                    counts={counts}
                    hideAppGrid
                    situationLabels={situationLabels}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty search */}
        {!isLoading && situations && situations.length > 0 && filteredSituations.length === 0 && (
          <div className="text-center py-16 border border-border">
            <p className="text-muted-foreground text-sm mb-4">
              {t('discover.emptySearch').replace('{query}', query)}
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[13px] underline text-primary hover:no-underline"
            >
              {t('discover.clearSearchAction')}
            </button>
          </div>
        )}

        {/* Empty DB */}
        {!isLoading && situations && situations.length === 0 && (
          <div className="border border-border bg-card p-8 text-center">
            <h2 className="text-[18px] font-serif font-semibold text-foreground mb-2">
              {t('discover.situationsSoon')}
            </h2>
            <a
              href={getWhatsAppUrl(
                isRu
                  ? 'Здравствуйте! Подскажите по сервисам myUNO.'
                  : 'Hello! I have a question about myUNO services.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-[13px] underline text-primary hover:no-underline"
            >
              {t('discover.contactConcierge')}
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
