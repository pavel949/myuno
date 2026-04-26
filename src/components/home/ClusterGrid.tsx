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
              className="relative text-left rounded-none bg-card border border-border p-[14px] pl-4 min-h-[86px] flex flex-col justify-between hover:border-border transition-colors overflow-hidden"
            >
              {/* 2px left spine */}
              <div
                className="absolute top-3.5 bottom-3.5 left-0 w-0.5 rounded-none"
                style={{ background: c.color }}
              />
              <div>
                <div className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/50 font-semibold">
                  {isRu ? 'Направление' : 'Cluster'}
                </div>
                <div className="font-display text-[17px] font-semibold text-foreground mt-0.5 tracking-[-0.01em]">
                  {getClusterHeaderLabel(c, language)}
                </div>
              </div>
              <div className="flex items-end justify-between mt-2 gap-2">
                <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2 flex-1">
                  {getClusterValueLine(c, language)}
                </div>
                <div
                  className="font-mono text-[10.5px] font-medium shrink-0"
                  style={{ color: c.color }}
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
