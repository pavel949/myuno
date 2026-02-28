/**
 * @module useCrmAssignmentRules
 * CRUD hooks for crm_assignment_rules (Round Robin)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmAssignmentRule {
  id: string;
  company_id: string;
  pipeline_id: string | null;
  name: string;
  rule_type: string;
  assignees: string[];
  last_assigned_index: number;
  is_active: boolean;
  created_at: string;
}

const from = (table: string) => (supabase as any).from(table);

export function useCrmAssignmentRules(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-assignment-rules', companyId],
    queryFn: async (): Promise<CrmAssignmentRule[]> => {
      const { data, error } = await from('crm_assignment_rules')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CrmAssignmentRule[];
    },
    enabled: !!companyId,
  });
}

export function useCreateAssignmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Omit<CrmAssignmentRule, 'id' | 'created_at' | 'last_assigned_index'>) => {
      const { data, error } = await from('crm_assignment_rules').insert(rule).select().single();
      if (error) throw error;
      return data as CrmAssignmentRule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-assignment-rules'] }),
  });
}

export function useUpdateAssignmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmAssignmentRule> & { id: string }) => {
      const { error } = await from('crm_assignment_rules').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-assignment-rules'] }),
  });
}

export function useDeleteAssignmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from('crm_assignment_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-assignment-rules'] }),
  });
}
