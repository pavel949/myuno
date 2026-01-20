import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];

export type TicketCategory = 'refund' | 'quality' | 'fraud' | 'damage' | 'payment' | 'delivery' | 'cancellation' | 'other';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed' | 'escalated';
export type ReporterType = 'guest' | 'owner' | 'vendor' | 'anonymous';
export type ResolutionType = 'refund_full' | 'refund_partial' | 'no_refund' | 'compensation' | 'mediation' | 'rejected';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string | null;
  order_id: string | null;
  booking_id: string | null;
  property_id: string | null;
  provider_id: string | null;
  reporter_type: ReporterType;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  attachments: string[];
  status: TicketStatus;
  assigned_to: string | null;
  sla_deadline: string | null;
  resolution: string | null;
  resolution_type: ResolutionType | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'admin' | 'system';
  sender_name: string | null;
  message: string;
  attachments: string[];
  is_internal: boolean;
  created_at: string;
}

export interface CreateTicketInput {
  category: TicketCategory;
  priority?: TicketPriority;
  subject: string;
  description: string;
  reporter_type?: ReporterType;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  order_id?: string;
  booking_id?: string;
  property_id?: string;
  provider_id?: string;
  attachments?: string[];
}

export function useTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    if (!user) {
      setTickets([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data as unknown as SupportTicket[]) || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить обращения',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async (input: CreateTicketInput): Promise<SupportTicket | null> => {
    try {
      const ticketData = {
        user_id: user?.id || null,
        category: input.category,
        priority: input.priority || 'normal',
        subject: input.subject,
        description: input.description,
        reporter_type: input.reporter_type || (user ? 'guest' : 'anonymous'),
        reporter_name: input.reporter_name || null,
        reporter_email: input.reporter_email || null,
        reporter_phone: input.reporter_phone || null,
        order_id: input.order_id || null,
        booking_id: input.booking_id || null,
        property_id: input.property_id || null,
        provider_id: input.provider_id || null,
        attachments: JSON.stringify(input.attachments || []),
      } as Omit<SupportTicketInsert, 'ticket_number'>;

      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticketData as SupportTicketInsert])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Обращение создано',
        description: `Номер: ${(data as unknown as SupportTicket).ticket_number}`,
      });

      await fetchTickets();
      return data as unknown as SupportTicket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать обращение',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getTicket = async (ticketId: string): Promise<SupportTicket | null> => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data as unknown as SupportTicket;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
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

  const addMessage = async (ticketId: string, message: string, attachments?: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_type: 'user',
          message,
          attachments: attachments || [],
        });

      if (error) throw error;

      toast({
        title: 'Сообщение отправлено',
      });

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

  useEffect(() => {
    fetchTickets();
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    tickets,
    isLoading,
    createTicket,
    getTicket,
    getTicketMessages,
    addMessage,
    refetch: fetchTickets,
  };
}
