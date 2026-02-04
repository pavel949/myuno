/**
 * Admin hooks for managing investment projects
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { InvestmentProject } from './useInvestmentProjects';

export interface InvestmentProjectFormData {
  title_en: string;
  title_ru: string;
  slug?: string;
  description_en?: string;
  description_ru?: string;
  cover_image?: string;
  images?: string[];
  project_type: string;
  industry?: string;
  status: string;
  currency: string;
  funding_goal?: number;
  amount_raised?: number;
  min_investment?: number;
  max_investment?: number;
  roi_projected?: number;
  investment_term_months?: number;
  exit_strategy?: string;
  muuno_score?: number;
  risk_level?: string;
  score_breakdown?: Record<string, number>;
  risk_factors?: string[];
  property_project_id?: string;
  founder_id?: string;
  developer_id?: string;
  district?: string;
  address?: string;
  lat?: number;
  lng?: number;
  is_featured?: boolean;
  is_hot?: boolean;
  is_verified?: boolean;
}

// Fetch all investment projects for admin (including drafts)
export function useAdminInvestmentProjects() {
  return useQuery({
    queryKey: ['admin-investment-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as InvestmentProject[];
    },
  });
}

// Create investment project
export function useCreateInvestmentProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InvestmentProjectFormData) => {
      const { data: result, error } = await supabase
        .from('investment_projects')
        .insert({
          ...data,
          images: data.images || [],
          risk_factors: data.risk_factors || [],
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-investment-projects'] });
      queryClient.invalidateQueries({ queryKey: ['investment-projects'] });
      toast.success('Investment project created');
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error('Failed to create project');
    },
  });
}

// Update investment project
export function useUpdateInvestmentProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: InvestmentProjectFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('investment_projects')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-investment-projects'] });
      queryClient.invalidateQueries({ queryKey: ['investment-projects'] });
      queryClient.invalidateQueries({ queryKey: ['investment-project', data.id] });
      toast.success('Investment project updated');
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Failed to update project');
    },
  });
}

// Delete investment project
export function useDeleteInvestmentProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investment_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-investment-projects'] });
      queryClient.invalidateQueries({ queryKey: ['investment-projects'] });
      toast.success('Investment project deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete project');
    },
  });
}
