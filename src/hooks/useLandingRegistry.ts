import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LandingRegistryItem {
  id: string;
  landing_id: string;
  name_en: string;
  name_ru: string | null;
  is_active: boolean;
  route_path: string;
  target_path: string;
  hero_variant: string;
  cta_variant: string;
  cta_label_en: string | null;
  cta_label_ru: string | null;
  next_actions: any[];
  forbidden_elements: string[];
  created_at: string;
  updated_at: string;
}

export function useLandingRegistry() {
  return useQuery({
    queryKey: ['mcc-landing-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_landing_registry')
        .select('*')
        .order('landing_id');
      if (error) throw error;
      return data as LandingRegistryItem[];
    },
  });
}

export function useToggleLanding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('mcc_landing_registry')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcc-landing-registry'] }),
  });
}

export function useUpdateLandingVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'hero_variant' | 'cta_variant'; value: string }) => {
      const updateData = field === 'hero_variant' 
        ? { hero_variant: value } 
        : { cta_variant: value };
      const { error } = await supabase
        .from('mcc_landing_registry')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcc-landing-registry'] }),
  });
}

export function useLandingEvents(landingId?: string) {
  return useQuery({
    queryKey: ['mcc-landing-events', landingId],
    queryFn: async () => {
      let query = supabase
        .from('mcc_landing_events')
        .select('event_name, landing_id, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (landingId) {
        query = query.eq('landing_id', landingId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUserStateDistribution() {
  return useQuery({
    queryKey: ['mcc-user-state-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_user_states')
        .select('state, source_landing, first_vertical, verticals_used');
      if (error) throw error;
      
      // Aggregate by state
      const distribution: Record<string, number> = {};
      const byLanding: Record<string, Record<string, number>> = {};
      
      (data || []).forEach((row: any) => {
        distribution[row.state] = (distribution[row.state] || 0) + 1;
        if (row.source_landing) {
          if (!byLanding[row.source_landing]) byLanding[row.source_landing] = {};
          byLanding[row.source_landing][row.state] = (byLanding[row.source_landing][row.state] || 0) + 1;
        }
      });
      
      return { distribution, byLanding, total: data?.length || 0 };
    },
  });
}

export function useABTests() {
  return useQuery({
    queryKey: ['mcc-ab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
