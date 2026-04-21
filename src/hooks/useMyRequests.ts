/**
 * useMyRequests — unified request tracker for /me/requests.
 *
 * Aggregates user-facing service requests from multiple verticals into one
 * Kanban-friendly list with 4 statuses:
 *   - new         → freshly created, awaiting triage
 *   - in_progress → being worked on
 *   - waiting     → blocked on user / external
 *   - done        → resolved
 *
 * Sources:
 *   - concierge_sessions  → AI concierge intake
 *   - visa_records        → visa applications
 *   - orders              → service-line orders not in payments bucket
 *
 * Each source maps its own status vocabulary into the canonical 4-bucket model.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type RequestStatus = 'new' | 'in_progress' | 'waiting' | 'done';
export type RequestSource = 'concierge' | 'visa' | 'order';

export interface MyRequest {
  id: string;
  source: RequestSource;
  status: RequestStatus;
  title: string;
  subtitle?: string;
  createdAt: string;
  detailPath?: string;
}

function mapOrderStatus(s: string): RequestStatus {
  switch (s) {
    case 'pending':
    case 'awaiting_payment':
      return 'new';
    case 'paid':
    case 'confirmed':
    case 'in_progress':
      return 'in_progress';
    case 'awaiting_user':
      return 'waiting';
    case 'completed':
    case 'cancelled':
    case 'refunded':
      return 'done';
    default:
      return 'in_progress';
  }
}

function mapVisaStatus(s?: string | null): RequestStatus {
  switch ((s ?? '').toLowerCase()) {
    case 'submitted':
    case 'review':
      return 'in_progress';
    case 'awaiting_documents':
    case 'on_hold':
      return 'waiting';
    case 'approved':
    case 'rejected':
    case 'closed':
      return 'done';
    default:
      return 'new';
  }
}

async function fetchRequests(userId: string): Promise<MyRequest[]> {
  const out: MyRequest[] = [];

  try {
    const { data } = await supabase
      .from('concierge_sessions')
      .select('id, primary_intent, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    for (const r of data ?? []) {
      const status: RequestStatus =
        r.status === 'completed' ? 'done' :
        r.status === 'in_progress' ? 'in_progress' :
        'new';
      out.push({
        id: `concierge-${r.id}`,
        source: 'concierge',
        status,
        title: (r.primary_intent as string) ?? 'Concierge request',
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
        detailPath: '/me/services',
      });
    }
  } catch { /* silent */ }

  try {
    const { data } = await supabase
      .from('visa_records')
      .select('id, visa_type, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    for (const r of data ?? []) {
      out.push({
        id: `visa-${r.id}`,
        source: 'visa',
        status: mapVisaStatus(r.status as string | null),
        title: `Visa: ${r.visa_type ?? '—'}`,
        subtitle: (r.status as string) ?? undefined,
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
        detailPath: '/visa',
      });
    }
  } catch { /* silent */ }

  try {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, order_type, vertical, status, created_at')
      .eq('customer_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    for (const r of data ?? []) {
      out.push({
        id: `order-${r.id}`,
        source: 'order',
        status: mapOrderStatus(r.status as string),
        title: `${r.order_type ?? 'Order'} ${r.order_number ?? ''}`.trim(),
        subtitle: (r.vertical as string) ?? undefined,
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
        detailPath: `/orders/${r.id}/tracking`,
      });
    }
  } catch { /* silent */ }

  out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return out;
}

export function useMyRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['me-requests', user?.id ?? null],
    queryFn: () => (user ? fetchRequests(user.id) : Promise.resolve([] as MyRequest[])),
    enabled: !!user,
    staleTime: 60_000,
  });
}
