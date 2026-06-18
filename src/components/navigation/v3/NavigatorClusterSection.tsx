/**
 * NavigatorClusterSection — civic-style compact section for one Master-Taxonomy
 * cluster (Arrive / Live / Manage / Invest / Legal / Build).
 *
 * Renders a quiet header (small label + count) and a vertical list of
 * situation rows. No coloured tiles, no grid clutter — every row answers a
 * single question: "what should I do here?".
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CLUSTERS, type ClusterId } from '@/lib/catalog/taxonomy';
import type { LifeSituation } from '@/hooks/useLifeOS';

interface NavigatorClusterSectionProps {
  clusterId: ClusterId;
  situations: LifeSituation[];
  counts?: Record<string, number>;
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

function formatCount(n: number, isRu: boolean): string {
  if (isRu) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} услуга`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} услуги`;
    return `${n} услуг`;
  }
  return `${n} ${n === 1 ? 'service' : 'services'}`;
}

export function NavigatorClusterSection({
  clusterId,
  situations,
  counts,
}: NavigatorClusterSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const cluster = CLUSTERS.find((c) => c.id === clusterId);
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
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {situations.length}
        </span>
      </header>

      <ul className="divide-y divide-border">
        {situations.map((s) => {
          const title = isRu ? s.title_ru : s.title_en;
          const desc = isRu ? s.description_ru : s.description_en;
          const count = counts?.[s.id];
          return (
            <li key={s.id}>
              <Link
                to={`/discover/${s.code}`}
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
                  {typeof count === 'number' && count > 0 ? formatCount(count, isRu) : (isRu ? 'открыть' : 'open')}
                </span>
                <ArrowRight
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
