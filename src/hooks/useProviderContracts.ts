import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProviderContract {
  id: string;
  entity_type: 'provider' | 'vendor' | 'pm_company' | 'project';
  entity_id: string;
  contract_number?: string;
  contract_type: string;
  commission_rate: number;
  commission_type: string;
  min_commission_amount?: number | null;
  max_commission_amount?: number | null;
  tiered_rates?: Record<string, unknown> | null;
  payment_terms: string;
  payment_method?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  valid_from: string;
  valid_until?: string;
  auto_renew: boolean;
  notice_period_days: number;
  status: 'draft' | 'pending_approval' | 'active' | 'suspended' | 'terminated' | 'expired';
  special_terms?: string;
  notes?: string;
  contract_document_url?: string;
  approved_by?: string;
  approved_at?: string;
  terminated_by?: string;
  terminated_at?: string;
  termination_reason?: string;
  created_at: string;
  updated_at: string;
}

export type ContractInsert = Omit<ProviderContract, 'id' | 'created_at' | 'updated_at' | 'approved_at' | 'terminated_at'>;
export type ContractUpdate = Partial<ContractInsert>;

export function useProviderContracts(entityType?: string, entityId?: string) {
  const queryClient = useQueryClient();

  const { data: contracts, isLoading, refetch } = useQuery({
    queryKey: ['provider-contracts', entityType, entityId],
    queryFn: async (): Promise<ProviderContract[]> => {
      let query = supabase
        .from('provider_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ProviderContract[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (contract: ContractInsert) => {
      const { data, error } = await supabase
        .from('provider_contracts')
        .insert(contract as any)
        .select()
        .single();

      if (error) throw error;
      return data as ProviderContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-contracts'] });
      toast.success('Контракт создан');
    },
    onError: (error) => {
      console.error('Error creating contract:', error);
      toast.error('Ошибка при создании контракта');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContractUpdate }) => {
      const { data: result, error } = await supabase
        .from('provider_contracts')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ProviderContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-contracts'] });
      toast.success('Контракт обновлён');
    },
    onError: (error) => {
      console.error('Error updating contract:', error);
      toast.error('Ошибка при обновлении контракта');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('provider_contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-contracts'] });
      toast.success('Контракт удалён');
    },
    onError: (error) => {
      console.error('Error deleting contract:', error);
      toast.error('Ошибка при удалении контракта');
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('provider_contracts')
        .update({ 
          status: 'active', 
          approved_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-contracts'] });
      toast.success('Контракт активирован');
    },
  });

  return {
    contracts: contracts || [],
    isLoading,
    refetch,
    createContract: createMutation.mutateAsync,
    updateContract: updateMutation.mutateAsync,
    deleteContract: deleteMutation.mutateAsync,
    activateContract: activateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

// Get contract for a specific entity
export function useEntityContract(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['entity-contract', entityType, entityId],
    queryFn: async (): Promise<ProviderContract | null> => {
      const { data, error } = await supabase
        .from('provider_contracts')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ProviderContract | null;
    },
    enabled: !!entityType && !!entityId,
  });
}
