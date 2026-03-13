/**
 * @module useCrmTemplates
 * CRUD hooks for crm_comm_templates
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';

export interface CrmCommTemplate {
  id: string;
  company_id: string;
  channel: string;
  name: string;
  subject: string | null;
  body: string;
  merge_tags: string[] | null;
  language: string;
  created_by: string;
  created_at: string;
}

export const CHANNELS = [
  { value: 'email', labelEn: 'Email', labelRu: 'Email' },
  { value: 'whatsapp', labelEn: 'WhatsApp', labelRu: 'WhatsApp' },
  { value: 'sms', labelEn: 'SMS', labelRu: 'SMS' },
  { value: 'telegram', labelEn: 'Telegram', labelRu: 'Telegram' },
] as const;

export const MERGE_TAGS = [
  '{{contact_name}}', '{{contact_email}}', '{{contact_phone}}',
  '{{deal_value}}', '{{property_name}}', '{{agent_name}}',
  '{{company_name}}', '{{date}}',
] as const;

export function useCrmTemplates(companyId: string | undefined, channel?: string) {
  return useQuery({
    queryKey: ['crm-templates', companyId, channel],
    queryFn: async (): Promise<CrmCommTemplate[]> => {
      let q = typedFrom('crm_comm_templates')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (channel) q = q.eq('channel', channel);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CrmCommTemplate[];
    },
    enabled: !!companyId,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tpl: Omit<CrmCommTemplate, 'id' | 'created_at'>) => {
      const { data, error } = await typedFrom('crm_comm_templates').insert(tpl).select().single();
      if (error) throw error;
      return data as CrmCommTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmCommTemplate> & { id: string }) => {
      const { error } = await typedFrom('crm_comm_templates').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await typedFrom('crm_comm_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-templates'] }),
  });
}
