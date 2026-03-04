import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority, ResolutionType } from './useTickets';

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
  status?: TicketStatus | 'all';
  priority?: TicketPriority | 'all';
  category?: string;
  assignedTo?: string;
  search?: string;
}

export function useAdminTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TicketFilters>({ status: 'all', priority: 'all' });

  // Stabilize filter key for query
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  // Tickets query with React Query
  const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['admin-tickets', filterKey],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

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

      const { data, error } = await query;

      if (error) throw error;
      return (data as unknown as SupportTicket[]) || [];
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
  }, refetch: refetchStats } = useQuery({
    queryKey: ['admin-tickets-stats'],
    queryFn: async () => {
      const { data: allTickets, error } = await supabase
        .from('support_tickets')
        .select('status, priority, sla_deadline');

      if (error) throw error;

      const now = new Date();
      const ticketsList = (allTickets as unknown as SupportTicket[]) || [];

      return {
        total: ticketsList.length,
        open: ticketsList.filter(t => t.status === 'open').length,
        inProgress: ticketsList.filter(t => t.status === 'in_progress').length,
        waitingResponse: ticketsList.filter(t => t.status === 'waiting_response').length,
        resolved: ticketsList.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        overdueSla: ticketsList.filter(t => 
          t.sla_deadline && 
          new Date(t.sla_deadline) < now && 
          !['resolved', 'closed'].includes(t.status)
        ).length,
        urgent: ticketsList.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length,
      };
    },
    ...CACHE_PROFILES.ADMIN,
  });

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
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Статус обновлён' });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-stats'] });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive',
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
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: (_, { adminId }) => {
      toast({ title: adminId ? 'Тикет назначен' : 'Назначение снято' });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось назначить тикет',
        variant: 'destructive',
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
      toast({ title: 'Приоритет обновлён' });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-stats'] });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить приоритет',
        variant: 'destructive',
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
      toast({ title: 'Тикет решён' });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-stats'] });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось решить тикет',
        variant: 'destructive',
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

      toast({ title: isInternal ? 'Заметка добавлена' : 'Ответ отправлен' });
      return true;
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
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
  }, [queryClient]);

  return {
    tickets,
    stats,
    isLoading,
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
