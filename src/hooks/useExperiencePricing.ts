import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExperiencePricingOption {
  id: string;
  experience_id: string;
  price_name: string;
  price_type: string;
  min_pax: number | null;
  max_pax: number | null;
  price_thb: number;
  price_notes: string | null;
}

export function useExperiencePricing(experienceId: string | undefined) {
  return useQuery({
    queryKey: ['experience-pricing', experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_pricing')
        .select('*')
        .eq('experience_id', experienceId!)
        .order('price_thb', { ascending: true });
      if (error) throw error;
      return (data || []) as ExperiencePricingOption[];
    },
    enabled: !!experienceId,
  });
}
