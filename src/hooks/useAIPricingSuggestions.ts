import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PricingRecommendation {
  id: string;
  property_id: string;
  date_from: string;
  date_to: string;
  current_price: number;
  recommended_price: number;
  currency: string;
  confidence: number;
  reasoning: string;
  factors: Record<string, string>;
  status: 'pending' | 'accepted' | 'dismissed';
  created_at: string;
}

export function useAIPricingSuggestions(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery<PricingRecommendation[]>({
    queryKey: ['pricing-recommendations', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('pricing_recommendations')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as PricingRecommendation[];
    },
    enabled: !!propertyId && !!user,
    staleTime: 10 * 60 * 1000,
  });

  const generateSuggestions = useMutation({
    mutationFn: async (propId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-pricing-optimizer', {
        body: { property_id: propId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations', propertyId] });
    },
  });

  const acceptSuggestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_recommendations')
        .update({ status: 'accepted' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations', propertyId] });
    },
  });

  const dismissSuggestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_recommendations')
        .update({ status: 'dismissed' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-recommendations', propertyId] });
    },
  });

  return {
    suggestions,
    isLoading,
    generateSuggestions,
    acceptSuggestion,
    dismissSuggestion,
  };
}
