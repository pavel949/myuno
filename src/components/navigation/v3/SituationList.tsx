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
import { useSituationTracking } from './useSituationTracking';
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
  /** Show skeleton rows instead of content while data is loading. */
  isLoading?: boolean;
  /** Show a unified inline error block (takes precedence over loading). */
  isError?: boolean;
  /** Optional retry handler rendered inside the error block. */
  onRetry?: () => void;
  /** Number of skeleton rows to render while loading. */
  skeletonCount?: number;
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
function SituationListImpl({
  situations,
  counts,
  source,
  trackContext,
  variant = 'compact',
  className,
  isLoading = false,
  isError = false,
  onRetry,
  skeletonCount = 4,
}: SituationListProps) {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';
  const styles = VARIANTS[variant];

  // Single analytics layer — impressions + clicks, identical for every variant.
  // Impressions are suppressed while loading/failing so a skeleton never counts as a view.
  const codes = React.useMemo(
    () => (isLoading || isError ? [] : situations.map((s) => s.code)),
    [situations, isLoading, isError],
  );
  const { containerRef, onSituationClick } = useSituationTracking({
    codes,
    source,
    variant,
    context: trackContext,
  });

  // Error state wins over everything else, so every section fails identically.
  if (isError) {
    return (
      <div
        role="alert"
        className={cn(
          'border border-destructive/40 bg-destructive/5 p-4 text-[13px] text-destructive',
          className,
        )}
      >
        <p>{t('discover.errorLoad')}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            {t('discover.retryAction')}
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <ul
        aria-busy="true"
        aria-live="polite"
        className={cn('divide-y divide-border', className)}
      >
        {Array.from({ length: Math.max(1, skeletonCount) }).map((_, i) => (
          <li key={`situation-skeleton-${i}`} className={cn('flex items-center gap-4', styles.row)}>
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded-none" />
              <Skeleton className="h-3 w-1/3 rounded-none" />
            </div>
            <Skeleton className="h-3 w-16 rounded-none shrink-0" />
          </li>
        ))}
      </ul>
    );
  }

  if (situations.length === 0) return null;

  return (
    <ul ref={containerRef} className={cn('divide-y divide-border', className)}>
      {situations.map((s) => {
        const title = isRu ? s.title_ru : s.title_en;
        const desc = isRu ? s.description_ru : s.description_en;
        const count = counts?.[s.id];
        const href = resolveSituationHref(s.code);

        return (
          <li key={s.id}>
            <Link
              to={href}
              onClick={() => onSituationClick(s.code, { href, count })}
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
