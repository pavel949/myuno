/**
 * ClearView review data — queue + single report for the HQ editor (Round 4A · H1).
 * Backed by `due_diligence_reports` (admin RLS: "Admins manage DD reports").
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { untypedRpc } from '@/lib/untypedTables';
import type { Json } from '@/integrations/supabase/types';
import type { ReportPatch, ReviewModifier } from '@/lib/clearview/reviewModel';

export interface ClearViewQueueRow {
  id: string;
  project_id: string;
  project_name: string;
  version: number;
  total_score: number | null;
  grade: string | null;
  is_published: boolean;
  generated_at: string | null;
  updated_at: string | null;
  reviewed_at: string | null;
}

export interface ClearViewReviewReport {
  id: string;
  project_id: string;
  project_name: string;
  version: number;
  total_score: number | null;
  grade: string | null;
  is_published: boolean;
  generated_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  generated_at: string | null;
  updated_at: string | null;
  analysis: Record<string, unknown>;
  modifiers: ReviewModifier[];
  scores: Record<string, number | null>;
}

const SCORE_FIELDS = [
  'score_legal', 'score_developer', 'score_construction', 'score_location',
  'score_financial', 'score_returns', 'score_marketing', 'score_liquidity',
] as const;

function parseModifiers(raw: Json | null): ReviewModifier[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((m) => {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return [];
    const r = m as Record<string, Json | undefined>;
    return [{ type: String(r.type ?? 'override'), delta: Number(r.delta ?? 0) || 0, reason: String(r.reason ?? '') }];
  });
}

function projectName(p: unknown): string {
  if (p && typeof p === 'object' && 'name_en' in p) return String((p as { name_en: string }).name_en);
  return '—';
}

export const clearViewQueueKey = ['hq-clearview-queue'] as const;
export const clearViewReviewKey = (id: string) => ['hq-clearview-review', id] as const;

export function useClearViewQueue() {
  return useQuery({
    queryKey: clearViewQueueKey,
    queryFn: async (): Promise<ClearViewQueueRow[]> => {
      const { data, error } = await supabase
        .from('due_diligence_reports')
        .select('id, project_id, version, total_score, grade, is_published, generated_at, updated_at, reviewed_at, property_projects(name_en)')
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      // Keep only the latest version per project.
      const latest = new Map<string, ClearViewQueueRow>();
      for (const r of data ?? []) {
        const row: ClearViewQueueRow = {
          id: r.id, project_id: r.project_id, project_name: projectName(r.property_projects),
          version: r.version, total_score: r.total_score, grade: r.grade, is_published: Boolean(r.is_published),
          generated_at: r.generated_at, updated_at: r.updated_at, reviewed_at: r.reviewed_at,
        };
        const prev = latest.get(r.project_id);
        if (!prev || row.version > prev.version) latest.set(r.project_id, row);
      }
      return [...latest.values()];
    },
  });
}

export function useClearViewReview(reportId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: clearViewReviewKey(reportId ?? ''),
    enabled: Boolean(reportId),
    queryFn: async (): Promise<ClearViewReviewReport | null> => {
      const { data, error } = await supabase
        .from('due_diligence_reports')
        .select('*, property_projects(name_en)')
        .eq('id', reportId as string)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const analysis = data.analysis && typeof data.analysis === 'object' && !Array.isArray(data.analysis)
        ? (data.analysis as Record<string, unknown>) : {};
      const scores: Record<string, number | null> = {};
      for (const f of SCORE_FIELDS) scores[f] = data[f];
      return {
        id: data.id, project_id: data.project_id, project_name: projectName(data.property_projects),
        version: data.version, total_score: data.total_score, grade: data.grade, is_published: Boolean(data.is_published),
        generated_by: data.generated_by, reviewed_by: data.reviewed_by, reviewed_at: data.reviewed_at,
        generated_at: data.generated_at, updated_at: data.updated_at, analysis, modifiers: parseModifiers(data.modifiers), scores,
      };
    },
  });

  const save = useMutation({
    mutationFn: async (patch: ReportPatch) => {
      if (!reportId) throw new Error('Missing report id');
      const { error } = await supabase
        .from('due_diligence_reports')
        .update({ ...patch, analysis: patch.analysis as Json, modifiers: patch.modifiers as unknown as Json, updated_at: new Date().toISOString() })
        .eq('id', reportId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clearViewReviewKey(reportId ?? '') });
      qc.invalidateQueries({ queryKey: clearViewQueueKey });
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error('Missing report id');
      const { data, error } = await untypedRpc('hq_publish_clearview_report', { _report_id: reportId });
      if (error) throw new Error(error.message);
      const r = data as { success?: boolean; error?: string } | null;
      if (!r?.success) throw new Error(r?.error ?? 'Publish failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clearViewReviewKey(reportId ?? '') });
      qc.invalidateQueries({ queryKey: clearViewQueueKey });
    },
  });

  return { ...query, save, publish };
}
