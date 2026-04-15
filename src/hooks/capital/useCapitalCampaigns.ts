import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';
import { useAuth } from '@/contexts/AuthContext';
import type { CapitalCampaign, CapitalCampaignInsert, CapitalCampaignUpdate } from '@/types/capital';

export function useCapitalCampaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: ['capital-campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capital_campaigns')
        .select('*, capital_projects(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (CapitalCampaign & { capital_projects: { name: string } | null })[];
    },
    enabled: !!user?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<CapitalCampaignInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('capital_campaigns')
        .insert({ ...campaign, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CapitalCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-campaigns'] });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: CapitalCampaignUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('capital_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CapitalCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-campaigns'] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('capital_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-campaigns'] });
    },
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
