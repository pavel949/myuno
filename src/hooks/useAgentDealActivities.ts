/**
 * Hook for agent_deal_activities CRUD
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DealActivity {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: string;
  description: string | null;
  stage_from: string | null;
  stage_to: string | null;
  created_at: string;
}

export function useDealActivities(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-activities', dealId],
    queryFn: async (): Promise<DealActivity[]> => {
      const { data, error } = await supabase
        .from('agent_deal_activities')
        .select('*')
        .eq('deal_id', dealId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DealActivity[];
    },
    enabled: !!dealId && /^[0-9a-f]{8}-/i.test(dealId),
  });
}

export function useAddDealActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activity: Omit<DealActivity, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('agent_deal_activities')
        .insert(activity as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['deal-activities', vars.deal_id] });
    },
  });
}
