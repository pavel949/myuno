/**
 * Hook for custom pipeline stages per company
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  id: string;
  company_id: string;
  deal_type: string;
  stage_key: string;
  name_en: string;
  name_ru: string;
  short_label: string;
  color: string;
  probability: number;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
}

/** Default stages seeded when company has none */
export const DEFAULT_STAGES: Omit<PipelineStage, 'id' | 'company_id'>[] = [
  { deal_type: 'sale', stage_key: 'new', name_en: 'New', name_ru: 'Новый', short_label: 'New', color: '#3b82f6', probability: 0.10, sort_order: 1, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'contacted', name_en: 'Contacted', name_ru: 'Контакт', short_label: 'Call', color: '#06b6d4', probability: 0.20, sort_order: 2, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'showing', name_en: 'Showing', name_ru: 'Показ', short_label: 'Show', color: '#f59e0b', probability: 0.40, sort_order: 3, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'negotiation', name_en: 'Negotiation', name_ru: 'Торг', short_label: 'Nego', color: '#f97316', probability: 0.60, sort_order: 4, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'contract', name_en: 'Contract', name_ru: 'Договор', short_label: 'Deal', color: '#8b5cf6', probability: 0.80, sort_order: 5, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'closed_won', name_en: 'Won', name_ru: 'Успех', short_label: 'Won', color: '#22c55e', probability: 1.0, sort_order: 98, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'closed_lost', name_en: 'Lost', name_ru: 'Проигрыш', short_label: 'Lost', color: '#ef4444', probability: 0, sort_order: 99, is_system: true, is_active: true },
];

export function usePipelineStages(companyId: string | undefined, dealType?: string) {
  return useQuery({
    queryKey: ['pipeline-stages', companyId, dealType],
    queryFn: async (): Promise<PipelineStage[]> => {
      let query = supabase
        .from('deal_pipeline_stages')
        .select('*')
        .eq('company_id', companyId!)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (dealType) {
        query = query.eq('deal_type', dealType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If no custom stages, seed defaults
      if (!data || data.length === 0) {
        const inserts = DEFAULT_STAGES.map(s => ({ ...s, company_id: companyId! }));
        const { data: seeded, error: seedErr } = await supabase
          .from('deal_pipeline_stages')
          .insert(inserts as any)
          .select();
        if (seedErr) throw seedErr;
        return (seeded || []) as unknown as PipelineStage[];
      }

      return data as unknown as PipelineStage[];
    },
    enabled: !!companyId,
  });
}

export function useAllPipelineStages(companyId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline-stages-all', companyId],
    queryFn: async (): Promise<PipelineStage[]> => {
      const { data, error } = await supabase
        .from('deal_pipeline_stages')
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as PipelineStage[];
    },
    enabled: !!companyId,
  });
}

export function useCreatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stage: Omit<PipelineStage, 'id'>) => {
      const { data, error } = await supabase
        .from('deal_pipeline_stages')
        .insert(stage as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      qc.invalidateQueries({ queryKey: ['pipeline-stages-all'] });
    },
  });
}

export function useUpdatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PipelineStage> & { id: string }) => {
      const { data, error } = await supabase
        .from('deal_pipeline_stages')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      qc.invalidateQueries({ queryKey: ['pipeline-stages-all'] });
    },
  });
}

export function useDeletePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deal_pipeline_stages')
        .update({ is_active: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      qc.invalidateQueries({ queryKey: ['pipeline-stages-all'] });
    },
  });
}
