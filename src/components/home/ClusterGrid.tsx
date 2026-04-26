import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { blendClusters } from '@/lib/roleBlend';
import {
  getClusterHeaderLabel,
  getClusterValueLine,
  CLUSTER_CATALOG_TOTAL_AVAILABLE,
} from '@/lib/nav/clusterCatalog';

interface ClusterGridProps {
  personas: UserPersona[];
}

/**
 * ClusterGrid — Home "All sections" grid.
 *
 * Reads cluster meta (label, route, color, services count, value-line) from
 * the SSOT (`src/lib/catalog/taxonomy.ts`) via `clusterCatalog` adapter.
 * Persona ordering comes from `blendClusters` (also audience-filtered, so
 * workspace-only clusters like `manage` stay hidden from guests).
 */
export function ClusterGrid({ personas }: ClusterGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const clusters = useMemo(() => blendClusters(personas), [personas]);

  const totalLabel = isRu
    ? `${CLUSTER_CATALOG_TOTAL_AVAILABLE} сервисов`
    : `${CLUSTER_CATALOG_TOTAL_AVAILABLE} services`;

  return (
    <div className="px-4 pb-5">
      <div className="mb-2.5">
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 font-semibold">
            {isRu ? 'Разделы сервисов' : 'Service sections'}
          </div>
          <div className="text-[11px] text-muted-foreground/50">{totalLabel}</div>
        </div>
        <div className="text-[11px] text-muted-foreground/55 mt-1 leading-snug">
          {isRu ? 'Все сервисы. Сортировка по вашему профилю.' : 'All services. Sorted by your profile.'}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {clusters.map((c) => {
          const availableCount = c.services.filter((s) => s.status !== 'soon').length;
          return (
            <button
              key={c.id}
              onClick={() => navigate(c.homeRoute)}
              className="group relative text-left rounded-none bg-card border border-border p-[14px] pl-[18px] min-h-[92px] flex flex-col justify-between hover:border-primary/40 hover:bg-primary/[0.035] hover:shadow-[0_6px_18px_-12px_hsl(var(--primary)/0.45)] hover:-translate-y-[1px] transition-all duration-200 overflow-hidden"
            >
              {/* Navy spine (full-height) — anchors the card with the brand
                  primary; cluster accent sits to its right as a thin hairline
                  so colour identity is preserved without competing. */}
              <div className="absolute inset-y-0 left-0 w-[4px] bg-primary transition-all group-hover:w-[5px]" />
              <div
                className="absolute inset-y-[10px] left-[4px] w-[2px] opacity-70 transition-opacity group-hover:opacity-100"
                style={{ background: c.color }}
              />
              {/* Soft navy corner wash — lifts the card off the cream
                  background and intensifies on hover. */}
              <div
                className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.10), transparent 70%)' }}
              />
              <div className="relative">
                <div className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/50 font-semibold">
                  {isRu ? 'Направление' : 'Cluster'}
                </div>
                <div className="font-display text-[17px] font-semibold text-foreground mt-0.5 tracking-[-0.01em] group-hover:text-primary transition-colors">
                  {getClusterHeaderLabel(c, language)}
                </div>
              </div>
              <div className="relative flex items-end justify-between mt-2 gap-2">
                <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2 flex-1">
                  {getClusterValueLine(c, language)}
                </div>
                <div className="font-mono text-[10.5px] font-semibold shrink-0 px-1.5 py-0.5 bg-primary/8 text-primary border-l-2 transition-colors group-hover:bg-primary/15"
                  style={{ borderLeftColor: c.color }}
                >
                  {availableCount}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
