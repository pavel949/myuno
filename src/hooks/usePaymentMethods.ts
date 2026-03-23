import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand: string | null;
  exp_month: number | null;
  exp_year: number | null;
  holder_name: string | null;
  is_default: boolean;
  stripe_payment_method_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodData {
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  holder_name?: string;
  is_default?: boolean;
  stripe_payment_method_id?: string;
}

export function usePaymentMethods() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: paymentMethods = [], isLoading, error } = useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: async (): Promise<PaymentMethod[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PaymentMethod[];
    },
    enabled: !!user?.id,
  });

  const addPaymentMethod = useMutation({
    mutationFn: async (data: CreatePaymentMethodData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('user_payment_methods')
        .insert({ user_id: user.id, ...data })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', user?.id] });
      toast.success('Карта добавлена');
    },
    onError: (error) => {
      logger.error('Add payment method error:', error);
      toast.error('Ошибка добавления карты');
    },
  });

  const setDefaultMethod = useMutation({
    mutationFn: async (methodId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_payment_methods')
        .update({ is_default: true })
        .eq('id', methodId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', user?.id] });
      toast.success('Карта по умолчанию изменена');
    },
    onError: (error) => {
      logger.error('Set default method error:', error);
      toast.error('Ошибка изменения карты');
    },
  });

  const deletePaymentMethod = useMutation({
    mutationFn: async (methodId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_payment_methods')
        .delete()
        .eq('id', methodId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods', user?.id] });
      toast.success('Карта удалена');
    },
    onError: (error) => {
      logger.error('Delete payment method error:', error);
      toast.error('Ошибка удаления карты');
    },
  });

  const defaultMethod = paymentMethods.find(m => m.is_default) || paymentMethods[0] || null;

  return {
    paymentMethods,
    defaultMethod,
    isLoading,
    error,
    addPaymentMethod: addPaymentMethod.mutate,
    setDefaultMethod: setDefaultMethod.mutate,
    deletePaymentMethod: deletePaymentMethod.mutate,
    isAdding: addPaymentMethod.isPending,
    isDeleting: deletePaymentMethod.isPending,
  };
}
