import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';

export interface ChecklistTemplate {
  id: string;
  company_id: string;
  name: string;
  checklist_type: string;
  items: ChecklistItem[];
  is_default: boolean;
  created_at: string;
}

export interface ChecklistItem {
  label: string;
  label_ru?: string;
  required_photo?: boolean;
}

export interface ChecklistCompletion {
  id: string;
  template_id: string | null;
  property_id: string;
  booking_id: string | null;
  task_id: string | null;
  completed_by: string | null;
  items: CompletedItem[];
  photos: string[];
  notes: string | null;
  completed_at: string;
}

export interface CompletedItem {
  label: string;
  checked: boolean;
  photo_url?: string;
  note?: string;
}

export function useChecklistTemplates() {
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  return useQuery({
    queryKey: ['checklist-templates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('property_checklist_templates' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ChecklistTemplate[];
    },
    enabled: !!companyId,
  });
}

export function useCreateChecklistTemplate() {
  const qc = useQueryClient();
  const { data: company } = useMyCompanyId();

  return useMutation({
    mutationFn: async (input: { name: string; checklist_type: string; items: ChecklistItem[] }) => {
      const companyId = company?.company_id;
      if (!companyId) throw new Error('No company');
      const { error } = await supabase
        .from('property_checklist_templates' as any)
        .insert({ ...input, company_id: companyId, items: input.items as any });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });
}

export function useChecklistCompletions(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['checklist-completions', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('checklist_completions' as any)
        .select('*')
        .eq('property_id', propertyId)
        .order('completed_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as ChecklistCompletion[];
    },
    enabled: !!propertyId,
  });
}

export function useSubmitChecklist() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      template_id?: string;
      property_id: string;
      booking_id?: string;
      task_id?: string;
      items: CompletedItem[];
      photos?: string[];
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('checklist_completions' as any)
        .insert({
          ...input,
          completed_by: user?.id,
          items: input.items as any,
          photos: input.photos || [],
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['checklist-completions', vars.property_id] });
    },
  });
}
