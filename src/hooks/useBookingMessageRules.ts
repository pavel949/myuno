import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BookingMessageRule {
  id: string;
  owner_id: string;
  property_id: string | null;
  template_id: string | null;
  trigger_event: string;
  delay_hours: number;
  channel: string;
  custom_subject: string | null;
  custom_subject_ru: string | null;
  custom_body: string | null;
  custom_body_ru: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const TRIGGER_EVENTS = [
  { value: 'booking_confirmed', labelEn: 'Booking Confirmed', labelRu: 'Бронь подтверждена', icon: '✅', defaultDelay: 0 },
  { value: 'pre_check_in', labelEn: 'Before Check-in', labelRu: 'До заезда', icon: '📅', defaultDelay: 24 },
  { value: 'check_in_day', labelEn: 'Check-in Day', labelRu: 'День заезда', icon: '🔑', defaultDelay: 0 },
  { value: 'post_check_in', labelEn: 'After Check-in', labelRu: 'После заезда', icon: '🏠', defaultDelay: 2 },
  { value: 'pre_check_out', labelEn: 'Before Check-out', labelRu: 'До выезда', icon: '⏰', defaultDelay: 24 },
  { value: 'check_out_day', labelEn: 'Check-out Day', labelRu: 'День выезда', icon: '🚪', defaultDelay: 0 },
  { value: 'post_check_out', labelEn: 'After Check-out', labelRu: 'После выезда', icon: '💝', defaultDelay: 2 },
  { value: 'review_request', labelEn: 'Review Request', labelRu: 'Запрос отзыва', icon: '⭐', defaultDelay: 48 },
] as const;

export const CHANNELS = [
  { value: 'in_app', labelEn: 'In-App', labelRu: 'В приложении', icon: '📱' },
  { value: 'email', labelEn: 'Email', labelRu: 'Email', icon: '📧' },
  { value: 'whatsapp', labelEn: 'WhatsApp', labelRu: 'WhatsApp', icon: '💬' },
] as const;

export function useBookingMessageRules(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['booking-message-rules', user?.id, propertyId];

  const { data: rules, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('booking_message_rules')
        .select('*')
        .eq('owner_id', user.id)
        .order('sort_order');

      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BookingMessageRule[];
    },
    enabled: !!user,
  });

  const createRule = useMutation({
    mutationFn: async (rule: Partial<BookingMessageRule>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('booking_message_rules')
        .insert({ ...rule, owner_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Rule created');
    },
    onError: () => toast.error('Failed to create rule'),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BookingMessageRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('booking_message_rules')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Rule updated');
    },
    onError: () => toast.error('Failed to update rule'),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('booking_message_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Rule deleted');
    },
    onError: () => toast.error('Failed to delete rule'),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('booking_message_rules')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    rules: rules || [],
    isLoading,
    createRule: createRule.mutateAsync,
    updateRule: updateRule.mutateAsync,
    deleteRule: deleteRule.mutateAsync,
    toggleRule: toggleRule.mutateAsync,
    isCreating: createRule.isPending,
  };
}
