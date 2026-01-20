import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingResponse: 0,
    resolved: 0,
    overdueSla: 0,
    urgent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<TicketFilters>({ status: 'all', priority: 'all' });

  const fetchTickets = async () => {
    try {
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
        query = query.or(`ticket_number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets((data as unknown as SupportTicket[]) || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить тикеты',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: allTickets, error } = await supabase
        .from('support_tickets')
        .select('status, priority, sla_deadline');

      if (error) throw error;

      const now = new Date();
      const ticketsList = (allTickets as unknown as SupportTicket[]) || [];

      setStats({
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
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<boolean> => {
    try {
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

      toast({ title: 'Статус обновлён' });
      await Promise.all([fetchTickets(), fetchStats()]);
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive',
      });
      return false;
    }
  };

  const assignTicket = async (ticketId: string, adminId: string | null): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = { 
        assigned_to: adminId,
        status: adminId ? 'in_progress' : 'open',
      };

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast({ title: adminId ? 'Тикет назначен' : 'Назначение снято' });
      await fetchTickets();
      return true;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось назначить тикет',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updatePriority = async (ticketId: string, priority: TicketPriority): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ priority })
        .eq('id', ticketId);

      if (error) throw error;

      toast({ title: 'Приоритет обновлён' });
      await Promise.all([fetchTickets(), fetchStats()]);
      return true;
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить приоритет',
        variant: 'destructive',
      });
      return false;
    }
  };

  const resolveTicket = async (
    ticketId: string,
    resolutionType: ResolutionType,
    resolution: string,
    refundAmount?: number
  ): Promise<boolean> => {
    try {
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

      toast({ title: 'Тикет решён' });
      await Promise.all([fetchTickets(), fetchStats()]);
      return true;
    } catch (error) {
      console.error('Error resolving ticket:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось решить тикет',
        variant: 'destructive',
      });
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
    } catch (error) {
      console.error('Error adding message:', error);
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
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filters]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          fetchTickets();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    refetch: () => Promise.all([fetchTickets(), fetchStats()]),
  };
}
