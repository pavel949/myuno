/**
 * useDueDiligence — read & generate ClearView™ DD reports for an off-plan project.
 * - Fetches the latest published report (or latest report for admins/devs).
 * - generateReport mutation calls the `generate-due-diligence` edge function.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClearViewCriterion {
  maturity_level: number;
  score: number;
  findings: string[];
  evidence_gaps: string[];
}

export interface ClearViewModifier {
  type: string;
  delta: number;
  reason: string;
}

export interface DueDiligenceReport {
  id: string;
  project_id: string;
  version: number;
  total_score: number | null;
  grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | null;
  risk_level: string | null;
  score_legal: number | null;
  score_developer: number | null;
  score_construction: number | null;
  score_location: number | null;
  score_financial: number | null;
  score_returns: number | null;
  score_marketing: number | null;
  score_liquidity: number | null;
  modifiers: ClearViewModifier[];
  analysis: Record<string, ClearViewCriterion>;
  red_flags: string[];
  green_flags: string[];
  recommendations: string[];
  executive_summary: string | null;
  is_brokered_project: boolean;
  is_published: boolean;
  ai_model: string | null;
  generated_at: string;
}

export function useDueDiligenceReport(projectId?: string) {
  return useQuery({
    queryKey: ['dd-report', projectId],
    queryFn: async (): Promise<DueDiligenceReport | null> => {
      if (!projectId) return null;
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('due_diligence_reports' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as DueDiligenceReport) ?? null;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateDueDiligence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { projectId: string; isBrokeredProject?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('generate-due-diligence', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.report as DueDiligenceReport;
    },
    onSuccess: (rep) => {
      toast.success(`ClearView отчёт создан · ${rep?.grade ?? '—'} (${rep?.total_score ?? 0}/100)`);
      qc.invalidateQueries({ queryKey: ['dd-report', rep?.project_id] });
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Не удалось сгенерировать отчёт');
    },
  });
}

export function useTogglePublishDueDiligence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; projectId: string; publish: boolean }) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('due_diligence_reports' as any)
        .update({ is_published: params.publish })
        .eq('id', params.id);
      if (error) throw error;
      return params;
    },
    onSuccess: (p) => {
      toast.success(p.publish ? 'Отчёт опубликован' : 'Отчёт скрыт');
      qc.invalidateQueries({ queryKey: ['dd-report', p.projectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
