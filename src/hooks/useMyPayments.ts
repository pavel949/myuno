/**
 * useMyPayments — universal payment tracker for /me/payments.
 *
 * Returns three buckets (Gosuslugi-style "Платежи"):
 *   - dueNow   → unpaid waiting commercial orders
 *   - history  → paid order activity and completed/refunded/cancelled orders, recent
 *
 * Phase A5 only — Phase B will add utilities/tax/visa fees aggregation.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export interface MyPaymentRow {
  id: string;
  orderId: string;
  orderNumber?: string | null;
  orderType: string;
  vertical?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
}

export interface MyPaymentsResult {
  dueNow: MyPaymentRow[];
  history: MyPaymentRow[];
  totalDue: number | null;
  currency: string | null;
}

type PaymentRecord = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'order_type' | 'vertical' | 'total_amount' | 'currency' | 'status' | 'created_at' | 'paid_at'>;
function mapRow(r: PaymentRecord): MyPaymentRow {
  if (!Number.isFinite(r.total_amount) || !r.currency?.trim()) throw new Error('payment_amount_unavailable');
  return {
    id: r.id as string,
    orderId: r.id as string,
    orderNumber: r.order_number ?? null,
    orderType: (r.order_type as string) ?? 'order',
    vertical: r.vertical ?? null,
    amount: r.total_amount,
    currency: r.currency,
    status: r.status ?? 'unknown',
    createdAt: r.created_at ?? '',
    paidAt: r.paid_at ?? null,
  };
}

async function fetchPayments(userId: string): Promise<MyPaymentsResult> {
    const [dueResult, historyResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, order_type, vertical, total_amount, currency, status, created_at, paid_at')
        .eq('customer_user_id', userId)
        .is('deleted_at', null)
        .is('paid_at', null)
        .in('status', ['pending', 'pending_advance', 'awaiting_client_payment', 'pending_deposit'] as const)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('orders')
        .select('id, order_number, order_type, vertical, total_amount, currency, status, created_at, paid_at')
        .eq('customer_user_id', userId)
        .is('deleted_at', null)
        .or('paid_at.not.is.null,status.in.(completed,refunded,cancelled)')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (dueResult.error) throw dueResult.error;
    if (historyResult.error) throw historyResult.error;
    const dueNow = (dueResult.data ?? []).map(mapRow);
    const history = (historyResult.data ?? []).map(mapRow);
    const currencies = new Set(dueNow.map(row => row.currency));
    const totalDue = currencies.size > 1 ? null : dueNow.reduce((s, r) => s + r.amount, 0);
    const currency = currencies.size > 1 ? null : dueNow[0]?.currency ?? history[0]?.currency ?? null;
    return { dueNow, history, totalDue, currency };
}

export function useMyPayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['me-payments', user?.id ?? null],
    queryFn: () =>
      user
        ? fetchPayments(user.id)
        : Promise.resolve({ dueNow: [], history: [], totalDue: null, currency: null } as MyPaymentsResult),
    enabled: !!user,
    staleTime: 60_000,
  });
}
