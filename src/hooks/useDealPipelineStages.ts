/**
 * Hook for custom pipeline stages per company (per deal_type).
 * Stages use stable stage_key values aligned with DEAL_STAGES in useAgentDeals.
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

const DEAL_TYPES_PIPELINE = ['sale', 'rent', 'investment', 'management'] as const;

/** Full seed: all deal types × standard stage_key funnel (compatible with agent_deals.stage). */
export const FULL_DEFAULT_STAGES: Omit<PipelineStage, 'id' | 'company_id'>[] = [
  // —— Sale (resale / secondary) ——
  { deal_type: 'sale', stage_key: 'new', name_en: 'New', name_ru: 'Новый', short_label: 'New', color: '#3b82f6', probability: 0.1, sort_order: 1, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'contacted', name_en: 'Contacted', name_ru: 'Контакт', short_label: 'Call', color: '#06b6d4', probability: 0.2, sort_order: 2, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'showing', name_en: 'Showing', name_ru: 'Показ', short_label: 'Show', color: '#f59e0b', probability: 0.4, sort_order: 3, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'negotiation', name_en: 'Negotiation', name_ru: 'Торг', short_label: 'Nego', color: '#f97316', probability: 0.6, sort_order: 4, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'contract', name_en: 'Contract', name_ru: 'Договор', short_label: 'Deal', color: '#8b5cf6', probability: 0.8, sort_order: 5, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'closed_won', name_en: 'Won', name_ru: 'Успех', short_label: 'Won', color: '#22c55e', probability: 1.0, sort_order: 98, is_system: true, is_active: true },
  { deal_type: 'sale', stage_key: 'closed_lost', name_en: 'Lost', name_ru: 'Проигрыш', short_label: 'Lost', color: '#ef4444', probability: 0, sort_order: 99, is_system: true, is_active: true },
  // —— Rent (long-term) —— same keys; labels reflect qualification + lease ——
  { deal_type: 'rent', stage_key: 'new', name_en: 'New inquiry', name_ru: 'Новая заявка', short_label: 'New', color: '#3b82f6', probability: 0.12, sort_order: 1, is_system: true, is_active: true },
  { deal_type: 'rent', stage_key: 'contacted', name_en: 'Qualification / KYC', name_ru: 'Квалификация / KYC', short_label: 'KYC', color: '#06b6d4', probability: 0.25, sort_order: 2, is_system: true, is_active: true },
  { deal_type: 'rent', stage_key: 'showing', name_en: 'Viewings', name_ru: 'Показы', short_label: 'Show', color: '#f59e0b', probability: 0.45, sort_order: 3, is_system: true, is_active: true },
  { deal_type: 'rent', stage_key: 'negotiation', name_en: 'Deposit & terms', name_ru: 'Бронь и условия', short_label: 'Dep', color: '#f97316', probability: 0.65, sort_order: 4, is_system: true, is_active: true },
  { deal_type: 'rent', stage_key: 'contract', name_en: 'Lease agreement', name_ru: 'Договор аренды', short_label: 'Lease', color: '#8b5cf6', probability: 0.85, sort_order: 5, is_system: true, is_active: true },
  { deal_type: 'rent', stage_key: 'closed_won', name_en: 'Won', name_ru: 'Успех', short_label: 'Won', color: '#22c55e', probability: 1.0, sort_order: 98, is_system: true, is_active: true },
  { deal_type: 'rent', stage_key: 'closed_lost', name_en: 'Lost', name_ru: 'Проигрыш', short_label: 'Lost', color: '#ef4444', probability: 0, sort_order: 99, is_system: true, is_active: true },
  // —— Investment / off-plan ——
  { deal_type: 'investment', stage_key: 'new', name_en: 'New', name_ru: 'Новый запрос', short_label: 'New', color: '#3b82f6', probability: 0.1, sort_order: 1, is_system: true, is_active: true },
  { deal_type: 'investment', stage_key: 'contacted', name_en: 'Discovery', name_ru: 'Выявление задачи', short_label: 'Disc', color: '#06b6d4', probability: 0.22, sort_order: 2, is_system: true, is_active: true },
  { deal_type: 'investment', stage_key: 'showing', name_en: 'Project comparison', name_ru: 'Сравнение проектов', short_label: 'Cmp', color: '#f59e0b', probability: 0.4, sort_order: 3, is_system: true, is_active: true },
  { deal_type: 'investment', stage_key: 'negotiation', name_en: 'Reservation / booking', name_ru: 'Бронь / букинг', short_label: 'Res', color: '#f97316', probability: 0.58, sort_order: 4, is_system: true, is_active: true },
  { deal_type: 'investment', stage_key: 'contract', name_en: 'SPA / installments', name_ru: 'SPA / рассрочка', short_label: 'SPA', color: '#8b5cf6', probability: 0.78, sort_order: 5, is_system: true, is_active: true },
  { deal_type: 'investment', stage_key: 'closed_won', name_en: 'Won', name_ru: 'Успех', short_label: 'Won', color: '#22c55e', probability: 1.0, sort_order: 98, is_system: true, is_active: true },
  { deal_type: 'investment', stage_key: 'closed_lost', name_en: 'Lost', name_ru: 'Проигрыш', short_label: 'Lost', color: '#ef4444', probability: 0, sort_order: 99, is_system: true, is_active: true },
  // —— Management / PM subscription ——
  { deal_type: 'management', stage_key: 'new', name_en: 'Inbound', name_ru: 'Обращение', short_label: 'New', color: '#3b82f6', probability: 0.15, sort_order: 1, is_system: true, is_active: true },
  { deal_type: 'management', stage_key: 'contacted', name_en: 'Discovery', name_ru: 'Аудит объекта', short_label: 'Aud', color: '#06b6d4', probability: 0.3, sort_order: 2, is_system: true, is_active: true },
  { deal_type: 'management', stage_key: 'showing', name_en: 'Onboarding', name_ru: 'Онбординг УК', short_label: 'Onb', color: '#f59e0b', probability: 0.5, sort_order: 3, is_system: true, is_active: true },
  { deal_type: 'management', stage_key: 'negotiation', name_en: 'Active management', name_ru: 'Активное ведение', short_label: 'Act', color: '#f97316', probability: 0.7, sort_order: 4, is_system: true, is_active: true },
  { deal_type: 'management', stage_key: 'contract', name_en: 'Renewal / upsell', name_ru: 'Продление / upsell', short_label: 'Ren', color: '#8b5cf6', probability: 0.88, sort_order: 5, is_system: true, is_active: true },
  { deal_type: 'management', stage_key: 'closed_won', name_en: 'Won', name_ru: 'Успех', short_label: 'Won', color: '#22c55e', probability: 1.0, sort_order: 98, is_system: true, is_active: true },
  { deal_type: 'management', stage_key: 'closed_lost', name_en: 'Lost', name_ru: 'Проигрыш', short_label: 'Lost', color: '#ef4444', probability: 0, sort_order: 99, is_system: true, is_active: true },
];

/** @deprecated Use getDefaultStagesForDealType — kept for imports expecting sale-only list */
export const DEFAULT_STAGES = FULL_DEFAULT_STAGES.filter((s) => s.deal_type === 'sale');

export function getDefaultStagesForDealType(dealType: string): Omit<PipelineStage, 'id' | 'company_id'>[] {
  return FULL_DEFAULT_STAGES.filter((s) => s.deal_type === dealType);
}

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

      const rows = (data || []) as PipelineStage[];

      if (dealType && rows.length === 0) {
        const slice = getDefaultStagesForDealType(dealType);
        if (slice.length === 0) return [];
        const inserts = slice.map((s) => ({ ...s, company_id: companyId! }));
        const { data: seeded, error: seedErr } = await supabase
          .from('deal_pipeline_stages')
          .insert(inserts)
          .select();
        if (seedErr) throw seedErr;
        return (seeded || []) as unknown as PipelineStage[];
      }

      return rows;
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

      let rows = (data || []) as PipelineStage[];

      if (rows.length === 0) {
        const inserts = FULL_DEFAULT_STAGES.map((s) => ({ ...s, company_id: companyId! }));
        const { data: seeded, error: seedErr } = await supabase
          .from('deal_pipeline_stages')
          .insert(inserts)
          .select();
        if (seedErr) throw seedErr;
        return (seeded || []) as unknown as PipelineStage[];
      }

      const present = new Set(rows.map((r) => r.deal_type));
      const missing = DEAL_TYPES_PIPELINE.filter((dt) => !present.has(dt));
      if (missing.length > 0) {
        const toInsert = FULL_DEFAULT_STAGES.filter((s) => missing.includes(s.deal_type as (typeof DEAL_TYPES_PIPELINE)[number])).map((s) => ({
          ...s,
          company_id: companyId!,
        }));
        const { error: insErr } = await supabase.from('deal_pipeline_stages').insert(toInsert);
        if (insErr) throw insErr;
        const { data: again, error: e2 } = await supabase
          .from('deal_pipeline_stages')
          .select('*')
          .eq('company_id', companyId!)
          .order('sort_order', { ascending: true });
        if (e2) throw e2;
        rows = (again || []) as PipelineStage[];
      }

      return rows;
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
        .insert(stage)
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
        .update(updates)
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
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      qc.invalidateQueries({ queryKey: ['pipeline-stages-all'] });
    },
  });
}
