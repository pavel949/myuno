import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applyTicketQueue, parseTicketStatus, type TicketQueueStatus } from '@/lib/adminDashboardQueues';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { useAuth } from '@/contexts/AuthContext';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority, ResolutionType } from './useTickets';

import { toast } from 'sonner';
export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingResponse: number;
  resolved: number;
  overdueSla: number;
  urgent: number;
}

export interface TicketFilters {
  status?: TicketQueueStatus;
  priority?: TicketPriority | 'all';
  category?: string;
  assignedTo?: string;
  search?: string;
}

export function useAdminTickets() {
const queryClient = useQueryClient();
  const { user } = useAuth();
  // Existing route/object authorization remains authoritative for support staff.
  const enabled = !!user;
  const [params, setParams] = useSearchParams();
  const rawPage = params.get('ticket_page') || '0';
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 0;
  const pageSize = 50;
  const setPage = (nextPage: number) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (nextPage > 0) next.set('ticket_page', String(nextPage)); else next.delete('ticket_page');
    return next;
  });
  const rawPriority = params.get('priority');
  const filters: TicketFilters = {
    status: parseTicketStatus(params),
    priority: ['urgent', 'high', 'normal', 'low'].includes(rawPriority || '') ? rawPriority as TicketPriority : 'all',
    category: params.get('category') || undefined,
    assignedTo: params.get('assigned_to') || undefined,
    search: params.get('q') || undefined,
  };
  const setFilters = (update: TicketFilters | ((previous: TicketFilters) => TicketFilters)) => {
    const nextFilters = typeof update === 'function' ? update(filters) : update;
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.delete('ticket_page');
      for (const [key, value] of Object.entries({status: nextFilters.status, priority: nextFilters.priority, category: nextFilters.category, assigned_to: nextFilters.assignedTo, q: nextFilters.search})) {
        if (!value || value === 'all') next.delete(key); else next.set(key, value);
      }
      return next;
    });
  };

  // Stabilize filter key for query
  const filterKey = JSON.stringify(filters);

  // Tickets query with React Query
  const { data: ticketPage, isLoading: ticketsLoading, error: ticketsError, refetch: refetchTickets } = useQuery({
    queryKey: ['admin-tickets', user?.id, filterKey, page],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });

      query = applyTicketQueue(query, filters.status || 'all');

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters.search) {
        const s = sanitizeSearchTerm(filters.search);
        if (s) query = query.or(`ticket_number.ilike.%${s}%,subject.ilike.%${s}%`);
      }

      const { data, error, count } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      if (!data) throw new Error('Support ticket response unavailable');
      return { rows: data as unknown as SupportTicket[], count: typeof count === 'number' ? count : null };
    },
    ...CACHE_PROFILES.ADMIN,
  });

  // Stats query - separate from filtered tickets for accurate counts
  const { data: stats = {
    total: 0,
    open: 0,
    inProgress: 0,
    waitingResponse: 0,
    resolved: 0,
    overdueSla: 0,
    urgent: 0,
  }, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['admin-tickets-stats', user?.id],
    enabled,
    queryFn: async () => {
      const query = () => supabase.from('support_tickets').select('id', { count: 'exact', head: true });
      const read = async (request: ReturnType<typeof query>) => {
        const { count, error } = await request;
        if (error) throw error;
        if (typeof count !== 'number') throw new Error('Support count unavailable');
        return count;
      };
      const [total, open, inProgress, waitingResponse, resolved, overdueSla, urgent] = await Promise.all([
        read(query()), read(applyTicketQueue(query(), 'open')), read(applyTicketQueue(query(), 'in_progress')),
        read(applyTicketQueue(query(), 'waiting_response')), read(query().in('status', ['resolved', 'closed'])),
        read(query().lt('sla_deadline', new Date().toISOString()).not('status', 'in', '(resolved,closed)')),
        read(query().eq('priority', 'urgent').not('status', 'in', '(resolved,closed)')),
      ]);
      return {
        total, open, inProgress, waitingResponse, resolved, overdueSla, urgent,
      };
    },
    ...CACHE_PROFILES.ADMIN,
  });

  const tickets = ticketPage?.rows ?? [];
  const isLoading = ticketsLoading;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      const updateData: Record<string, unknown> = { status };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      } else if (status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData as never)
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast('Статус обновлён');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-stats'] });
    },
    onError: () => {
      toast.error('Ошибка', {
        description: 'Не удалось обновить статус',
      });
    },
  });

  const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<boolean> => {
    try {
      await updateStatusMutation.mutateAsync({ ticketId, status });
      return true;
    } catch {
      return false;
    }
  };

  // Assign ticket mutation
  const assignMutation = useMutation({
    mutationFn: async ({ ticketId, adminId }: { ticketId: string; adminId: string | null }) => {
      const updateData: Record<string, unknown> = { 
        assigned_to: adminId,
        status: adminId ? 'in_progress' : 'open',
      };

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData as never)
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: (_, { adminId }) => {
      toast(adminId ? 'Тикет назначен' : 'Назначение снято');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: () => {
      toast.error('Ошибка', {
        description: 'Не удалось назначить тикет',
      });
    },
  });

  const assignTicket = async (ticketId: string, adminId: string | null): Promise<boolean> => {
    try {
      await assignMutation.mutateAsync({ ticketId, adminId });
      return true;
    } catch {
      return false;
    }
  };

  // Update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ ticketId, priority }: { ticketId: string; priority: TicketPriority }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ priority })
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast('Приоритет обновлён');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-stats'] });
    },
    onError: () => {
      toast.error('Ошибка', {
        description: 'Не удалось обновить приоритет',
      });
    },
  });

  const updatePriority = async (ticketId: string, priority: TicketPriority): Promise<boolean> => {
    try {
      await updatePriorityMutation.mutateAsync({ ticketId, priority });
      return true;
    } catch {
      return false;
    }
  };

  // Resolve ticket mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ 
      ticketId, 
      resolutionType, 
      resolution, 
      refundAmount 
    }: { 
      ticketId: string; 
      resolutionType: ResolutionType; 
      resolution: string; 
      refundAmount?: number 
    }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolution_type: resolutionType,
          resolution,
          refund_amount: refundAmount || null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Add system message about resolution
      await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'system',
          message: `Тикет решён: ${resolution}`,
          is_internal: false,
        });
    },
    onSuccess: () => {
      toast('Тикет решён');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-stats'] });
    },
    onError: () => {
      toast.error('Ошибка', {
        description: 'Не удалось решить тикет',
      });
    },
  });

  const resolveTicket = async (
    ticketId: string,
    resolutionType: ResolutionType,
    resolution: string,
    refundAmount?: number
  ): Promise<boolean> => {
    try {
      await resolveMutation.mutateAsync({ ticketId, resolutionType, resolution, refundAmount });
      return true;
    } catch {
      return false;
    }
  };

  const addAdminMessage = async (
    ticketId: string,
    message: string,
    isInternal: boolean = false,
    senderName?: string
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: userData.user?.id,
          sender_type: 'admin',
          sender_name: senderName || 'Поддержка UNO',
          message,
          is_internal: isInternal,
        });

      if (error) throw error;

      // Update ticket status to waiting_response if sending to user
      if (!isInternal) {
        await supabase
          .from('support_tickets')
          .update({ status: 'waiting_response' })
          .eq('id', ticketId);
      }

      toast(isInternal ? 'Заметка добавлена' : 'Ответ отправлен');
      return true;
    } catch {
      toast.error('Ошибка', {
        description: 'Не удалось отправить сообщение',
      });
      return false;
    }
  };

  const getTicketMessages = async (ticketId: string): Promise<TicketMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as unknown as TicketMessage[]) || [];
    } catch {
      return [];
    }
  };

  // Real-time subscription for new tickets
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel('admin-tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          // Only invalidate on new ticket creation
          queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
          queryClient.invalidateQueries({ queryKey: ['admin-tickets-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, enabled]);

  return {
    tickets,
    total: ticketPage?.count ?? null,
    page,
    pageSize,
    setPage,
    stats,
    isLoading,
    error: ticketsError,
    statsError,
    statsLoading,
    filters,
    setFilters,
    updateTicketStatus,
    assignTicket,
    updatePriority,
    resolveTicket,
    addAdminMessage,
    getTicketMessages,
    refetch: () => Promise.all([refetchTickets(), refetchStats()]),
  };
}
