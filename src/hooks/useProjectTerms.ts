/**
 * Hooks for fetching project special terms and promotions
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectSpecialTerm {
  id: string;
  project_id: string;
  payment_plan: string | null;
  payment_details: string | null;
  discount_percent: number | null;
  discount_description: string | null;
  promo_label: string | null;
  valid_until: string | null;
  created_at: string | null;
}

export interface ProjectPromotion {
  id: string;
  project_id: string | null;
  developer_id: string | null;
  type: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
  amount_paid: number | null;
  created_at: string | null;
}

export function useProjectTerms(projectId?: string) {
  return useQuery({
    queryKey: ['project-terms', projectId],
    queryFn: async (): Promise<ProjectSpecialTerm[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('nb_special_terms')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectSpecialTerm[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectPromotions(projectId?: string) {
  return useQuery({
    queryKey: ['project-promotions', projectId],
    queryFn: async (): Promise<ProjectPromotion[]> => {
      if (!projectId) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase.from('nb_promotions')
        .select('*')
        .eq('project_id', projectId)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectPromotion[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
