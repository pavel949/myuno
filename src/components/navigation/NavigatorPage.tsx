/**
 * NavigatorPage — Super-app ecosystem map (fintech tile layout)
 * Accessible from bottom nav "Navigator" tab
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { NavChips, type NavChipItem } from '@/components/nav/NavChips';
import {
  CLUSTER_CATALOG,
  CLUSTER_CATALOG_AVAILABLE,
  CLUSTER_CATALOG_SOON,
  CLUSTER_CATALOG_TOTAL_AVAILABLE,
  getClusterHeaderLabel,
  getClusterServiceLocalizedLabel,
  getClusterValueLine,
  type ClusterService,
} from '@/lib/nav/clusterCatalog';
import { pickTriplet } from '@/lib/ecosystemGlossary';
import type { Language } from '@/i18n';

// Local aliases — keep call-sites readable; SSOT lives in clusterCatalog.ts
const CLUSTERS = CLUSTER_CATALOG;
const ALL_SERVICES = CLUSTER_CATALOG_AVAILABLE;
const SOON_SERVICES = CLUSTER_CATALOG_SOON;
const TOTAL_NAVIGATOR_SERVICES = CLUSTER_CATALOG_TOTAL_AVAILABLE;

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

function ServiceTile({
  service,
  clusterColor,
  language,
  onNavigate,
}: {
  service: ClusterService;
  clusterColor: string;
  language: Language;
  onNavigate: (path: string) => void;
}) {
  const SIcon = service.icon;
  const isSoon = service.status === 'soon';
  const isPro = service.status === 'pro';

  return (
    <button
      onClick={() => !isSoon && onNavigate(service.path)}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1.5',
        'w-[72px] min-w-[72px] h-[72px] rounded-none',
        'active:scale-[0.93] transition-all duration-150 snap-start shrink-0',
        isSoon && 'opacity-40 pointer-events-none',
      )}
      style={{ background: clusterColor + '14' }}
      disabled={isSoon}
    >
      <SIcon className="w-5 h-5" style={{ color: clusterColor }} />
      <span className="text-[10px] font-medium text-foreground leading-tight text-center px-1 line-clamp-1">
        {getClusterServiceLocalizedLabel(service, language)}
      </span>
      {isPro && (
        <span
          className="absolute top-1 right-1 text-[7px] font-bold px-1 py-px rounded-full"
          style={{ background: '#F59E0B22', color: '#F59E0B' }}
        >
          PRO
        </span>
      )}
      {isSoon && (
        <span
          className="absolute top-1 right-1 text-[7px] font-medium px-1 py-px rounded-full"
          style={{ background: 'hsl(0 0% 100% / 0.08)', color: 'hsl(var(--muted-foreground))' }}
        >
          Soon
        </span>
      )}
    </button>
  );
}

export default function NavigatorPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCluster, setActiveCluster] = useState<string>('all');

  const clusterChips: NavChipItem[] = useMemo(
    () => [
      {
        id: 'all',
        label: pickTriplet({ ru: 'Все', en: 'All', th: 'ทั้งหมด' }, language),
        count: TOTAL_NAVIGATOR_SERVICES,
      },
      ...CLUSTERS.map((c) => ({
        id: c.id,
        label: getClusterHeaderLabel(c, language),
        accentColor: c.color,
        count: c.services.filter((s) => s.status !== 'soon').length,
      })),
    ],
    [language],
  );

  const visibleClusters = useMemo(
    () => (activeCluster === 'all' ? CLUSTERS : CLUSTERS.filter((c) => c.id === activeCluster)),
    [activeCluster],
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
    return ALL_SERVICES.filter((s) => {
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
                ru: `${TOTAL_NAVIGATOR_SERVICES} сервисов · один суперапп myUNO`,
                en: `${TOTAL_NAVIGATOR_SERVICES} services · one myUNO superapp`,
                th: `${TOTAL_NAVIGATOR_SERVICES} บริการ · ซูเปอร์แอป myUNO แอปเดียวจบ`,
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
                    clusterColor={service.clusterColor}
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

              return (
                <section key={cluster.id}>
                  {/* Cluster header */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className="w-8 h-8 rounded-none flex items-center justify-center shrink-0"
                      style={{ background: cluster.color + '1A' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cluster.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-[13px] font-display font-bold tracking-wide"
                          style={{ color: cluster.color }}
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
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-1">
                    {services.map(service => (
                      <ServiceTile
                        key={`${cluster.id}-${service.path}-${service.labelEn}`}
                        service={service}
                        clusterColor={cluster.color}
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
        {searchResults === null && SOON_SERVICES.length > 0 && (
          <div
            className="rounded-none p-4 space-y-3"
            style={{ background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(0 0% 100% / 0.05)' }}
          >
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              {pickTriplet({ ru: 'Скоро', en: 'Coming soon', th: 'เร็ว ๆ นี้' }, language)}
            </p>
            <div className="flex flex-wrap gap-2">
              {SOON_SERVICES.map(s => {
                const SIcon = s.icon;
                return (
                  <div
                    key={`soon-${s.labelEn}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full opacity-50"
                    style={{ background: s.clusterColor + '14', border: `1px solid ${s.clusterColor}20` }}
                  >
                    <SIcon className="w-3.5 h-3.5" style={{ color: s.clusterColor }} />
                    <span className="text-[11px] font-medium" style={{ color: s.clusterColor }}>
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
