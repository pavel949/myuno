/**
 * SituationList — the single reusable renderer for a list of life situations.
 *
 * Every /discover surface (the "For you" block, each cluster section, and any
 * future situation list) renders through this component, so a situation row
 * always looks and behaves the same and the markup exists in exactly one place.
 * De-duplication of the *content* is handled upstream by
 * `buildSituationSections` — this component only draws what it is given.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { resolveSituationHref } from '@/lib/navigation/situationLandingMap';
import { trackSituationClick } from '@/lib/analytics/track';
import { formatServices } from '@/lib/i18n/pluralize';
import { cn } from '@/lib/utils';
import type { LifeSituation } from '@/hooks/useLifeOS';

export type SituationListVariant = 'prominent' | 'compact';

interface SituationListProps {
  situations: readonly LifeSituation[];
  /** situation id -> number of services behind it. */
  counts?: Record<string, number>;
  /** Analytics source, e.g. 'navigator_v3_for_you' or 'cluster_section'. */
  source: string;
  /** Extra analytics payload (cluster id, etc). */
  trackContext?: Record<string, unknown>;
  variant?: SituationListVariant;
  className?: string;
}

const VARIANTS: Record<SituationListVariant, { row: string; title: string; desc: string }> = {
  prominent: {
    row: 'py-5 min-h-[64px]',
    title: 'text-[17px] font-semibold leading-tight tracking-[-0.005em]',
    desc: 'mt-1 text-[13px] leading-snug line-clamp-2',
  },
  compact: {
    row: 'py-4 min-h-[56px]',
    title: 'text-[15px] font-medium leading-tight',
    desc: 'mt-0.5 text-[12.5px] leading-snug line-clamp-1',
  },
};

function SituationListImpl({
  situations,
  counts,
  source,
  trackContext,
  variant = 'compact',
  className,
}: SituationListProps) {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';
  const styles = VARIANTS[variant];

  if (situations.length === 0) return null;

  return (
    <ul className={cn('divide-y divide-border', className)}>
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
                source,
                href,
                count,
                ...trackContext,
              })}
              className={cn(
                'group flex items-center gap-4 -mx-2 px-2 transition-colors',
                'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                styles.row,
              )}
            >
              <div className="flex-1 min-w-0">
                <div className={cn('text-foreground', styles.title)}>{title}</div>
                {desc && (
                  <div className={cn('text-muted-foreground', styles.desc)}>{desc}</div>
                )}
              </div>
              <span className="font-mono text-[12px] text-muted-foreground tabular-nums shrink-0">
                {typeof count === 'number' && count > 0
                  ? formatServices(count, language)
                  : t('discover.open')}
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
  );
}

export const SituationList = React.memo(SituationListImpl);
