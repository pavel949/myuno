/**
 * @module useCrmWebForms
 * CRUD hooks for crm_web_forms
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';

export interface CrmWebForm {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  fields_config: Record<string, unknown>[];
  pipeline_id: string | null;
  default_stage_id: string | null;
  assign_rule_id: string | null;
  is_active: boolean;
  submit_count: number;
  created_by: string;
  created_at: string;
}

export function useCrmWebForms(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-web-forms', companyId],
    queryFn: async (): Promise<CrmWebForm[]> => {
      const { data, error } = await typedFrom('crm_web_forms')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CrmWebForm[];
    },
    enabled: !!companyId,
  });
}

export function useCreateWebForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: Omit<CrmWebForm, 'id' | 'created_at' | 'submit_count'>) => {
      const { data, error } = await typedFrom('crm_web_forms').insert(form).select().single();
      if (error) throw error;
      return data as CrmWebForm;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-web-forms'] }),
  });
}

export function useUpdateWebForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmWebForm> & { id: string }) => {
      const { error } = await typedFrom('crm_web_forms').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-web-forms'] }),
  });
}

export function useDeleteWebForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await typedFrom('crm_web_forms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-web-forms'] }),
  });
}
