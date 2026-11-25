/**
 * HQ payout run — Design Bible Round 4A · H2 "Payments & payouts".
 *
 * Read-only aggregation for the current month across the existing money
 * tables. It never moves money: providers are still paid one by one through
 * `admin_process_payout` (PayoutManager) and owner payouts are approved by
 * their management company. The run approval is a two-person sign-off
 * recorded in `hq_dual_approvals` (entity `payout_run`, id `YYYY-MM`).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PAID_ORDER_STATUSES = ['confirmed', 'in_progress', 'completed', 'checked_in', 'checked_out', 'deposit_paid'] as const;

export type PayeeKind = 'owner' | 'provider';
export type PayoutLineStatus = 'ready' | 'processing' | 'exception';

export interface PayoutLine {
  id: string;
  kind: PayeeKind;
  payee: string;
  detail: string;
  gross: number;
  fees: number;
  payout: number;
  status: PayoutLineStatus;
  reason?: string;
}

export interface PayoutRunSummary {
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  collected: number;
  platformFees: number;
  refunds: number;
  refundCount: number;
  payoutsDue: number;
  lines: PayoutLine[];
  openAlerts: { id: string; description: string; severity: string; amount: number | null }[];
}

export function periodFor(date: Date): { key: string; start: string; end: string } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  return { key, start: start.toISOString(), end: end.toISOString() };
}

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

interface OrderRow { total_amount: number | null; platform_fee_amount: number | null; status: string }

export function summariseOrders(rows: readonly OrderRow[]) {
  const paid = new Set<string>(PAID_ORDER_STATUSES);
  let collected = 0, platformFees = 0, refunds = 0, refundCount = 0;
  for (const r of rows) {
    if (paid.has(r.status)) { collected += n(r.total_amount); platformFees += n(r.platform_fee_amount); }
    if (r.status === 'refunded') { refunds += n(r.total_amount); refundCount += 1; }
  }
  return { collected, platformFees, refunds, refundCount };
}

/** Lines that need a second look are held out of the approval total. */
export function approvableTotal(lines: readonly PayoutLine[]): { count: number; amount: number } {
  const ok = lines.filter((l) => l.status !== 'exception');
  return { count: ok.length, amount: ok.reduce((a, l) => a + l.payout, 0) };
}

export function useHqPayoutRun(now: Date = new Date()) {
  const period = periodFor(now);
  return useQuery({
    queryKey: ['hq-payout-run', period.key],
    queryFn: async (): Promise<PayoutRunSummary> => {
      const [orders, owners, providers, vendorPayouts, alerts] = await Promise.all([
        supabase.from('orders').select('total_amount, platform_fee_amount, status')
          .gte('created_at', period.start).lt('created_at', period.end).limit(10000),
        supabase.from('owner_payouts')
          .select('id, payout_number, gross_revenue, mgmt_commission, expenses, other_deductions, net_payout, status, bank_account_last4')
          .in('status', ['pending', 'approved', 'processing', 'failed']).order('created_at', { ascending: false }).limit(500),
        supabase.from('providers').select('id, name, pending_payout, total_earnings').gt('pending_payout', 0)
          .order('pending_payout', { ascending: false }).limit(500),
        supabase.from('vendor_payouts').select('id, provider_id, amount, status').in('status', ['processing', 'failed']).limit(500),
        supabase.from('reconciliation_alerts').select('id, description, severity, expected_amount, actual_amount')
          .is('resolved_at', null).order('created_at', { ascending: false }).limit(50),
      ]);
      for (const r of [orders, owners, providers, vendorPayouts, alerts]) if (r.error) throw new Error(r.error.message);

      const o = summariseOrders((orders.data ?? []) as OrderRow[]);
      const inFlight = new Map<string, string>();
      for (const v of vendorPayouts.data ?? []) inFlight.set(v.provider_id, String(v.status));

      const lines: PayoutLine[] = [
        ...(owners.data ?? []).map((p): PayoutLine => {
          const fees = n(p.mgmt_commission) + n(p.expenses) + n(p.other_deductions);
          const status: PayoutLineStatus = p.status === 'failed' ? 'exception' : p.status === 'processing' ? 'processing' : 'ready';
          return {
            id: `owner:${p.id}`, kind: 'owner', payee: p.payout_number,
            detail: p.bank_account_last4 ? `•••• ${p.bank_account_last4}` : '—',
            gross: n(p.gross_revenue), fees, payout: n(p.net_payout), status,
            reason: p.status === 'failed' ? 'failed' : !p.bank_account_last4 ? 'no_bank' : undefined,
          };
        }),
        ...(providers.data ?? []).map((p): PayoutLine => {
          const flight = inFlight.get(p.id);
          return {
            id: `provider:${p.id}`, kind: 'provider', payee: p.name ?? '—', detail: '',
            gross: n(p.pending_payout), fees: 0, payout: n(p.pending_payout),
            status: flight === 'failed' ? 'exception' : flight === 'processing' ? 'processing' : 'ready',
            reason: flight === 'failed' ? 'failed' : undefined,
          };
        }),
      ].map((l) => (l.reason === 'no_bank' ? { ...l, status: 'exception' as const } : l));

      return {
        periodKey: period.key, periodStart: period.start, periodEnd: period.end,
        ...o,
        payoutsDue: lines.filter((l) => l.status !== 'processing').reduce((a, l) => a + l.payout, 0),
        lines,
        openAlerts: (alerts.data ?? []).map((a) => ({
          id: a.id, description: a.description, severity: a.severity,
          amount: a.expected_amount != null && a.actual_amount != null ? n(a.expected_amount) - n(a.actual_amount) : null,
        })),
      };
    },
  });
}
