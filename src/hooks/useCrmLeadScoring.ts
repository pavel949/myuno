/**
 * @module useCrmLeadScoring
 * Hooks for lead scoring rules and score display
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';

export interface CrmScoringRule {
  id: string;
  company_id: string;
  rule_name: string;
  condition_type: string;
  condition_config: Record<string, unknown>;
  points: number;
  is_active: boolean;
  sort_order: number;
}

export interface CrmScoreLogEntry {
  id: string;
  contact_id: string;
  rule_id: string | null;
  points: number;
  reason: string;
  scored_at: string;
}

export function useCrmScoringRules(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-scoring-rules', companyId],
    queryFn: async (): Promise<CrmScoringRule[]> => {
      const { data, error } = await typedFrom('crm_scoring_rules')
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as CrmScoringRule[];
    },
    enabled: !!companyId,
  });
}

export function useCrmScoreLog(contactId: string | undefined) {
  return useQuery({
    queryKey: ['crm-score-log', contactId],
    queryFn: async (): Promise<CrmScoreLogEntry[]> => {
      const { data, error } = await typedFrom('crm_score_log')
        .select('*')
        .eq('contact_id', contactId!)
        .order('scored_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as CrmScoreLogEntry[];
    },
    enabled: !!contactId,
  });
}

export function useCreateScoringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Omit<CrmScoringRule, 'id'>) => {
      const { data, error } = await typedFrom('crm_scoring_rules').insert(rule).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-scoring-rules'] });
    },
  });
}

export function useUpdateScoringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmScoringRule> & { id: string }) => {
      const { error } = await typedFrom('crm_scoring_rules').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-scoring-rules'] });
    },
  });
}

export function useDeleteScoringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await typedFrom('crm_scoring_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-scoring-rules'] });
    },
  });
}

export function getLeadTemperature(score: number): 'cold' | 'warm' | 'hot' {
  if (score >= 61) return 'hot';
  if (score >= 31) return 'warm';
  return 'cold';
}

export function getTemperatureColor(temp: string) {
  switch (temp) {
    case 'hot': return { text: 'text-destructive', bg: 'bg-destructive/10', icon: '🔴' };
    case 'warm': return { text: 'text-warning', bg: 'bg-warning/10', icon: '🟡' };
    default: return { text: 'text-info', bg: 'bg-info/10', icon: '🔵' };
  }
}
