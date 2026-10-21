/**
 * NavigatorClusterSection — civic-style compact section for one Master-Taxonomy
 * cluster (Arrive / Live / Manage / Invest / Legal / Build).
 *
 * Renders a quiet header (small label + count) and a vertical list of
 * situation rows. No coloured tiles, no grid clutter — every row answers a
 * single question: "what should I do here?".
 */
import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CLUSTERS,
  AVAILABLE_SERVICES,
  type ClusterId,
} from '@/lib/catalog/taxonomy';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLifeOSRole } from '@/hooks/useLifeOS';
import { rankServices } from '@/lib/superapp/rankServices';
import { MiniAppCard } from '@/components/superapp/MiniAppCard';
import { formatSituations } from '@/lib/i18n/pluralize';
import { SituationList } from './SituationList';
import type { LifeSituation } from '@/hooks/useLifeOS';


interface NavigatorClusterSectionProps {
  clusterId: ClusterId;
  situations: LifeSituation[];
  counts?: Record<string, number>;
  /** When true, hide the top icon-grid of mini-apps (used in "Other areas"). */
  hideAppGrid?: boolean;
  /** code -> {ru,en} map for hint resolution inside MiniAppCard. */
  situationLabels?: Record<string, { ru: string; en: string }>;
  /** Service ids already rendered in the page-level "For you" grid. */
  excludeServiceIds?: string[];
}

function NavigatorClusterSectionImpl({
  clusterId,
  situations,
  counts,
  hideAppGrid,
  situationLabels,
  excludeServiceIds,
}: NavigatorClusterSectionProps) {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';
  const { effectivePersonas } = useUserPersonas();
  const role = useLifeOSRole();
  const cluster = CLUSTERS.find((c) => c.id === clusterId);

  const topServices = useMemo(() => {
    if (hideAppGrid) return [];
    // Skip services already shown in the page-level "For you" grid.
    const skip = new Set(excludeServiceIds ?? []);
    const inCluster = AVAILABLE_SERVICES.filter(
      (s) => s.clusterId === clusterId && !skip.has(s.id),
    );
    return rankServices(inCluster, { role, personas: effectivePersonas }).slice(0, 6);
  }, [clusterId, role, effectivePersonas, hideAppGrid, excludeServiceIds]);

  if (!cluster || situations.length === 0) return null;

  const label = t(`discover.cluster.${clusterId}`);

  return (
    <section
      id={`cluster-${clusterId}`}
      className="scroll-mt-24"
      aria-labelledby={`cluster-${clusterId}-title`}
    >
      <header className="flex items-baseline justify-between gap-3 pb-3 mb-1 border-b border-border">
        <h2
          id={`cluster-${clusterId}-title`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          {label}
        </h2>
        <span
          className="font-mono text-[11px] text-muted-foreground tabular-nums"
          aria-label={formatSituations(situations.length, language)}
        >
          {situations.length}
        </span>
      </header>

      {topServices.length > 0 && (
        <div className="mt-4 mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-2">
            {t('discover.miniAppsForYou')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {topServices.map((svc) => (
              <MiniAppCard
                key={svc.id}
                svc={svc}
                personas={effectivePersonas}
                role={role}
                situationLabels={situationLabels}
              />
            ))}
          </div>
        </div>
      )}

      <SituationList
        situations={situations}
        counts={counts}
        source="cluster_section"
        trackContext={{ cluster: clusterId }}
        variant="compact"
      />

    </section>
  );
}

export const NavigatorClusterSection = React.memo(NavigatorClusterSectionImpl);
