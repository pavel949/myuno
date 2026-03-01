import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface YachtPricingRule {
  id: string;
  yacht_id: string;
  rule_type: 'season' | 'day_of_week' | 'special_event';
  name_en: string;
  name_ru: string | null;
  start_date: string | null;
  end_date: string | null;
  days_of_week: number[] | null;
  price_modifier_percent: number | null;
  price_override_half_day: number | null;
  price_override_full_day: number | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreatePricingRuleInput = Omit<YachtPricingRule, 'id' | 'created_at' | 'updated_at'>;

export function useYachtPricingRules(yachtId?: string) {
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['yacht-pricing-rules', yachtId],
    queryFn: async () => {
      if (!yachtId) return [];

      const { data, error } = await supabase
        .from('yacht_pricing_rules')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as YachtPricingRule[];
    },
    enabled: !!yachtId,
  });

  const createRule = useMutation({
    mutationFn: async (input: CreatePricingRuleInput) => {
      const { data, error } = await supabase
        .from('yacht_pricing_rules')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as YachtPricingRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-pricing-rules', yachtId] });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<YachtPricingRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('yacht_pricing_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as YachtPricingRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-pricing-rules', yachtId] });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('yacht_pricing_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-pricing-rules', yachtId] });
    },
  });

  return {
    rules,
    isLoading,
    createRule: createRule.mutateAsync,
    updateRule: updateRule.mutateAsync,
    deleteRule: deleteRule.mutateAsync,
    isCreating: createRule.isPending,
    isUpdating: updateRule.isPending,
    isDeleting: deleteRule.isPending,
  };
}

// Hook to get calculated price for a specific date
export function useYachtPriceForDate(yachtId?: string, date?: Date, charterType: 'half_day' | 'full_day' = 'full_day') {
  return useQuery({
    queryKey: ['yacht-price', yachtId, date?.toISOString(), charterType],
    queryFn: async () => {
      if (!yachtId || !date) return null;

      const { data, error } = await supabase.rpc('get_yacht_price_for_date', {
        p_yacht_id: yachtId,
        p_date: date.toISOString().split('T')[0],
        p_charter_type: charterType,
      });

      if (error) {
        return null;
      }

      return data as number;
    },
    enabled: !!yachtId && !!date,
  });
}
