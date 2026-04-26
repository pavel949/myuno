/**
 * NavigatorPage — Super-app ecosystem map (fintech tile layout)
 * Accessible from bottom nav "Navigator" tab
 */
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LayoutGrid, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { NavChips, type NavChipItem } from '@/components/nav/NavChips';
import {
  filterCatalogForUser,
  getClusterHeaderLabel,
  getClusterServiceLocalizedLabel,
  getClusterValueLine,
  type ClusterService,
  type ClusterCatalogEntry,
} from '@/lib/nav/clusterCatalog';
import { resolveNavRole } from '@/lib/nav/navigationModel';
import { pickTriplet } from '@/lib/ecosystemGlossary';
import type { Language } from '@/i18n';

function NavigatorStatsFooter({
  stats,
  language,
}: {
  stats: { properties: number; bookings: number; providers: number } | undefined;
  language: Language;
}) {
  if (stats === undefined) {
    return (
      <p className="text-xs text-muted-foreground">
        {pickTriplet({ ru: 'Загрузка…', en: 'Loading…', th: 'กำลังโหลด…' }, language)}
      </p>
    );
  }

  const chunks: React.ReactNode[] = [];
  if (stats.properties > 0)
    chunks.push(
      <span key="p">
        <span className="text-primary font-bold">{stats.properties}+</span>{' '}
        {pickTriplet({ ru: 'объектов', en: 'properties', th: 'อสังหาฯ' }, language)}
      </span>
    );
  if (stats.bookings > 0)
    chunks.push(
      <span key="b">
        <span className="text-primary font-bold">{stats.bookings}+</span>{' '}
        {pickTriplet({ ru: 'бронирований', en: 'bookings', th: 'การจอง' }, language)}
      </span>
    );
  if (stats.providers > 0)
    chunks.push(
      <span key="v">
        <span className="text-primary font-bold">{stats.providers}+</span>{' '}
        {pickTriplet({ ru: 'партнёров', en: 'partners', th: 'พาร์ทเนอร์' }, language)}
      </span>
    );

  if (chunks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        {pickTriplet(
          {
            ru: 'Сервисы и партнёры на Пхукете — в одной экосистеме. Поддержка 24/7.',
            en: 'Phuket services & partners in one ecosystem. 24/7 support.',
            th: 'บริการและพาร์ทเนอร์ภูเก็ตในระบบเดียว ซัพพอร์ต 24/7',
          },
          language
        )}
      </p>
    );
  }

  const out: React.ReactNode[] = [];
  chunks.forEach((el, i) => {
    out.push(el);
    if (i < chunks.length - 1) out.push(<span key={`d${i}`} className="mx-2 text-muted-foreground/40">·</span>);
  });
  out.push(<span key="d247" className="mx-2 text-muted-foreground/40">·</span>);
  out.push(
    <span key="247">
      <span className="text-primary font-bold">24/7</span>{' '}
      {pickTriplet({ ru: 'поддержка', en: 'support', th: 'ซัพพอร์ต' }, language)}
    </span>
  );

  return <p className="text-xs text-muted-foreground leading-relaxed">{out}</p>;
}

// DS2.0: map taxonomy cluster id → semantic Tailwind token name (literal classes only)
type ClusterTokenId = 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build';

const CLUSTER_TILE_BG: Record<ClusterTokenId, string> = {
  arrive: 'bg-cluster-arrive/10',
  live: 'bg-cluster-live/10',
  manage: 'bg-cluster-manage/10',
  invest: 'bg-cluster-invest/10',
  legal: 'bg-cluster-legal/10',
  build: 'bg-cluster-build/10',
};

const CLUSTER_TILE_BORDER: Record<ClusterTokenId, string> = {
  arrive: 'border-cluster-arrive/15',
  live: 'border-cluster-live/15',
  manage: 'border-cluster-manage/15',
  invest: 'border-cluster-invest/15',
  legal: 'border-cluster-legal/15',
  build: 'border-cluster-build/15',
};

const CLUSTER_HEADER_BG: Record<ClusterTokenId, string> = {
  arrive: 'bg-cluster-arrive/15',
  live: 'bg-cluster-live/15',
  manage: 'bg-cluster-manage/15',
  invest: 'bg-cluster-invest/15',
  legal: 'bg-cluster-legal/15',
  build: 'bg-cluster-build/15',
};

const CLUSTER_FG: Record<ClusterTokenId, string> = {
  arrive: 'text-cluster-arrive',
  live: 'text-cluster-live',
  manage: 'text-cluster-manage',
  invest: 'text-cluster-invest',
  legal: 'text-cluster-legal',
  build: 'text-cluster-build',
};

function resolveClusterToken(id: string): ClusterTokenId {
  return (['arrive', 'live', 'manage', 'invest', 'legal', 'build'] as ClusterTokenId[]).includes(
    id as ClusterTokenId,
  )
    ? (id as ClusterTokenId)
    : 'live';
}

function ServiceTile({
  service,
  clusterId,
  language,
  onNavigate,
}: {
  service: ClusterService;
  clusterId: string;
  language: Language;
  onNavigate: (path: string) => void;
}) {
  const SIcon = service.icon;
  const isSoon = service.status === 'soon';
  const isPro = service.status === 'pro';
  const token = resolveClusterToken(clusterId);

  return (
    <button
      onClick={() => !isSoon && onNavigate(service.path)}
      className={cn(
        'relative flex flex-col items-center justify-start gap-1.5 p-2',
        'w-[88px] min-w-[88px] h-[96px] rounded-sm border',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
        'transition-all duration-150 snap-start shrink-0 active:scale-[0.98]',
        CLUSTER_TILE_BG[token],
        CLUSTER_TILE_BORDER[token],
        isSoon && 'opacity-40 pointer-events-none',
      )}
      disabled={isSoon}
      aria-label={getClusterServiceLocalizedLabel(service, language)}
    >
      <SIcon className={cn('w-6 h-6 shrink-0 mt-1', CLUSTER_FG[token])} />
      <span className="text-[11px] font-medium text-foreground leading-[1.15] text-center line-clamp-2 w-full">
        {getClusterServiceLocalizedLabel(service, language)}
      </span>
      {isPro && (
        <span className="absolute top-1 right-1 text-[7px] font-bold px-1 py-px rounded-sm bg-amber-500/15 text-amber-500">
          PRO
        </span>
      )}
      {isSoon && (
        <span className="absolute top-1 right-1 text-[7px] font-medium px-1 py-px rounded-sm bg-muted/40 text-muted-foreground">
          Soon
        </span>
      )}
    </button>
  );
}

export default function NavigatorPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { personas } = useUserPersonas();
  const [query, setQuery] = useState('');
  const [activeCluster, setActiveCluster] = useState<string>('all');

  // SSOT-driven audience filter: workspace clusters (manage) hidden from
  // bare guests; investor/owner/developer personas unlock their own clusters.
  // Same contract as AppDrawer/AllAppsDrawer — see clusterCatalog.test.ts.
  const role = useMemo(
    () =>
      resolveNavRole({
        activeRole: (user?.user_metadata as { role?: string } | undefined)?.role ?? null,
        pathname: location.pathname,
      }),
    [user, location.pathname],
  );

  const audienceClusters: ClusterCatalogEntry[] = useMemo(
    () => filterCatalogForUser({ personas, role }),
    [personas, role],
  );

  // Flat lists derived from audience-filtered set (counts + search corpus)
  const audienceServicesAll = useMemo(
    () =>
      audienceClusters.flatMap((c) =>
        c.services.map((s) => ({
          ...s,
          clusterId: c.id,
          clusterColor: c.color,
          clusterLabelRu: c.labelRu,
          clusterLabelEn: c.labelEn,
        })),
      ),
    [audienceClusters],
  );
  const audienceAvailable = useMemo(
    () => audienceServicesAll.filter((s) => s.status !== 'soon'),
    [audienceServicesAll],
  );
  const audienceSoon = useMemo(
    () => audienceServicesAll.filter((s) => s.status === 'soon'),
    [audienceServicesAll],
  );
  const totalAvailable = audienceAvailable.length;

  const clusterChips: NavChipItem[] = useMemo(
    () => [
      {
        id: 'all',
        label: pickTriplet({ ru: 'Все', en: 'All', th: 'ทั้งหมด' }, language),
        count: totalAvailable,
      },
      ...audienceClusters.map((c) => ({
        id: c.id,
        label: getClusterHeaderLabel(c, language),
        accentColor: c.color,
        count: c.services.filter((s) => s.status !== 'soon').length,
      })),
    ],
    [language, audienceClusters, totalAvailable],
  );

  const visibleClusters = useMemo(
    () =>
      activeCluster === 'all'
        ? audienceClusters
        : audienceClusters.filter((c) => c.id === activeCluster),
    [activeCluster, audienceClusters],
  );

  const { data: stats } = useQuery({
    queryKey: ['navigator-stats'],
    queryFn: async () => {
      const [properties, bookings, providers] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('property_bookings').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return {
        properties: properties.count ?? 0,
        bookings: bookings.count ?? 0,
        providers: providers.count ?? 0,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const trimmedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return null;
    return audienceAvailable.filter((s) => {
      const label = getClusterServiceLocalizedLabel(s, language);
      const cluster = pickTriplet(
        { ru: s.clusterLabelRu, en: s.clusterLabelEn, th: s.clusterLabelEn },
        language
      );
      return (
        label.toLowerCase().includes(trimmedQuery) ||
        cluster.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [trimmedQuery, language]);

  return (
    <AppLayout>
      <div className="px-4 py-6 pb-24 max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-[22px] font-display font-bold text-foreground">
            {pickTriplet({ ru: 'Навигатор', en: 'Navigator', th: 'นาวิเกเตอร์' }, language)}
          </h1>
          <p className="text-sm text-muted-foreground leading-snug">
            {pickTriplet(
              {
                ru: `${totalAvailable} сервисов · один суперапп myUNO`,
                en: `${totalAvailable} services · one myUNO superapp`,
                th: `${totalAvailable} บริการ · ซูเปอร์แอป myUNO แอปเดียวจบ`,
              },
              language
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={pickTriplet(
              { ru: 'Найти сервис…', en: 'Search services…', th: 'ค้นหาบริการ…' },
              language
            )}
            className={cn(
              'w-full h-10 pl-9 pr-9 rounded-none text-sm',
              'bg-[hsl(var(--bg-elevated))] border border-[hsl(0_0%_100%_/_0.07)]',
              'text-foreground placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-1 focus:ring-primary/40',
            )}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Cluster filter chips — only when not searching */}
        {searchResults === null && (
          <NavChips
            items={clusterChips}
            activeId={activeCluster}
            onChange={setActiveCluster}
            ariaLabel={pickTriplet(
              { ru: 'Фильтр по кластерам', en: 'Filter by cluster', th: 'กรองตามกลุ่ม' },
              language
            )}
          />
        )}

        {/* Search results — grid of tiles */}
        {searchResults !== null && (
          <div className="space-y-2">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {pickTriplet(
                  { ru: 'Ничего не найдено', en: 'No results found', th: 'ไม่พบผลลัพธ์' },
                  language
                )}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searchResults.map(service => (
                  <ServiceTile
                    key={`search-${service.path}-${service.labelEn}`}
                    service={service}
                    clusterId={service.clusterId}
                    language={language}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cluster tile rows — filtered by activeCluster */}
        {searchResults === null && (
          <div className="space-y-5">
            {visibleClusters.map(cluster => {
              const Icon = cluster.icon;
              const services = cluster.services;
              const availableCount = services.filter(s => s.status !== 'soon').length;
              const token = resolveClusterToken(cluster.id);

              return (
                <section key={cluster.id}>
                  {/* Cluster header */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-sm flex items-center justify-center shrink-0',
                        CLUSTER_HEADER_BG[token],
                      )}
                    >
                      <Icon className={cn('w-5 h-5', CLUSTER_FG[token])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            'text-[13px] font-display font-bold tracking-wide',
                            CLUSTER_FG[token],
                          )}
                        >
                          {getClusterHeaderLabel(cluster, language)}
                        </h3>
                        <span className="text-[10px] text-muted-foreground/50 font-medium">
                          {availableCount}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground/70 leading-snug line-clamp-1">
                        {getClusterValueLine(cluster, language)}
                      </p>
                    </div>
                  </div>

                  {/* Tile row — horizontal scroll */}
                  <div className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-1">
                    {services.map(service => (
                      <ServiceTile
                        key={`${cluster.id}-${service.path}-${service.labelEn}`}
                        service={service}
                        clusterId={cluster.id}
                        language={language}
                        onNavigate={navigate}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Coming soon */}
        {searchResults === null && audienceSoon.length > 0 && (
          <div className="rounded-sm p-4 space-y-3 bg-card-elevated border border-border/40">
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              {pickTriplet({ ru: 'Скоро', en: 'Coming soon', th: 'เร็ว ๆ นี้' }, language)}
            </p>
            <div className="flex flex-wrap gap-2">
              {audienceSoon.map(s => {
                const SIcon = s.icon;
                const soonToken = resolveClusterToken(s.clusterId);
                return (
                  <div
                    key={`soon-${s.labelEn}`}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-sm border opacity-60',
                      CLUSTER_TILE_BG[soonToken],
                      CLUSTER_TILE_BORDER[soonToken],
                    )}
                  >
                    <SIcon className={cn('w-3.5 h-3.5', CLUSTER_FG[soonToken])} />
                    <span className={cn('text-[11px] font-medium', CLUSTER_FG[soonToken])}>
                      {getClusterServiceLocalizedLabel(s, language)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats + All apps link */}
        {searchResults === null && (
          <div
            className="rounded-none p-4 space-y-3 text-center"
            style={{ background: 'hsl(var(--bg-surface))', border: '1px solid hsl(0 0% 100% / 0.05)' }}
          >
            <NavigatorStatsFooter stats={stats} language={language} />
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigator:open-apps-drawer'));
              }}
              className="inline-flex items-center gap-1.5 text-[12px] text-primary font-medium hover:underline"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {pickTriplet(
                { ru: 'Все сервисы →', en: 'All services →', th: 'บริการทั้งหมด →' },
                language
              )}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
