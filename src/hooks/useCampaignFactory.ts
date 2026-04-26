import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { 
  Campaign, 
  CampaignFormData, 
  CampaignStatus, 
  CampaignGoal,
  CampaignBudget,
  CampaignSchedule,
  CampaignKPI,
  CampaignPerformance,
  CampaignChannel,
  TargetSegment
} from '@/types/marketing';

type CampaignRow = Database['public']['Tables']['mcc_campaigns']['Row'];

// Transform database row to Campaign type
const transformCampaign = (row: CampaignRow): Campaign => ({
  id: row.id,
  name: row.name,
  description: row.description,
  goal: row.goal as CampaignGoal,
  target_segment: row.target_segment as TargetSegment | null,
  channels: (row.channels || []) as CampaignChannel[],
  budget: row.budget as unknown as CampaignBudget | null,
  schedule: row.schedule as unknown as CampaignSchedule | null,
  kpi_targets: row.kpi_targets as unknown as CampaignKPI | null,
  ab_variants: (Array.isArray(row.ab_variants) ? row.ab_variants : null) as Campaign['ab_variants'],
  performance_data: row.performance_data as unknown as CampaignPerformance | null,
  status: row.status as CampaignStatus,
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

interface CampaignFilters {
  status?: CampaignStatus | 'all';
  goal?: CampaignGoal | 'all';
  search?: string;
}

// Fetch campaigns with optional filters
export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: ['mcc-campaigns', filters],
    queryFn: async () => {
      let query = supabase
        .from('mcc_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.goal && filters.goal !== 'all') {
        query = query.eq('goal', filters.goal);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(transformCampaign);
    },
  });
}

// Fetch single campaign by ID
export function useCampaignDetail(id: string | null) {
  return useQuery({
    queryKey: ['mcc-campaign', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('mcc_campaigns')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return transformCampaign(data);
    },
    enabled: !!id,
  });
}

// Create campaign mutation
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CampaignFormData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const insertPayload = {
        name: formData.name,
        description: formData.description || null,
        goal: formData.goal as string,
        target_segment: formData.target_segment as string,
        channels: formData.channels,
        budget: formData.budget,
        schedule: formData.schedule,
        kpi_targets: formData.kpi_targets || null,
        status: 'draft',
        created_by: user?.user?.id || null,
        performance_data: { leads: 0, conversions: 0, spend: 0 },
      };
      
      const { data, error } = await supabase
        .from('mcc_campaigns')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([insertPayload] as never)
        .select()
        .single();

      if (error) throw error;
      return transformCampaign(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-campaigns'] });
      toast.success('Campaign created successfully');
    },
    onError: () => {
      toast.error('Failed to create campaign');
    },
  });
}

// Update campaign mutation
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignFormData> }) => {
      const updatePayload: Record<string, unknown> = {};
      
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description || null;
      if (data.goal !== undefined) updatePayload.goal = data.goal;
      if (data.target_segment !== undefined) updatePayload.target_segment = data.target_segment;
      if (data.channels !== undefined) updatePayload.channels = data.channels as string[];
      if (data.budget !== undefined) updatePayload.budget = data.budget as Record<string, unknown>;
      if (data.schedule !== undefined) updatePayload.schedule = data.schedule as Record<string, unknown>;
      if (data.kpi_targets !== undefined) updatePayload.kpi_targets = data.kpi_targets as Record<string, unknown>;

      const { data: result, error } = await supabase
        .from('mcc_campaigns')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(updatePayload as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformCampaign(result);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mcc-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['mcc-campaign', variables.id] });
      toast.success('Campaign updated successfully');
    },
    onError: () => {
      toast.error('Failed to update campaign');
    },
  });
}

// Delete campaign mutation (only drafts)
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if campaign is a draft
      const { data: campaign } = await supabase
        .from('mcc_campaigns')
        .select('status')
        .eq('id', id)
        .single();

      if (campaign?.status !== 'draft') {
        throw new Error('Only draft campaigns can be deleted');
      }

      const { error } = await supabase
        .from('mcc_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete campaign');
    },
  });
}

// Duplicate campaign mutation
export function useDuplicateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch original campaign
      const { data: original, error: fetchError } = await supabase
        .from('mcc_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data: user } = await supabase.auth.getUser();

      const duplicatePayload = {
        name: `${original.name} (Copy)`,
        description: original.description,
        goal: original.goal,
        target_segment: original.target_segment,
        channels: original.channels,
        budget: original.budget,
        schedule: null,
        kpi_targets: original.kpi_targets,
        status: 'draft',
        created_by: user?.user?.id || null,
        performance_data: { leads: 0, conversions: 0, spend: 0 },
      };
      
      const { data, error } = await supabase
        .from('mcc_campaigns')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([duplicatePayload] as never)
        .select()
        .single();

      if (error) throw error;
      return transformCampaign(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcc-campaigns'] });
      toast.success('Campaign duplicated');
    },
    onError: () => {
      toast.error('Failed to duplicate campaign');
    },
  });
}

// Update campaign status
export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CampaignStatus }) => {
      const { data, error } = await supabase
        .from('mcc_campaigns')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformCampaign(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mcc-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['mcc-campaign', variables.id] });
      
      const messages: Record<CampaignStatus, string> = {
        draft: 'Campaign moved to draft',
        scheduled: 'Campaign scheduled',
        active: 'Campaign activated',
        paused: 'Campaign paused',
        completed: 'Campaign completed',
      };
      toast.success(messages[variables.status]);
    },
    onError: () => {
      toast.error('Failed to update campaign status');
    },
  });
}

// Toggle between active and paused
export function useToggleCampaignStatus() {
  const updateStatus = useUpdateCampaignStatus();

  return {
    ...updateStatus,
    mutate: (campaign: Campaign) => {
      const newStatus: CampaignStatus = campaign.status === 'active' ? 'paused' : 'active';
      updateStatus.mutate({ id: campaign.id, status: newStatus });
    },
    mutateAsync: async (campaign: Campaign) => {
      const newStatus: CampaignStatus = campaign.status === 'active' ? 'paused' : 'active';
      return updateStatus.mutateAsync({ id: campaign.id, status: newStatus });
    },
  };
}

// Launch a draft campaign
export function useLaunchCampaign() {
  const updateStatus = useUpdateCampaignStatus();

  return {
    ...updateStatus,
    mutate: (id: string) => updateStatus.mutate({ id, status: 'active' }),
    mutateAsync: (id: string) => updateStatus.mutateAsync({ id, status: 'active' }),
  };
}

// Complete a campaign
export function useCompleteCampaign() {
  const updateStatus = useUpdateCampaignStatus();

  return {
    ...updateStatus,
    mutate: (id: string) => updateStatus.mutate({ id, status: 'completed' }),
    mutateAsync: (id: string) => updateStatus.mutateAsync({ id, status: 'completed' }),
  };
}
