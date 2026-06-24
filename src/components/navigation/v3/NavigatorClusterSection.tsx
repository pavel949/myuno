/**
 * NavigatorClusterSection — civic-style compact section for one Master-Taxonomy
 * cluster (Arrive / Live / Manage / Invest / Legal / Build).
 *
 * Renders a quiet header (small label + count) and a vertical list of
 * situation rows. No coloured tiles, no grid clutter — every row answers a
 * single question: "what should I do here?".
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
import { resolveSituationHref } from '@/lib/navigation/situationLandingMap';
import { trackSituationClick } from '@/lib/analytics/track';
import { formatServices } from '@/lib/i18n/pluralize';
import type { LifeSituation } from '@/hooks/useLifeOS';

interface NavigatorClusterSectionProps {
  clusterId: ClusterId;
  situations: LifeSituation[];
  counts?: Record<string, number>;
  /** When true, hide the top icon-grid of mini-apps (used in "Other areas"). */
  hideAppGrid?: boolean;
  /** code -> {ru,en} map for hint resolution inside MiniAppCard. */
  situationLabels?: Record<string, { ru: string; en: string }>;
}

const CLUSTER_LABEL_RU: Record<ClusterId, string> = {
  arrive: 'Прибытие',
  live: 'Жизнь',
  manage: 'Управление',
  invest: 'Инвестиции',
  legal: 'Документы и право',
  build: 'Девелопмент',
};

const CLUSTER_LABEL_EN: Record<ClusterId, string> = {
  arrive: 'Arrive',
  live: 'Live',
  manage: 'Manage',
  invest: 'Invest',
  legal: 'Legal',
  build: 'Build',
};

function NavigatorClusterSectionImpl({
  clusterId,
  situations,
  counts,
  hideAppGrid,
  situationLabels,
}: NavigatorClusterSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { effectivePersonas } = useUserPersonas();
  const role = useLifeOSRole();
  const cluster = CLUSTERS.find((c) => c.id === clusterId);

  const topServices = useMemo(() => {
    if (hideAppGrid) return [];
    const inCluster = AVAILABLE_SERVICES.filter((s) => s.clusterId === clusterId);
    return rankServices(inCluster, { role, personas: effectivePersonas }).slice(0, 6);
  }, [clusterId, role, effectivePersonas, hideAppGrid]);

  if (!cluster || situations.length === 0) return null;

  const label = isRu ? CLUSTER_LABEL_RU[clusterId] : CLUSTER_LABEL_EN[clusterId];

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
          aria-label={`${situations.length} ${isRu ? 'ситуаций' : 'situations'}`}
        >
          {situations.length}
        </span>
      </header>

      {topServices.length > 0 && (
        <div className="mt-4 mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-2">
            {isRu ? 'Мини-приложения для вас' : 'Mini-apps for you'}
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

      <ul className="divide-y divide-border">
        {situations.map((s) => {
          const title = isRu ? s.title_ru : s.title_en;
          const desc = isRu ? s.description_ru : s.description_en;
          const count = counts?.[s.id];
          const href = resolveSituationHref(s.code);
          return (
            <li key={s.id}>
              <Link
                to={href}
                onClick={() => trackSituationClick(s.code, {
                  source: 'cluster_section',
                  cluster: clusterId,
                  href,
                  count,
                })}
                className="group flex items-center gap-4 py-4 -mx-2 px-2 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors min-h-[56px]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-foreground leading-tight">
                    {title}
                  </div>
                  {desc && (
                    <div className="mt-0.5 text-[12.5px] text-muted-foreground leading-snug line-clamp-1">
                      {desc}
                    </div>
                  )}
                </div>
                <span className="font-mono text-[12px] text-muted-foreground tabular-nums shrink-0">
                  {typeof count === 'number' && count > 0 ? formatServices(count, language) : (isRu ? 'открыть' : 'open')}
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
  );
}

export const NavigatorClusterSection = React.memo(NavigatorClusterSectionImpl);
