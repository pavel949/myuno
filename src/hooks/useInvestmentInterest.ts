import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InvestmentInterest {
  id: string;
  project_id: string;
  user_id: string;
  interest_type: 'invest' | 'learn_more' | 'call_request';
  preferred_amount: number | null;
  preferred_currency: string;
  status: string;
  priority: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentProjectSummary {
  id: string;
  title_en: string | null;
  title_ru: string | null;
  cover_image: string | null;
  roi_projected: number | null;
  muuno_score: number | null;
  district: string | null;
  project_type: string | null;
}

export interface InvestmentInterestWithProject extends InvestmentInterest {
  project: InvestmentProjectSummary | null;
}

export interface CreateInterestData {
  project_id: string;
  interest_type: 'invest' | 'learn_more' | 'call_request';
  preferred_amount?: number;
  preferred_currency?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  source?: string;
}

export function useInvestmentInterest(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user already expressed interest in this project
  const { data: existingInterest, isLoading: checkingInterest } = useQuery({
    queryKey: ['investment-interest', projectId, user?.id],
    queryFn: async () => {
      if (!projectId || !user?.id) return null;

      const { data, error } = await supabase
        .from('investment_interests')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as InvestmentInterest | null;
    },
    enabled: !!projectId && !!user?.id,
  });

  // Get all user's interests (basic)
  const { data: userInterests, isLoading: loadingInterests } = useQuery({
    queryKey: ['investment-interests', 'user', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('investment_interests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as InvestmentInterest[];
    },
    enabled: !!user?.id,
  });

  // Get user's interests with project details (for dashboard)
  const { data: userInterestsWithProjects, isLoading: loadingInterestsWithProjects } = useQuery({
    queryKey: ['investment-interests', 'user-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('investment_interests')
        .select(`
          *,
          project:investment_projects (
            id, title_en, title_ru, cover_image,
            roi_projected, muuno_score, district, project_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as InvestmentInterestWithProject[];
    },
    enabled: !!user?.id,
  });

  // Create interest mutation
  const createInterest = useMutation({
    mutationFn: async (data: CreateInterestData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('investment_interests')
        .insert({
          ...data,
          user_id: user.id,
          preferred_currency: data.preferred_currency || 'USD',
          source: data.source || 'web',
        })
        .select()
        .single();

      if (error) throw error;
      return result as InvestmentInterest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['investment-interest', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['investment-interests', 'user'] });
      
      toast.success(
        variables.interest_type === 'invest' 
          ? 'Investment interest submitted! Our team will contact you soon.' 
          : 'Request submitted! We\'ll get back to you shortly.'
      );
    },
    onError: () => {
      toast.error('Failed to submit interest. Please try again.');
    },
  });

  return {
    existingInterest,
    checkingInterest,
    userInterests,
    loadingInterests,
    userInterestsWithProjects,
    loadingInterestsWithProjects: loadingInterestsWithProjects || loadingInterests,
    createInterest: createInterest.mutateAsync,
    isSubmitting: createInterest.isPending,
    hasExpressedInterest: !!existingInterest,
  };
}
