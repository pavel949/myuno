import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContactTag {
  id: string;
  company_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
}

const QUERY_KEY = 'contact-tags';

export function useContactTags(companyId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, companyId],
    queryFn: async (): Promise<ContactTag[]> => {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ContactTag[];
    },
    enabled: !!companyId,
  });
}

export function useCreateContactTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tag: { company_id: string; name: string; color: string }) => {
      const { data, error } = await supabase
        .from('contact_tags')
        .insert(tag as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateContactTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; sort_order?: number }) => {
      const { error } = await supabase
        .from('contact_tags')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteContactTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

// Predefined palette for tag colors (Odoo-style)
export const TAG_COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78716c',
];
