/**
 * PersonaHalo — signature home navigation module ("госуслуги-про" tone).
 *
 * Replaces the generic horizontal chip strip with a calm, dashboard-like
 * grid of 6 cluster quanta orbiting the user identity tile.
 *
 *  - Center-left: square identity tile (initials/avatar) + status line
 *    (name · place · time-of-day). Tap → opens RoleSheet.
 *  - 6 sector quanta (Arrive · Live · Manage · Invest · Legal · Build)
 *    laid out as a strict grid. Active clusters (via CLUSTER_SCORES vs
 *    user personas) render at full opacity with a 2px navy spine; passive
 *    ones dim to 50% so the user still sees the whole world but their
 *    own surfaces are highlighted.
 *  - One soft orange-400 dot indicator when there's pending activity in
 *    a cluster (initial wiring: Manage gets the dot when there are open
 *    bookings/orders for the user; future iterations can wire per-cluster
 *    counters from real DB signals).
 *
 * Visual rules (governance):
 *  - rounded-none, 1px borders, 2px navy spine — no shadows, no motion.
 *  - All colors via semantic tokens (`hsl(var(--primary))`, cluster vars).
 *  - Tap targets ≥ 56px; module fits 339px Telegram WebView without clip.
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CLUSTER_CATALOG, type ClusterCatalogEntry } from '@/lib/nav/clusterCatalog';
import { useClusterActivity } from '@/hooks/useClusterActivity';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { cn } from '@/lib/utils';

// Persona → cluster affinity (mirrors CLUSTER_SCORES in roleBlend.ts).
// Local copy keeps PersonaHalo independent from the heavier blendClusters
// pipeline; if a persona scores ≥ 3 on a cluster we light it up.
const PERSONA_CLUSTER_AFFINITY: Record<UserPersona, Record<string, number>> = {
  tourist:                 { arrive: 5, live: 4, legal: 1 },
  resident:                { live: 5, legal: 4, manage: 3, invest: 2 },
  property_owner:          { manage: 5, invest: 4, legal: 3, live: 2 },
  investor:                { invest: 5, legal: 3, manage: 2, build: 2 },
  real_estate_developer:   { build: 5, invest: 4, legal: 3, manage: 2 },
  local_services_provider: { live: 5, manage: 4, legal: 2 },
  family:                  { live: 4, legal: 3, arrive: 2 },
  couple:                  { live: 5, arrive: 3 },
  nightlife:               { live: 5, arrive: 2 },
  active:                  { live: 4, arrive: 3 },
  business:                { live: 3, legal: 4, manage: 3, invest: 2 },
  nomad:                   { live: 4, legal: 3, arrive: 2 },
  pet_owner:               { live: 5, manage: 2 },
  relocation:              { arrive: 5, legal: 4, live: 3, manage: 2 },
};

const ACTIVE_THRESHOLD = 3;

function getActiveClusterIds(personas: UserPersona[]): Set<string> {
  const scores: Record<string, number> = {};
  personas.forEach((p, i) => {
    const weight = i === 0 ? 3 : i === 1 ? 2 : 1;
    const aff = PERSONA_CLUSTER_AFFINITY[p];
    if (!aff) return;
    Object.entries(aff).forEach(([k, v]) => {
      scores[k] = (scores[k] ?? 0) + v * weight;
    });
  });
  return new Set(
    Object.entries(scores)
      .filter(([, v]) => v >= ACTIVE_THRESHOLD)
      .map(([k]) => k),
  );
}

function timeOfDay(isRu: boolean): string {
  const h = new Date().getHours();
  if (h < 5)   return isRu ? 'ночь' : 'night';
  if (h < 12)  return isRu ? 'утро' : 'morning';
  if (h < 17)  return isRu ? 'день' : 'afternoon';
  if (h < 22)  return isRu ? 'вечер' : 'evening';
  return isRu ? 'ночь' : 'night';
}

// Real cluster activity counts now live in `useClusterActivity`. The local
// stub that previously hard-coded a single `manage` signal was removed in
// favor of the canonical multi-table probe.

/**
 * Cluster → deep-link to the user's open items for that cluster, with the
 * matching filter applied. Mirrors `useClusterActivity` source mapping so a
 * tap on the badge lands on a list pre-filtered to exactly the rows that
 * fed the count.
 */
function getClusterDestination(clusterId: string): string | null {
  switch (clusterId) {
    case 'arrive':
      return '/me/bookings?cluster=arrive&status=open';
    case 'live':
      return '/me/bookings?cluster=live&status=open';
    case 'manage':
      // Owner-side bookings list filtered to pending. Falls back gracefully
      // if the user has no MC scope (page renders an empty state).
      return '/mc/bookings-list?status=pending';
    case 'invest':
      return '/me/requests?source=order';
    case 'legal':
      return '/me/requests?source=visa';
    case 'build':
      // No canonical "my partner applications" page yet — fall back to the
      // unified requests board without a source filter.
      return '/me/requests';
    default:
      return null;
  }
}

interface PersonaHaloProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
  /** Background tone — `onNavy` keeps it inside the canonical brand band. */
  variant?: 'default' | 'onNavy';
}

export function PersonaHalo({ personas, onRoleSheetOpen, variant = 'default' }: PersonaHaloProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isOnNavy = variant === 'onNavy';

  const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim();
  const greeting = fullName
    ? fullName.split(' ')[0]
    : isRu ? 'Гость' : 'Guest';
  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (isRu ? 'Г' : 'G');

  const activeIds = useMemo(() => getActiveClusterIds(personas), [personas]);
  const { data: signals } = useClusterActivity(user?.id);

  // Pull all 6 canonical clusters in stable taxonomy order.
  const clusters: ClusterCatalogEntry[] = CLUSTER_CATALOG;

  // Tone-locked atoms.
  const surfaceCls = isOnNavy
    ? 'bg-primary-foreground/[0.04] border-primary-foreground/15'
    : 'bg-card border-border';
  const subtitleCls = isOnNavy ? 'text-primary-foreground/65' : 'text-muted-foreground';
  const labelCls = isOnNavy ? 'text-primary-foreground' : 'text-foreground';
  const dimLabelCls = isOnNavy ? 'text-primary-foreground/50' : 'text-muted-foreground';
  const identityCls = isOnNavy
    ? 'bg-primary-foreground text-primary border-primary-foreground'
    : 'bg-primary text-primary-foreground border-primary';

  return (
    <section
      aria-label={isRu ? 'Навигация по разделам' : 'Section navigation'}
      className="px-1 pb-2"
    >
      {/* Status line — name · place · time-of-day */}
      <div className="flex items-baseline gap-2 px-1 pb-2">
        <span className={cn('font-display text-[13px] font-semibold tracking-tight', labelCls)}>
          {greeting}
        </span>
        <span className={cn('text-[11px] font-mono tabular-nums uppercase tracking-[0.12em]', subtitleCls)}>
          {isRu ? 'Пхукет' : 'Phuket'} · {timeOfDay(isRu)}
        </span>
      </div>

      {/* Halo grid: identity tile (col-span-2 on mobile, col-span-1 from sm) + 6 quanta */}
      <div
        className={cn(
          'grid gap-[1px] border',
          surfaceCls,
          // Mobile: identity full-width row, then 3×2 quanta.
          // sm+: identity left tile, quanta 3×2 to the right.
          'grid-cols-3 sm:grid-cols-4',
        )}
      >
        {/* Identity tile */}
        <button
          type="button"
          onClick={onRoleSheetOpen}
          aria-label={isRu ? 'Управлять ролями' : 'Manage roles'}
          className={cn(
            'col-span-3 sm:col-span-1 sm:row-span-2 relative flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-3 p-3 sm:p-4 min-h-[64px] sm:min-h-[140px] transition-colors',
            isOnNavy
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-card hover:bg-muted/40',
          )}
        >
          <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-3">
            <div
              className={cn(
                'w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-display text-[18px] sm:text-[22px] font-bold border-2 flex-shrink-0',
                identityCls,
              )}
            >
              {initials}
            </div>
            <div className="flex flex-col leading-tight text-left">
              <span className={cn('text-[11px] uppercase tracking-[0.14em] font-semibold', subtitleCls)}>
                {isRu ? 'Мой профиль' : 'My profile'}
              </span>
              <span className={cn('text-[13px] font-semibold mt-0.5 truncate max-w-[160px]', labelCls)}>
                {personas.length === 0
                  ? (isRu ? 'Выбрать роль' : 'Pick a role')
                  : personas.length === 1
                    ? (isRu ? '1 активная роль' : '1 active role')
                    : (isRu ? `${personas.length} роли` : `${personas.length} roles`)}
              </span>
            </div>
          </div>
          {/* Edit affordance */}
          <span
            className={cn(
              'hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold mt-2',
              subtitleCls,
            )}
          >
            {isRu ? 'Изменить' : 'Edit'} →
          </span>
        </button>

        {/* 6 cluster quanta */}
        {clusters.map((c) => {
          const isActive = activeIds.has(c.id) || personas.length === 0;
          // `signals` is keyed by ClusterId; some cluster ids in the
          // catalog may sit outside that union (future-proofing) — fall
          // back to 0 in that case.
          const count = signals?.[c.id as keyof typeof signals] ?? 0;
          const hasSignal = count > 0;
          const Icon = c.icon;
          const label = isRu ? c.labelRu : c.labelEn;

          const badgeDestination = hasSignal ? getClusterDestination(c.id) : null;
          // Outer tile uses div+role="button" (instead of <button>) so we
          // can nest a real <button> for the activity badge — nested
          // <button> inside <button> is invalid HTML and gets sanitized
          // away by some browsers, breaking the deep-link tap.
          const handleTileActivate = () => navigate(c.homeRoute);
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={handleTileActivate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTileActivate();
                }
              }}
              aria-label={
                hasSignal
                  ? `${label} · ${count} ${isRu ? 'активн.' : 'open'}`
                  : label
              }
              className={cn(
                'group relative flex flex-col justify-between p-3 min-h-[72px] sm:min-h-[70px] text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                isOnNavy
                  ? 'bg-primary/95 hover:bg-primary/80'
                  : 'bg-card hover:bg-muted/40',
                !isActive && !hasSignal && 'opacity-50 hover:opacity-75',
              )}
            >
              {/* Cluster spine — 2px accent of cluster color */}
              <span
                aria-hidden
                className="absolute inset-y-2 left-0 w-[2px]"
                style={{ background: c.color }}
              />
              {/* Activity badge — clickable when a destination exists. Tap
                  routes to a pre-filtered list of the user's open items
                  for this cluster (e.g. /me/bookings?cluster=arrive&status=open).
                  Single dot for one open item, numeric pill from 2 onwards. */}
              {hasSignal && badgeDestination && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(badgeDestination);
                  }}
                  aria-label={
                    isRu
                      ? `Открыть ${count} активн. в разделе ${label}`
                      : `Open ${count} active in ${label}`
                  }
                  className={cn(
                    'absolute top-1 right-1 min-w-[22px] h-[22px] px-1 flex items-center justify-center text-[10px] font-mono font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isOnNavy
                      ? 'bg-[hsl(var(--brand-orange-400))] text-primary hover:bg-[hsl(var(--brand-orange-400))]/85'
                      : 'bg-primary text-primary-foreground hover:bg-primary/85',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </button>
              )}
              {/* Fallback: signal exists but no canonical destination — keep
                  a passive dot so the user still sees the indicator. */}
              {hasSignal && !badgeDestination && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-2 right-2 w-1.5 h-1.5 rounded-full',
                    isOnNavy ? 'bg-[hsl(var(--brand-orange-400))]' : 'bg-primary',
                  )}
                />
              )}
              <Icon
                className={cn(
                  'w-[18px] h-[18px]',
                  isActive ? labelCls : dimLabelCls,
                )}
                aria-hidden
              />
              <div className="flex items-end justify-between gap-2 mt-2">
                <span
                  className={cn(
                    'text-[12px] font-semibold leading-tight tracking-tight',
                    isActive ? labelCls : dimLabelCls,
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
