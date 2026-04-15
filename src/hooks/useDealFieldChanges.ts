/**
 * Hook for deal field-level audit trail
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DealFieldChange {
  id: string;
  deal_id: string;
  user_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export function useDealFieldChanges(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-field-changes', dealId],
    queryFn: async (): Promise<DealFieldChange[]> => {
      const { data, error } = await supabase
        .from('deal_field_changes')
        .select('*')
        .eq('deal_id', dealId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as DealFieldChange[];
    },
    enabled: !!dealId && /^[0-9a-f]{8}-/i.test(dealId),
  });
}

/** Log multiple field changes at once */
export function useLogDealChanges() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, changes }: { 
      dealId: string; 
      changes: { field_name: string; old_value: string | null; new_value: string | null }[] 
    }) => {
      if (!user || changes.length === 0) return;
      const rows = changes.map(c => ({
        deal_id: dealId,
        user_id: user.id,
        ...c,
      }));
      const { error } = await supabase
        .from('deal_field_changes')
        .insert(rows as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['deal-field-changes', vars.dealId] });
    },
  });
}

/** Utility: compute changed fields between old and new objects */
export function diffDealFields(
  oldDeal: Record<string, any>,
  newFields: Record<string, any>,
  trackedFields: string[]
): { field_name: string; old_value: string | null; new_value: string | null }[] {
  const changes: { field_name: string; old_value: string | null; new_value: string | null }[] = [];
  for (const field of trackedFields) {
    if (!(field in newFields)) continue;
    const oldVal = oldDeal[field];
    const newVal = newFields[field];
    const oldStr = oldVal == null ? null : JSON.stringify(oldVal);
    const newStr = newVal == null ? null : JSON.stringify(newVal);
    if (oldStr !== newStr) {
      changes.push({ field_name: field, old_value: oldStr, new_value: newStr });
    }
  }
  return changes;
}

export const TRACKED_DEAL_FIELDS = [
  'stage', 'deal_type', 'deal_status', 'client_name', 'client_phone', 'client_email',
  'client_source', 'budget_min', 'budget_max', 'currency', 'deal_value',
  'commission_percent', 'commission_amount', 'agent_id', 'property_id', 'property_project_id',
  'preferred_types', 'preferred_districts', 'bedrooms_min', 'next_action',
  'next_action_date', 'notes', 'lost_reason', 'won_reason',
];
