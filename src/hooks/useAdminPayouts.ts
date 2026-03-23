import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorPayout {
  id: string;
  provider_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  provider?: {
    id: string;
    name: string;
    pending_payout: number;
    total_earnings: number;
    business_category: string;
  };
}

export interface PendingPayoutProvider {
  id: string;
  name: string;
  pendingPayout: number;
  totalEarnings: number;
  businessCategory: string;
  lastPayoutDate: string | null;
}

export function useAdminPayouts() {
  const queryClient = useQueryClient();

  // Fetch payout history
  const { data: payouts, isLoading: payoutsLoading, refetch } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async (): Promise<VendorPayout[]> => {
      const { data, error } = await supabase
        .from('vendor_payouts')
        .select(`
          *,
          provider:provider_id (
            id,
            name,
            pending_payout,
            total_earnings,
            business_category
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as VendorPayout[];
    },
  });

  // Fetch providers with pending payouts
  const { data: pendingProviders, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-payouts'],
    queryFn: async (): Promise<PendingPayoutProvider[]> => {
      const { data: providers, error } = await supabase
        .from('providers')
        .select('id, name, pending_payout, total_earnings, business_category')
        .gt('pending_payout', 0)
        .order('pending_payout', { ascending: false });

      if (error) throw error;

      // Get last payout date for each provider
      const providerIds = providers?.map(p => p.id) || [];
      
      const { data: lastPayouts } = await supabase
        .from('vendor_payouts')
        .select('provider_id, processed_at')
        .in('provider_id', providerIds)
        .eq('status', 'completed')
        .order('processed_at', { ascending: false });

      const lastPayoutMap = new Map<string, string>();
      lastPayouts?.forEach(p => {
        if (!lastPayoutMap.has(p.provider_id)) {
          lastPayoutMap.set(p.provider_id, p.processed_at || '');
        }
      });

      return (providers || []).map(p => ({
        id: p.id,
        name: p.name || 'Unknown',
        pendingPayout: Number(p.pending_payout) || 0,
        totalEarnings: Number(p.total_earnings) || 0,
        businessCategory: p.business_category || 'other',
        lastPayoutDate: lastPayoutMap.get(p.id) || null,
      }));
    },
  });

  // Create a payout
  const createPayout = useMutation({
    mutationFn: async ({ providerId, amount, paymentMethod, notes }: {
      providerId: string;
      amount: number;
      paymentMethod?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('vendor_payouts')
        .insert({
          provider_id: providerId,
          amount,
          payment_method: paymentMethod || 'bank_transfer',
          notes,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payouts'] });
      toast.success('Выплата создана');
    },
    onError: (error) => {
      logger.error('Error creating payout:', error);
      toast.error('Ошибка при создании выплаты');
    },
  });

  // Process a payout atomically using database function
  const processPayout = useMutation({
    mutationFn: async ({ payoutId, status, paymentReference }: {
      payoutId: string;
      status: 'completed' | 'failed';
      paymentReference?: string;
    }) => {
      // Use atomic database function for transaction safety
      const { data, error } = await supabase.rpc('process_payout', {
        p_payout_id: payoutId,
        p_new_status: status,
        p_payment_reference: paymentReference || null,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to process payout');
      }

      return { payoutId, status };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-summary'] });
      toast.success(variables.status === 'completed' ? 'Выплата обработана' : 'Выплата отклонена');
    },
    onError: (error) => {
      logger.error('Error processing payout:', error);
      toast.error('Ошибка при обработке выплаты');
    },
  });

  // Bulk create payouts for providers
  const createBulkPayouts = useMutation({
    mutationFn: async (providerIds: string[]) => {
      // Get pending amounts for each provider
      const { data: providers, error: fetchError } = await supabase
        .from('providers')
        .select('id, pending_payout')
        .in('id', providerIds)
        .gt('pending_payout', 0);

      if (fetchError) throw fetchError;

      const payouts = providers?.map(p => ({
        provider_id: p.id,
        amount: Number(p.pending_payout) || 0,
        status: 'pending' as const,
        payment_method: 'bank_transfer',
      })) || [];

      if (payouts.length === 0) {
        throw new Error('No providers with pending payouts');
      }

      const { data, error } = await supabase
        .from('vendor_payouts')
        .insert(payouts)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payouts'] });
      toast.success(`Создано ${data?.length || 0} выплат`);
    },
    onError: (error) => {
      logger.error('Error creating bulk payouts:', error);
      toast.error('Ошибка при создании выплат');
    },
  });

  // Stats
  const pendingCount = payouts?.filter(p => p.status === 'pending').length || 0;
  const processingCount = payouts?.filter(p => p.status === 'processing').length || 0;
  const totalPendingAmount = pendingProviders?.reduce((sum, p) => sum + p.pendingPayout, 0) || 0;

  return {
    payouts: payouts || [],
    pendingProviders: pendingProviders || [],
    isLoading: payoutsLoading || pendingLoading,
    refetch,
    createPayout,
    processPayout,
    createBulkPayouts,
    pendingCount,
    processingCount,
    totalPendingAmount,
  };
}
