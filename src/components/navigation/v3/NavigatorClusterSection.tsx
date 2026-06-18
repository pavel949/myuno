/**
 * NavigatorClusterSection — renders a section of life situations grouped under
 * a single Master-Taxonomy cluster (Arrive / Live / Manage / Invest / Legal / Build).
 *
 * Used by NavigatorPageV3 to give clients a clear "where am I / why these cards"
 * structure instead of a flat 20-card grid.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { CLUSTERS, type ClusterId } from '@/lib/catalog/taxonomy';
import type { LifeSituation } from '@/hooks/useLifeOS';
import { SituationCard } from './SituationCard';
import { cn } from '@/lib/utils';

interface NavigatorClusterSectionProps {
  clusterId: ClusterId;
  situations: LifeSituation[];
  counts?: Record<string, number>;
}

const CLUSTER_ICON_NAMES: Record<ClusterId, string> = {
  arrive: 'Plane',
  live: 'Home',
  manage: 'Building2',
  invest: 'TrendingUp',
  legal: 'Scale',
  build: 'HardHat',
};

export function NavigatorClusterSection({
  clusterId,
  situations,
  counts,
}: NavigatorClusterSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const cluster = CLUSTERS.find((c) => c.id === clusterId);
  if (!cluster || situations.length === 0) return null;

  const label = isRu ? cluster.labelRu : cluster.labelEn;
  const value = isRu ? cluster.valueRu : cluster.valueEn;

  return (
    <section
      id={`cluster-${clusterId}`}
      className="scroll-mt-24"
      aria-labelledby={`cluster-${clusterId}-title`}
    >
      <header className="mb-4 flex items-start gap-3 border-l-2 pl-4" style={{ borderColor: cluster.color }}>
        <div
          className="w-10 h-10 flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${cluster.color.replace('hsl', 'hsla').replace(')', ' / 0.12)')}` }}
        >
          <DynamicIcon
            name={CLUSTER_ICON_NAMES[clusterId]}
            className="w-5 h-5"
            style={{ color: cluster.color }}
            strokeWidth={1.75}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2
              id={`cluster-${clusterId}-title`}
              className="text-[18px] sm:text-[20px] font-serif font-semibold tracking-[-0.01em] text-foreground"
            >
              {label}
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {situations.length} {isRu ? 'ситуац.' : 'situations'}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground line-clamp-2">
            {value}
          </p>
        </div>
      </header>

      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4')}>
        {situations.map((s) => (
          <SituationCard
            key={s.id}
            situation={s}
            serviceCount={counts?.[s.id]}
            clusterId={clusterId}
            clusterColor={cluster.color}
          />
        ))}
      </div>
    </section>
  );
}
