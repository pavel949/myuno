import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CapitalPipelineDeal, CapitalPipelineDealInsert, CapitalPipelineDealUpdate, PipelineStage } from '@/types/capital';

export function useCapitalPipeline(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const pipelineQuery = useQuery({
    queryKey: ['capital-pipeline', user?.id, contactId],
    queryFn: async () => {
      let query = supabase
        .from('capital_pipeline')
        .select('*, capital_contacts(name, phone, warmth), capital_projects(name, commission_pct)')
        .order('stage_changed_at', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createDeal = useMutation({
    mutationFn: async (deal: Omit<CapitalPipelineDealInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('capital_pipeline')
        .insert({ ...deal, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CapitalPipelineDeal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-pipeline'] });
    },
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: CapitalPipelineDealUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('capital_pipeline')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CapitalPipelineDeal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-pipeline'] });
    },
  });

  const moveStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: PipelineStage }) => {
      const { data, error } = await supabase
        .from('capital_pipeline')
        .update({ stage, stage_changed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CapitalPipelineDeal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-pipeline'] });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('capital_pipeline')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-pipeline'] });
    },
  });

  return {
    deals: pipelineQuery.data ?? [],
    isLoading: pipelineQuery.isLoading,
    error: pipelineQuery.error,
    createDeal,
    updateDeal,
    moveStage,
    deleteDeal,
  };
}
