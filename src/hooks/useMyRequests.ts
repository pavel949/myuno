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
export type RequestSource = 'concierge' | 'visa' | 'order' | 'help';

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

async function fetchRequests(userId: string): Promise<{ requests: MyRequest[]; failedSources: RequestSource[] }> {
  const out: MyRequest[] = [];
  const failedSources: RequestSource[] = [];

  try {
    const { data, error } = await supabase
      .from('concierge_sessions')
      .select('id, goal, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    for (const r of data ?? []) {
      const s = (r.status as string) ?? 'open';
      const status: RequestStatus =
        s === 'completed' || s === 'closed' ? 'done' :
        s === 'in_progress' ? 'in_progress' :
        s === 'waiting' ? 'waiting' :
        'new';
      out.push({
        id: `concierge-${r.id}`,
        source: 'concierge',
        status,
        title: (r.goal as string) ?? 'Concierge request',
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
        detailPath: '/me/services',
      });
    }
  } catch { failedSources.push('concierge'); }

  try {
    const { data, error } = await supabase
      .from('visa_records')
      .select('id, visa_type, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
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
  } catch { failedSources.push('visa'); }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, order_type, vertical, status, created_at')
      .eq('customer_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
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
  } catch { failedSources.push('order'); }

  try {
    const { data, error } = await supabase
      .from('help_requests')
      .select('id, topic, subject, message, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    for (const r of data ?? []) {
      const s = (r.status as string) ?? 'new';
      const status: RequestStatus =
        s === 'closed' ? 'done' :
        s === 'in_progress' ? 'in_progress' :
        s === 'waiting_user' ? 'waiting' :
        s === 'spam' ? 'done' :
        'new';
      const subj = (r.subject as string | null) ?? (r.message as string).slice(0, 60);
      out.push({
        id: `help-${r.id}`,
        source: 'help',
        status,
        title: subj,
        subtitle: (r.topic as string) ?? undefined,
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
        detailPath: '/me/requests',
      });
    }
  } catch { failedSources.push('help'); }

  out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { requests: out, failedSources };
}

export function useMyRequests() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['me-requests', user?.id ?? null],
    queryFn: () => (user ? fetchRequests(user.id) : Promise.resolve({ requests: [] as MyRequest[], failedSources: [] as RequestSource[] })),
    enabled: !!user,
    staleTime: 60_000,
  });
  // Keep the public requests-array API while retaining source-level read completeness.
  return { ...query, data: query.data?.requests, failedSources: query.data?.failedSources ?? [] };
}
