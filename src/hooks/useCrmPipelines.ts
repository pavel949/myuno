/**
 * @module useCrmPipelines
 * CRUD hooks for crm_pipelines and crm_pipeline_stages
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmPipeline {
  id: string;
  company_id: string;
  name_en: string;
  name_ru: string;
  pipeline_type: string;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CrmPipelineStage {
  id: string;
  pipeline_id: string;
  name_en: string;
  name_ru: string;
  probability: number;
  color: string | null;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface PipelineWithStages extends CrmPipeline {
  stages: CrmPipelineStage[];
}

const from = (table: string) => (supabase as any).from(table);

export function useCrmPipelines(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-pipelines', companyId],
    queryFn: async (): Promise<PipelineWithStages[]> => {
      const { data: pipelines, error: pErr } = await from('crm_pipelines')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_active', true)
        .order('sort_order');
      if (pErr) throw pErr;

      const pipelineIds = (pipelines || []).map((p: { id: string }) => p.id);
      if (pipelineIds.length === 0) return [];

      const { data: stages, error: sErr } = await from('crm_pipeline_stages')
        .select('*')
        .in('pipeline_id', pipelineIds)
        .order('sort_order');
      if (sErr) throw sErr;

      const stageMap = new Map<string, CrmPipelineStage[]>();
      for (const s of (stages || []) as CrmPipelineStage[]) {
        const arr = stageMap.get(s.pipeline_id) || [];
        arr.push(s);
        stageMap.set(s.pipeline_id, arr);
      }

      return (pipelines as CrmPipeline[]).map(p => ({
        ...p,
        stages: stageMap.get(p.id) || [],
      }));
    },
    enabled: !!companyId,
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pipeline: { company_id: string; name_en: string; name_ru: string; pipeline_type?: string; is_default?: boolean }) => {
      const { data, error } = await from('crm_pipelines').insert(pipeline).select().single();
      if (error) throw error;
      return data as CrmPipeline;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-pipelines'] });
    },
  });
}

export function useUpdatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmPipeline> & { id: string }) => {
      const { error } = await from('crm_pipelines').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-pipelines'] });
    },
  });
}

export function useCreatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stage: Omit<CrmPipelineStage, 'id'>) => {
      const { data, error } = await from('crm_pipeline_stages').insert(stage).select().single();
      if (error) throw error;
      return data as CrmPipelineStage;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-pipelines'] });
    },
  });
}

export function useUpdatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmPipelineStage> & { id: string }) => {
      const { error } = await from('crm_pipeline_stages').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-pipelines'] });
    },
  });
}

export function useDeletePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from('crm_pipeline_stages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-pipelines'] });
    },
  });
}

/** Ensure a company has a default pipeline; create one if missing */
export function useEnsureDefaultPipeline(companyId: string | undefined) {
  const createPipeline = useCreatePipeline();
  const createStage = useCreatePipelineStage();

  const ensureDefault = async () => {
    if (!companyId) return null;
    const { data } = await from('crm_pipelines')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();
    if (data) return data.id as string;

    // Create default Sales pipeline
    const pipeline = await createPipeline.mutateAsync({
      company_id: companyId,
      name_en: 'Sales',
      name_ru: 'Продажи',
      pipeline_type: 'sale',
      is_default: true,
    });

    const defaultStages = [
      { name_en: 'New', name_ru: 'Новый', probability: 10, color: 'primary', sort_order: 0, is_won: false, is_lost: false },
      { name_en: 'Contacted', name_ru: 'Контакт', probability: 20, color: 'info', sort_order: 1, is_won: false, is_lost: false },
      { name_en: 'Showing', name_ru: 'Показ', probability: 40, color: 'warning', sort_order: 2, is_won: false, is_lost: false },
      { name_en: 'Negotiation', name_ru: 'Торг', probability: 60, color: 'warning', sort_order: 3, is_won: false, is_lost: false },
      { name_en: 'Contract', name_ru: 'Договор', probability: 80, color: 'accent', sort_order: 4, is_won: false, is_lost: false },
      { name_en: 'Won', name_ru: 'Успех', probability: 100, color: 'success', sort_order: 5, is_won: true, is_lost: false },
      { name_en: 'Lost', name_ru: 'Проигрыш', probability: 0, color: 'destructive', sort_order: 6, is_won: false, is_lost: true },
    ];

    for (const stage of defaultStages) {
      await createStage.mutateAsync({ ...stage, pipeline_id: pipeline.id });
    }

    return pipeline.id;
  };

  return { ensureDefault };
}
