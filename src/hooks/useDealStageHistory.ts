import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';
import { useAuth } from '@/contexts/AuthContext';

export interface DealStageHistoryEntry {
  id: string;
  deal_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  duration_in_previous_stage: string | null;
}

export function useDealStageHistory(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-stage-history', dealId],
    queryFn: async () => {
      const { data, error } = await typedFrom('deal_stage_history')
        .select('*')
        .eq('deal_id', dealId!)
        .order('changed_at', { ascending: false });
      if (error) throw error;
      return data as DealStageHistoryEntry[];
    },
    enabled: !!dealId,
  });
}

export function useLogStageChange() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, fromStageId, toStageId, notes }: {
      dealId: string;
      fromStageId: string | null;
      toStageId: string;
      notes?: string;
    }) => {
      const { error } = await typedFrom('deal_stage_history').insert({
        deal_id: dealId,
        from_stage_id: fromStageId,
        to_stage_id: toStageId,
        changed_by: user?.id || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['deal-stage-history', vars.dealId] }),
  });
}
