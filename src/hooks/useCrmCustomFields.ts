/**
 * @module useCrmCustomFields
 * CRUD hooks for crm_custom_fields and crm_custom_field_values
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmCustomField {
  id: string;
  company_id: string;
  entity_type: string;
  field_key: string;
  label_en: string;
  label_ru: string;
  field_type: string;
  options: any[] | null;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  created_at: string;
}

export interface CrmCustomFieldValue {
  id: string;
  field_id: string;
  entity_id: string;
  value: any;
  updated_at: string;
}

const from = (table: string) => (supabase as any).from(table);

export function useCrmCustomFields(companyId: string | undefined, entityType?: string) {
  return useQuery({
    queryKey: ['crm-custom-fields', companyId, entityType],
    queryFn: async (): Promise<CrmCustomField[]> => {
      let q = from('crm_custom_fields')
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order');
      if (entityType) q = q.eq('entity_type', entityType);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CrmCustomField[];
    },
    enabled: !!companyId,
  });
}

export function useCrmCustomFieldValues(entityId: string | undefined, fieldIds?: string[]) {
  return useQuery({
    queryKey: ['crm-custom-field-values', entityId, fieldIds],
    queryFn: async (): Promise<Record<string, any>> => {
      let q = from('crm_custom_field_values')
        .select('*')
        .eq('entity_id', entityId!);
      if (fieldIds?.length) q = q.in('field_id', fieldIds);
      const { data, error } = await q;
      if (error) throw error;
      const map: Record<string, any> = {};
      for (const v of (data || []) as CrmCustomFieldValue[]) {
        map[v.field_id] = v.value;
      }
      return map;
    },
    enabled: !!entityId,
  });
}

export function useCreateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (field: Omit<CrmCustomField, 'id' | 'created_at'>) => {
      const { data, error } = await from('crm_custom_fields').insert(field).select().single();
      if (error) throw error;
      return data as CrmCustomField;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-custom-fields'] });
    },
  });
}

export function useUpdateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmCustomField> & { id: string }) => {
      const { error } = await from('crm_custom_fields').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-custom-fields'] });
    },
  });
}

export function useDeleteCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from('crm_custom_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-custom-fields'] });
    },
  });
}

export function useUpsertCustomFieldValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ field_id, entity_id, value }: { field_id: string; entity_id: string; value: any }) => {
      const { error } = await from('crm_custom_field_values')
        .upsert({ field_id, entity_id, value, updated_at: new Date().toISOString() }, { onConflict: 'field_id,entity_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-custom-field-values', vars.entity_id] });
    },
  });
}
