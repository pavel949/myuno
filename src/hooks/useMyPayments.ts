/**
 * useMyPayments — universal payment tracker for /me/payments.
 *
 * Returns three buckets (Gosuslugi-style "Платежи"):
 *   - dueNow   → orders with status='pending'
 *   - history  → orders with status in (paid, completed, refunded), recent
 *
 * Phase A5 only — Phase B will add utilities/tax/visa fees aggregation.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  totalDue: number;
  currency: string;
}

function mapRow(r: any): MyPaymentRow {
  return {
    id: r.id as string,
    orderId: r.id as string,
    orderNumber: r.order_number ?? null,
    orderType: (r.order_type as string) ?? 'order',
    vertical: r.vertical ?? null,
    amount: Number(r.total_amount ?? 0),
    currency: (r.currency as string) ?? 'THB',
    status: (r.status as string) ?? 'pending',
    createdAt: (r.created_at as string) ?? new Date().toISOString(),
    paidAt: r.paid_at ?? null,
  };
}

async function fetchPayments(userId: string): Promise<MyPaymentsResult> {
  const empty: MyPaymentsResult = { dueNow: [], history: [], totalDue: 0, currency: 'THB' };

  try {
    const [{ data: due }, { data: hist }] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, order_type, vertical, total_amount, currency, status, created_at, paid_at')
        .eq('customer_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('orders')
        .select('id, order_number, order_type, vertical, total_amount, currency, status, created_at, paid_at')
        .eq('customer_user_id', userId)
        .in('status', ['paid', 'completed', 'refunded', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const dueNow = (due ?? []).map(mapRow);
    const history = (hist ?? []).map(mapRow);
    const totalDue = dueNow.reduce((s, r) => s + r.amount, 0);
    const currency = dueNow[0]?.currency ?? history[0]?.currency ?? 'THB';
    return { dueNow, history, totalDue, currency };
  } catch {
    return empty;
  }
}

export function useMyPayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['me-payments', user?.id ?? null],
    queryFn: () =>
      user
        ? fetchPayments(user.id)
        : Promise.resolve({ dueNow: [], history: [], totalDue: 0, currency: 'THB' } as MyPaymentsResult),
    enabled: !!user,
    staleTime: 60_000,
  });
}
