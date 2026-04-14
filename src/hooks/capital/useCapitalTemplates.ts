import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CapitalMessageTemplate, CapitalMessageTemplateInsert, CapitalMessageTemplateUpdate } from '@/types/capital';

export function useCapitalTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['capital-templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capital_message_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CapitalMessageTemplate[];
    },
    enabled: !!user?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<CapitalMessageTemplateInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('capital_message_templates')
        .insert({ ...template, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CapitalMessageTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-templates'] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: CapitalMessageTemplateUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('capital_message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CapitalMessageTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('capital_message_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-templates'] });
    },
  });

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
