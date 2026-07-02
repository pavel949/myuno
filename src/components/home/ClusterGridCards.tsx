import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';
import { blendClusters } from '@/lib/roleBlend';
import type { ClusterCatalogEntry } from '@/lib/nav/clusterCatalog';

interface ClusterGridCardsProps {
  personas: UserPersona[];
}

/** Muted DS 2.1 cluster tint (navy/orange/stone) — never the retired rainbow. */
function clusterTint(id: string): string {
  return `hsl(var(--cluster-${id}))`;
}

function availableCount(entry: ClusterCatalogEntry): number {
  return entry.services.filter((s) => s.status !== 'soon').length;
}

/**
 * ClusterGridCards — persona-ranked 2-col cluster grid (mockup
 * `screen.jsx · VerticalCluster`). Uses the existing weighted `blendClusters`
 * engine so ordering reacts live to the role stack. Each card is a labelled
 * door into the cluster with a service count; tint comes from the `--cluster-*`
 * tokens, so it stays on-canon in light and dark.
 */
export function ClusterGridCards({ personas }: ClusterGridCardsProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const clusters = useMemo(
    () => blendClusters(personas, { personas: personas as unknown as string[], role: null }),
    [personas],
  );

  if (clusters.length === 0) return null;

  const totalServices = clusters.reduce((sum, c) => sum + availableCount(c), 0);

  return (
    <div className="px-4 pb-6">
      <div className="mb-2.5 flex items-baseline justify-between">
        <div className="text-label uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">
          {isRu ? 'Все категории' : 'All services'}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {isRu ? `${totalServices} сервисов · для вас` : `${totalServices} apps · ranked for you`}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {clusters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(c.homeRoute)}
            className="relative flex min-h-[86px] flex-col justify-between rounded-none border border-border bg-card p-3.5 pl-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span
              className="absolute bottom-3.5 left-0 top-3.5 w-0.5 rounded-none"
              style={{ background: clusterTint(c.id) }}
              aria-hidden
            />
            <span>
              <span className="block text-label uppercase tracking-[0.1em] text-muted-foreground/60 font-semibold">
                {isRu ? 'Категория' : 'Cluster'}
              </span>
              <span className="mt-0.5 block font-display text-[17px] font-semibold tracking-[-0.01em] text-foreground">
                {isRu ? c.labelRu : c.labelEn}
              </span>
            </span>
            <span className="mt-2 flex items-end justify-between gap-2">
              <span className="max-w-[80%] text-[11px] leading-snug text-muted-foreground">
                {isRu ? c.valueRu : c.valueEn}
              </span>
              <span className="font-mono text-[10.5px] font-medium" style={{ color: clusterTint(c.id) }}>
                {availableCount(c)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
