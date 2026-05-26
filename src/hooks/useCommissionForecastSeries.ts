/**
 * @module useCommissionForecastSeries
 * @description Monthly commission time-series for the Business-Pulse charts.
 *
 * Returns one bucket per calendar month within the requested window:
 *  - past months → `buy_earned` / `sell_earned` from won deals closed in that month
 *  - future months → `buy_weighted` / `sell_weighted` from active deals whose
 *    `expected_close_date` lands in that month, weighted by stage probability
 *
 * Side classification comes from the deal's pipeline (`crm_pipelines.side`).
 * Deals with no pipeline_side are bucketed into `buy_*` by default — the
 * legacy single-pipeline mode is treated as buy-side until backfilled.
 *
 * Computed client-side (one query, ~hundreds of rows max per company). No
 * RPC needed.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommissionMonthBucket {
  /** YYYY-MM */
  month: string;
  /** Earned (won deals closed this month) */
  buy_earned: number;
  sell_earned: number;
  /** Weighted forecast (active deals * commission% * stage probability) */
  buy_weighted: number;
  sell_weighted: number;
  /** Past month (earned), current/future (forecast). */
  is_future: boolean;
}

interface DealRow {
  deal_value: number | null;
  budget_max: number | null;
  commission_percent: number | null;
  commission_amount: number | null;
  expected_close_date: string | null;
  closed_at: string | null;
  stage: string;
  pipeline_id: string | null;
}

interface StageRow {
  id: string;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function grossCommission(deal: Pick<DealRow, 'deal_value' | 'budget_max' | 'commission_percent' | 'commission_amount'>): number {
  if (deal.commission_amount && Number(deal.commission_amount) > 0) {
    return Number(deal.commission_amount);
  }
  const val = Number(deal.deal_value ?? deal.budget_max ?? 0);
  const pct = Number(deal.commission_percent ?? 0) / 100;
  return val * pct;
}

export function useCommissionForecastSeries(
  companyId: string | undefined,
  /** Months back from current month (inclusive). Default 6. */
  monthsBack = 6,
  /** Months forward including current. Default 6. */
  monthsForward = 6,
) {
  return useQuery({
    queryKey: ['crm-commission-series', companyId, monthsBack, monthsForward],
    queryFn: async (): Promise<CommissionMonthBucket[]> => {
      if (!companyId) return [];

      // Fetch in parallel: deals, stages, and the tiny pipeline → side map.
      // Side lookup is client-side so a missing `crm_pipelines.side` column
      // (pre-migration) doesn't 400 the whole query.
      const [dealsRes, stagesRes, pipelinesRes] = await Promise.all([
        supabase
          .from('agent_deals')
          .select(
            'deal_value, budget_max, commission_percent, commission_amount, expected_close_date, closed_at, stage, pipeline_id',
          )
          .eq('company_id', companyId),
        supabase
          .from('crm_pipeline_stages')
          .select('id, probability, is_won, is_lost'),
        supabase
          .from('crm_pipelines')
          .select('id, side')
          .eq('company_id', companyId),
      ]);

      if (dealsRes.error) throw dealsRes.error;
      if (stagesRes.error) throw stagesRes.error;
      // pipelinesRes intentionally NOT thrown — side column may not exist yet.

      const deals = (dealsRes.data || []) as unknown as DealRow[];
      const stages = (stagesRes.data || []) as unknown as StageRow[];
      const stageById = new Map(stages.map((s) => [s.id, s] as const));
      const sideByPipelineId = new Map<string, 'buy' | 'sell' | null>(
        ((pipelinesRes.error ? [] : pipelinesRes.data) as unknown as
          | Array<{ id: string; side?: 'buy' | 'sell' | null }>
          | null
          ?? []).map((r) => [r.id, (r.side ?? null) as 'buy' | 'sell' | null]),
      );

      // Build the bucket window.
      const now = new Date();
      const start = addMonths(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), -monthsBack);
      const buckets: Record<string, CommissionMonthBucket> = {};
      const currentMonth = monthKey(now);
      for (let i = 0; i < monthsBack + monthsForward; i += 1) {
        const m = monthKey(addMonths(start, i));
        buckets[m] = {
          month: m,
          buy_earned: 0,
          sell_earned: 0,
          buy_weighted: 0,
          sell_weighted: 0,
          is_future: m >= currentMonth,
        };
      }

      for (const deal of deals) {
        const resolvedSide = deal.pipeline_id
          ? sideByPipelineId.get(deal.pipeline_id) ?? null
          : null;
        const side: 'buy' | 'sell' = resolvedSide === 'sell' ? 'sell' : 'buy';
        const gross = grossCommission(deal);
        if (gross <= 0) continue;

        const stageMeta = stageById.get(deal.stage);
        const isWon = stageMeta?.is_won ?? deal.stage === 'closed_won';
        const isLost = stageMeta?.is_lost ?? deal.stage === 'closed_lost';

        if (isWon && deal.closed_at) {
          const bucket = buckets[monthKey(new Date(deal.closed_at))];
          if (bucket) {
            if (side === 'sell') bucket.sell_earned += gross;
            else bucket.buy_earned += gross;
          }
          continue;
        }

        if (isLost) continue;

        if (deal.expected_close_date) {
          const bucket = buckets[monthKey(new Date(deal.expected_close_date))];
          if (bucket) {
            const probability =
              (stageMeta?.probability ?? 50) / 100; // % to fraction
            const weighted = gross * probability;
            if (side === 'sell') bucket.sell_weighted += weighted;
            else bucket.buy_weighted += weighted;
          }
        }
      }

      return Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}

/** Aggregate convenience selectors over the series — MTD, QTD, rolling-12. */
export function useCommissionRollups(
  companyId: string | undefined,
) {
  const { data: series, ...rest } = useCommissionForecastSeries(companyId, 12, 12);

  const rollups = useMemo(() => {
    if (!series) {
      return {
        mtd: 0,
        qtd: 0,
        rolling12: 0,
        buy_weighted_30d: 0,
        sell_weighted_30d: 0,
      };
    }
    const now = new Date();
    const currentMonth = monthKey(now);
    const quarter = Math.floor(now.getUTCMonth() / 3);
    const quarterStartMonth = quarter * 3;

    let mtd = 0;
    let qtd = 0;
    let rolling12 = 0;
    let buy_weighted_30d = 0;
    let sell_weighted_30d = 0;

    for (const b of series) {
      const total = b.buy_earned + b.sell_earned;
      if (b.month === currentMonth) {
        mtd += total;
        buy_weighted_30d += b.buy_weighted;
        sell_weighted_30d += b.sell_weighted;
      }
      const [bY, bM] = b.month.split('-').map(Number);
      if (
        bY === now.getUTCFullYear() &&
        bM - 1 >= quarterStartMonth &&
        bM - 1 <= now.getUTCMonth()
      ) {
        qtd += total;
      }
      // Rolling 12 months = past 12 months including current
      const monthsAgo =
        (now.getUTCFullYear() - bY) * 12 + (now.getUTCMonth() - (bM - 1));
      if (monthsAgo >= 0 && monthsAgo < 12) {
        rolling12 += total;
      }
    }

    return { mtd, qtd, rolling12, buy_weighted_30d, sell_weighted_30d };
  }, [series]);

  return { series, rollups, ...rest };
}
