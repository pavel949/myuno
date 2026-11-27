import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { applyManualPaymentQueue, applyTicketQueue } from '@/lib/adminDashboardQueues';

export type AdminCaseSource = 'payments' | 'support' | 'disputes';
export type AdminCaseView = 'all' | 'mine' | 'unassigned';
export interface AdminDashboardCase {
  id: string;
  source: AdminCaseSource;
  reference: string;
  subject: string | null;
  createdAt: string;
  deadline: string | null;
  assignedTo: string | null;
  assignedName?: string | null;
  status: string;
  href: string;
}
export interface AdminDashboardCases {
  items: AdminDashboardCase[];
  unavailable: AdminCaseSource[];
}

/** Bounded previews of existing queues. Domain screens remain the only writers. */
export async function fetchAdminDashboardCases(actorId: string, view: AdminCaseView): Promise<AdminDashboardCases> {
  const sources: { source: AdminCaseSource; read: () => Promise<AdminDashboardCase[]> }[] = [{
    source: 'support',
    read: async () => {
      let query = applyTicketQueue(supabase.from('support_tickets')
        .select('id,ticket_number,subject,status,created_at,sla_deadline,assigned_to'), 'active');
      if (view === 'mine') query = query.eq('assigned_to', actorId);
      if (view === 'unassigned') query = query.is('assigned_to', null);
      const { data, error } = await query.order('sla_deadline', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }).order('id').limit(5);
      if (error) throw error;
      if (!data) throw new Error('Support preview unavailable');
      const assigneeIds = [...new Set(data.map(row => row.assigned_to).filter((id): id is string => !!id))];
      const names = new Map<string, string>();
      if (assigneeIds.length) {
        try {
          const response = await supabase.from('profiles').select('id,full_name').in('id', assigneeIds);
          if (!response.error) response.data?.forEach(profile => {
            if (profile.full_name?.trim()) names.set(profile.id, profile.full_name.trim());
          });
        } catch { /* A failed name lookup never turns an assigned case into unassigned. */ }
      }
      return data.map(row => ({
        id: row.id, source: 'support' as const, reference: row.ticket_number || row.id.slice(0, 8),
        subject: row.subject, createdAt: row.created_at, deadline: row.sla_deadline,
        assignedTo: row.assigned_to, assignedName: row.assigned_to ? names.get(row.assigned_to) ?? null : null,
        status: row.status, href: `/admin/tickets/${encodeURIComponent(row.id)}`,
      }));
    },
  }];
  if (view === 'all') sources.push({
    source: 'payments',
    read: async () => {
      const { data, error } = await applyManualPaymentQueue(supabase.from('manual_payment_requests')
        .select('id,order_id,status,created_at,hold_expires_at'), 'review')
        .order('hold_expires_at', { ascending: true, nullsFirst: false }).order('created_at').order('id').limit(5);
      if (error) throw error;
      if (!data) throw new Error('Payment preview unavailable');
      return data.map(row => ({
        id: row.id, source: 'payments' as const, reference: row.order_id.slice(0, 8), subject: null,
        createdAt: row.created_at, deadline: row.hold_expires_at, assignedTo: null, status: row.status,
        href: `/admin/operations?tab=manual-payments&manual_status=review&request_id=${encodeURIComponent(row.id)}`,
      }));
    },
  }, {
    source: 'disputes',
    read: async () => {
      const { data, error } = await supabase.from('disputes').select('id,status,created_at')
        .eq('status', 'open').order('created_at').order('id').limit(5);
      if (error) throw error;
      if (!data) throw new Error('Dispute preview unavailable');
      return data.map(row => ({
        id: row.id, source: 'disputes' as const, reference: row.id.slice(0, 8), subject: null,
        createdAt: row.created_at, deadline: null, assignedTo: null, status: row.status,
        href: `/admin/disputes?dispute_id=${encodeURIComponent(row.id)}`,
      }));
    },
  });
  const results = await Promise.allSettled(sources.map(source => source.read()));
  const items: AdminDashboardCase[] = [];
  const unavailable: AdminCaseSource[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') items.push(...result.value);
    else unavailable.push(sources[index].source);
  });
  items.sort((a, b) => {
    const dueA = a.deadline ? Date.parse(a.deadline) : Infinity;
    const dueB = b.deadline ? Date.parse(b.deadline) : Infinity;
    return (Number.isFinite(dueA) ? dueA : Infinity) - (Number.isFinite(dueB) ? dueB : Infinity)
      || Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id);
  });
  return { items, unavailable };
}

export function useAdminDashboardCases(view: AdminCaseView) {
  const { user } = useAuth();
  const { isAdmin, isLoading: checkingAccess } = useAdminCheck();
  const enabled = !!user && isAdmin && !checkingAccess;
  const query = useQuery({
    queryKey: ['admin-dashboard', 'cases', user?.id, view],
    enabled,
    queryFn: () => fetchAdminDashboardCases(user!.id, view),
    staleTime: 0,
    refetchInterval: enabled ? 30_000 : false,
  });
  return { ...query, data: enabled && !query.isError ? query.data : undefined, admitted: enabled, actorId: user?.id };
}
