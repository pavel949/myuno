/**
 * Admin Finance — platform economics (GMV, commissions, payouts, subscriptions).
 * Orders: RPC get_gmv_summary (SECURITY DEFINER). Subscriptions: vendor_subscriptions + plans.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PlatformFinancePeriod = '7d' | '30d' | '90d' | 'mtd' | 'ytd' | 'all';

export interface GmvSummaryRow {
  total_orders: number;
  completed_orders: number;
  confirmed_orders: number;
  cancelled_orders: number;
  gmv: number;
  total_commission: number;
  total_concierge_fee?: number;
  platform_take?: number;
  total_vendor_payouts: number;
  avg_order_value: number;
  currency: string;
  period_start: string;
  period_end: string;
  by_vertical: Array<{
    vertical: string;
    count: number;
    gmv: number;
    commission: number;
  }>;
}

export interface VendorSubscriptionMrrRow {
  id: string;
  status: string;
  billing_cycle: string | null;
  plan_id: string;
}

export interface SubscriptionPlanPrices {
  id: string;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
}

export interface PlatformSubscriptionStats {
  activeCount: number;
  estimatedMrrThb: number;
  currency: string;
}

function periodBounds(period: PlatformFinancePeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setUTCDate(start.getUTCDate() - 7);
      break;
    case '30d':
      start.setUTCDate(start.getUTCDate() - 30);
      break;
    case '90d':
      start.setUTCDate(start.getUTCDate() - 90);
      break;
    case 'mtd':
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case 'ytd':
      start.setUTCMonth(0, 1);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case 'all':
      start.setTime(Date.UTC(2020, 0, 1, 0, 0, 0, 0));
      break;
    default:
      start.setUTCDate(start.getUTCDate() - 30);
  }

  return { start, end };
}

function estimateMrrThb(
  subs: VendorSubscriptionMrrRow[],
  plansById: Map<string, SubscriptionPlanPrices>
): { mrr: number; currency: string } {
  let mrr = 0;
  let currency = 'THB';

  for (const s of subs) {
    const plan = plansById.get(s.plan_id);
    if (!plan) continue;
    currency = plan.currency || 'THB';
    const cycle = (s.billing_cycle || 'monthly').toLowerCase();
    if (cycle === 'yearly' || cycle === 'annual') {
      const y = plan.price_yearly ?? plan.price_monthly * 12;
      mrr += y / 12;
    } else {
      mrr += plan.price_monthly;
    }
  }

  return { mrr, currency };
}

export function usePlatformFinanceKpis(period: PlatformFinancePeriod) {
  const { start, end } = periodBounds(period);

  const gmvQuery = useQuery({
    queryKey: ['platform-finance-gmv', period, start.toISOString(), end.toISOString()],
    queryFn: async (): Promise<GmvSummaryRow> => {
      const { data, error } = await supabase.rpc('get_gmv_summary', {
        p_period_start: start.toISOString(),
        p_period_end: end.toISOString(),
      });

      if (error) throw error;

      const raw = data as Record<string, unknown> | null;
      if (!raw || typeof raw !== 'object') {
        throw new Error('get_gmv_summary returned empty');
      }

      const byVertical = Array.isArray(raw.by_vertical) ? raw.by_vertical : [];

      return {
        total_orders: Number(raw.total_orders) || 0,
        completed_orders: Number(raw.completed_orders) || 0,
        confirmed_orders: Number(raw.confirmed_orders) || 0,
        cancelled_orders: Number(raw.cancelled_orders) || 0,
        gmv: Number(raw.gmv) || 0,
        total_commission: Number(raw.total_commission) || 0,
        total_concierge_fee: Number(raw.total_concierge_fee) || 0,
        platform_take: (() => {
          const pt = Number(raw.platform_take);
          if (Number.isFinite(pt)) return pt;
          return (
            (Number(raw.total_commission) || 0) + (Number(raw.total_concierge_fee) || 0)
          );
        })(),
        total_vendor_payouts: Number(raw.total_vendor_payouts) || 0,
        avg_order_value: Number(raw.avg_order_value) || 0,
        currency: String(raw.currency || 'THB'),
        period_start: String(raw.period_start),
        period_end: String(raw.period_end),
        by_vertical: byVertical.map((v: Record<string, unknown>) => ({
          vertical: String(v.vertical ?? 'other'),
          count: Number(v.count) || 0,
          gmv: Number(v.gmv) || 0,
          commission: Number(v.commission) || 0,
        })),
      };
    },
  });

  const subsQuery = useQuery({
    queryKey: ['platform-finance-vendor-subs'],
    queryFn: async (): Promise<PlatformSubscriptionStats> => {
      const { data: subs, error: subsError } = await supabase
        .from('vendor_subscriptions')
        .select('id, status, billing_cycle, plan_id')
        .in('status', ['active', 'trialing']);

      if (subsError) throw subsError;

      const list = (subs || []) as VendorSubscriptionMrrRow[];
      if (list.length === 0) {
        return { activeCount: 0, estimatedMrrThb: 0, currency: 'THB' };
      }

      const planIds = [...new Set(list.map((s) => s.plan_id))];
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, price_monthly, price_yearly, currency')
        .in('id', planIds);

      if (plansError) throw plansError;

      const plansById = new Map((plans || []).map((p) => [p.id, p as SubscriptionPlanPrices]));
      const { mrr, currency } = estimateMrrThb(list, plansById);

      return {
        activeCount: list.length,
        estimatedMrrThb: mrr,
        currency,
      };
    },
    staleTime: 60_000,
  });

  return {
    period,
    periodStart: start,
    periodEnd: end,
    gmv: gmvQuery.data,
    subscriptions: subsQuery.data,
    isLoading: gmvQuery.isLoading || subsQuery.isLoading,
    isError: gmvQuery.isError || subsQuery.isError,
    error: gmvQuery.error || subsQuery.error,
    refetch: () => {
      void gmvQuery.refetch();
      void subsQuery.refetch();
    },
  };
}
