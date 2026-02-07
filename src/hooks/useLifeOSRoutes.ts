/**
 * useLifeOSRoutes - Fetch guided route data for a life situation
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LifeOSRoute {
  id: string;
  life_situation_id: string;
  pain_type: string;
  emotional_state: string;
  risk_level: string;
  recognition_en: string;
  recognition_ru: string;
  reassurance_en: string;
  reassurance_ru: string;
  what_matters_en: string[];
  what_matters_ru: string[];
  recommended_entity_type: string | null;
  recommended_entity_id: string | null;
  recommended_title_en: string;
  recommended_title_ru: string;
  recommended_why_en: string;
  recommended_why_ru: string;
  cta_text_en: string;
  cta_text_ru: string;
  cta_type: string;
  cta_target: string | null;
  alternative_entity_ids: string[];
  next_routes: string[];
  next_routes_labels_en: string[];
  next_routes_labels_ru: string[];
}

export function useLifeOSRoute(lifeSituationId: string | null) {
  return useQuery({
    queryKey: ['lifeos-route', lifeSituationId],
    queryFn: async () => {
      if (!lifeSituationId) return null;

      const { data, error } = await supabase
        .from('lifeos_routes')
        .select('*')
        .eq('life_situation_id', lifeSituationId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as LifeOSRoute | null;
    },
    enabled: !!lifeSituationId,
    staleTime: 5 * 60 * 1000,
  });
}
