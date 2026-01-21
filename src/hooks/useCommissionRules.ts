import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommissionRule {
  id: string;
  vertical: string;
  base_commission: number;
  min_commission_amount: number | null;
  max_commission_amount: number | null;
  tiered_rates: {
    tiers?: Array<{
      min_gmv: number;
      max_gmv: number | null;
      rate: number;
    }>;
  } | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TieredRate {
  min_gmv: number;
  max_gmv: number | null;
  rate: number;
}

export interface UpdateCommissionRuleData {
  base_commission?: number;
  min_commission_amount?: number | null;
  max_commission_amount?: number | null;
  tiered_rates?: { tiers: TieredRate[] } | null;
  notes?: string | null;
  is_active?: boolean;
}

export function useCommissionRules() {
  const queryClient = useQueryClient();

  const { data: rules, isLoading, refetch } = useQuery({
    queryKey: ['commission-rules'],
    queryFn: async (): Promise<CommissionRule[]> => {
      const { data, error } = await supabase
        .from('vertical_commission_rules')
        .select('*')
        .order('vertical');

      if (error) throw error;
      return (data || []) as CommissionRule[];
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ vertical, data }: { vertical: string; data: UpdateCommissionRuleData }) => {
      const updateData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
      };
      // Convert tiered_rates to JSON-compatible format
      if (data.tiered_rates) {
        updateData.tiered_rates = JSON.parse(JSON.stringify(data.tiered_rates));
      }
      
      const { data: result, error } = await supabase
        .from('vertical_commission_rules')
        .update(updateData)
        .eq('vertical', vertical)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('Комиссия обновлена');
    },
    onError: (error) => {
      console.error('Error updating commission rule:', error);
      toast.error('Ошибка при обновлении комиссии');
    },
  });

  const createRule = useMutation({
    mutationFn: async (data: { vertical: string; base_commission: number; notes?: string }) => {
      const { data: result, error } = await supabase
        .from('vertical_commission_rules')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('Правило комиссии создано');
    },
    onError: (error) => {
      console.error('Error creating commission rule:', error);
      toast.error('Ошибка при создании правила');
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (vertical: string) => {
      const { error } = await supabase
        .from('vertical_commission_rules')
        .delete()
        .eq('vertical', vertical);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('Правило удалено');
    },
    onError: (error) => {
      console.error('Error deleting commission rule:', error);
      toast.error('Ошибка при удалении правила');
    },
  });

  return {
    rules: rules || [],
    isLoading,
    refetch,
    updateRule,
    createRule,
    deleteRule,
  };
}
