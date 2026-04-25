/**
 * ClearViewBadgePopover — interactive ClearView grade chip.
 *
 * Wraps `ClearViewBadge` in a Popover that, on click, fetches the project's
 * public ClearView summary (score + per-category radar) and shows a deep link
 * into the offplan project page where the full report (paywalled) lives.
 *
 * Use this on listing cards & TrustStrip to teach users what a grade means.
 * Avoid on map markers (popover is heavier than a static chip).
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { ClearViewBadge, type ClearViewBadgeProps } from '@/components/clearview/ClearViewBadge';
import { ClearViewRadar } from '@/components/clearview/ClearViewRadar';
import {
  type ClearViewGrade,
  gradeToRecommendation,
  gradeTokenClass,
  recommendationLabel,
} from '@/lib/clearview/methodology';

interface PublicSummary {
  total_score: number | null;
  grade: ClearViewGrade | null;
  score_legal: number | null;
  score_developer: number | null;
  score_construction: number | null;
  score_location: number | null;
  score_financial: number | null;
  score_returns: number | null;
  score_marketing: number | null;
  score_liquidity: number | null;
  executive_summary: string | null;
}

interface Props extends Omit<ClearViewBadgeProps, 'onClick'> {
  projectId: string;
  /** Where the "see full report" link should point (e.g. `/property/offplan/:id`). */
  detailHref: string;
}

export function ClearViewBadgePopover({ projectId, detailHref, isRu = false, ...badgeProps }: Props) {
  const [open, setOpen] = React.useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['clearview-public-summary', projectId],
    enabled: open,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PublicSummary | null> => {
      const { data } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('v_clearview_public' as any)
        .select(
          'total_score, grade, score_legal, score_developer, score_construction, score_location, score_financial, score_returns, score_marketing, score_liquidity, executive_summary',
        )
        .eq('project_id', projectId)
        .maybeSingle();
      return (data as unknown as PublicSummary) ?? null;
    },
  });

  const grade = (summary?.grade ?? badgeProps.grade) as ClearViewGrade | null | undefined;
  const score = summary?.total_score ?? badgeProps.score ?? null;
  const rec = gradeToRecommendation((grade as ClearViewGrade | null) ?? null);
  const recCls = rec
    ? rec === 'BUY'
      ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
      : rec === 'WATCH'
        ? 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10'
        : 'border-red-500/40 text-red-700 dark:text-red-400 bg-red-500/10'
    : '';
  const tk = gradeTokenClass((grade as ClearViewGrade | null) ?? null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={isRu ? 'Подробнее о рейтинге ClearView' : 'About ClearView rating'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="inline-flex"
        >
          <ClearViewBadge {...badgeProps} isRu={isRu} className={badgeProps.className} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-[min(320px,calc(100vw-32px))] p-3 rounded-none border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <p className="text-xs text-muted-foreground py-2">
            {isRu ? 'Загружаем сводку…' : 'Loading summary…'}
          </p>
        )}

        {!isLoading && !summary && (
          <p className="text-xs text-muted-foreground py-2">
            {isRu
              ? 'Публичная сводка ClearView пока недоступна.'
              : 'ClearView public summary not yet available.'}
          </p>
        )}

        {!isLoading && summary && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isRu ? 'Рейтинг ClearView V3' : 'ClearView V3 grade'}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`font-mono font-bold text-lg ${tk.text}`}>
                    {grade ?? '—'}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {score != null ? `${Math.round(Number(score))}/100` : ''}
                  </span>
                </div>
              </div>
              {rec && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 border text-[10px] font-medium uppercase tracking-wider rounded-none ${recCls}`}
                >
                  {recommendationLabel(rec, isRu)}
                </span>
              )}
            </div>

            <ClearViewRadar report={summary} isRu={isRu} height={170} />

            {summary.executive_summary && (
              <p className="text-[11px] leading-snug text-muted-foreground line-clamp-3">
                {summary.executive_summary}
              </p>
            )}

            <Link
              to={detailHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-1 px-2.5 py-1.5 border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground rounded-none"
            >
              <span>{isRu ? 'Открыть полный отчёт' : 'See full ClearView report'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <p className="text-[9px] text-muted-foreground">
              {isRu
                ? 'Свободная сводка. Полный анализ по 8 категориям доступен после оплаты.'
                : 'Free summary. Full 8-category analysis is paid.'}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default ClearViewBadgePopover;
