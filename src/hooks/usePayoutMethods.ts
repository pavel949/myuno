import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PayoutMethod {
  id: string;
  provider_id: string;
  type: 'bank_account' | 'promptpay';
  bank_code: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePayoutMethodData {
  type: 'bank_account' | 'promptpay';
  bank_code?: string;
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  is_default?: boolean;
}

export function usePayoutMethods() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // First get provider_id for user
  const { data: provider } = useQuery({
    queryKey: ['provider-for-payouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const providerId = provider?.id;

  const { data: payoutMethods = [], isLoading, error } = useQuery({
    queryKey: ['payout-methods', providerId],
    queryFn: async (): Promise<PayoutMethod[]> => {
      if (!providerId) return [];

      // Direct query with type assertion since table was just created
      const { data, error } = await supabase
        .from('provider_payout_methods' as any)
        .select('*')
        .eq('provider_id', providerId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PayoutMethod[];
    },
    enabled: !!providerId,
  });

  const addPayoutMethod = useMutation({
    mutationFn: async (data: CreatePayoutMethodData) => {
      if (!providerId) throw new Error('Provider not found');

      // If setting as default, first unset all others
      if (data.is_default) {
        await supabase
          .from('provider_payout_methods' as any)
          .update({ is_default: false })
          .eq('provider_id', providerId);
      }

      const { data: result, error } = await supabase
        .from('provider_payout_methods' as any)
        .insert({ provider_id: providerId, ...data })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-methods', providerId] });
      toast.success('Реквизиты добавлены');
    },
    onError: (error) => {
      console.error('Add payout method error:', error);
      toast.error('Ошибка добавления реквизитов');
    },
  });

  const setDefaultMethod = useMutation({
    mutationFn: async (methodId: string) => {
      if (!providerId) throw new Error('Provider not found');

      // Unset all defaults first
      await supabase
        .from('provider_payout_methods' as any)
        .update({ is_default: false })
        .eq('provider_id', providerId);

      // Set new default
      const { error } = await supabase
        .from('provider_payout_methods' as any)
        .update({ is_default: true })
        .eq('id', methodId)
        .eq('provider_id', providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-methods', providerId] });
      toast.success('Основные реквизиты изменены');
    },
    onError: (error) => {
      console.error('Set default method error:', error);
      toast.error('Ошибка изменения реквизитов');
    },
  });

  const deletePayoutMethod = useMutation({
    mutationFn: async (methodId: string) => {
      if (!providerId) throw new Error('Provider not found');

      const { error } = await supabase
        .from('provider_payout_methods' as any)
        .delete()
        .eq('id', methodId)
        .eq('provider_id', providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-methods', providerId] });
      toast.success('Реквизиты удалены');
    },
    onError: (error) => {
      console.error('Delete payout method error:', error);
      toast.error('Ошибка удаления реквизитов');
    },
  });

  const defaultMethod = payoutMethods.find(m => m.is_default) || payoutMethods[0] || null;

  return {
    payoutMethods,
    defaultMethod,
    isLoading,
    error,
    addPayoutMethod: addPayoutMethod.mutate,
    setDefaultMethod: setDefaultMethod.mutate,
    deletePayoutMethod: deletePayoutMethod.mutate,
    isAdding: addPayoutMethod.isPending,
    isDeleting: deletePayoutMethod.isPending,
  };
}
