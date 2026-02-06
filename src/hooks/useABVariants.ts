import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface VariantContent {
  headline_en: string;
  headline_ru: string;
  subheadline_en: string;
  subheadline_ru: string;
  cta_label_en: string;
  cta_label_ru: string;
}

export interface ABTest {
  id: string;
  landing_id: string;
  test_type: string;
  variant_a: VariantContent;
  variant_b: VariantContent;
  impressions_a: number | null;
  impressions_b: number | null;
  conversions_a: number | null;
  conversions_b: number | null;
  traffic_split: number | null;
  is_active: boolean | null;
  winner: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = 'mcc-ab-tests';

export function useABVariantsByLanding(landingId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, landingId],
    enabled: !!landingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_ab_tests')
        .select('*')
        .eq('landing_id', landingId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        variant_a: d.variant_a as unknown as VariantContent,
        variant_b: d.variant_b as unknown as VariantContent,
      })) as ABTest[];
    },
  });
}

export function useCreateABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      landing_id: string;
      test_type?: string;
      variant_a: VariantContent;
      variant_b: VariantContent;
      traffic_split?: number;
    }) => {
      const { data, error } = await supabase
        .from('mcc_ab_tests')
        .insert({
          landing_id: input.landing_id,
          test_type: input.test_type || 'hero_copy',
          variant_a: input.variant_a as unknown as Json,
          variant_b: input.variant_b as unknown as Json,
          traffic_split: input.traffic_split ?? 50,
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateABVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      variant_a?: VariantContent;
      variant_b?: VariantContent;
      traffic_split?: number;
    }) => {
      const update: Record<string, unknown> = {};
      if (input.variant_a) update.variant_a = input.variant_a as unknown as Json;
      if (input.variant_b) update.variant_b = input.variant_b as unknown as Json;
      if (input.traffic_split !== undefined) update.traffic_split = input.traffic_split;
      
      const { error } = await supabase
        .from('mcc_ab_tests')
        .update(update)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useToggleABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const update: Record<string, unknown> = { is_active };
      if (is_active) update.started_at = new Date().toISOString();
      if (!is_active) update.ended_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('mcc_ab_tests')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeclareWinner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, winner }: { id: string; winner: 'A' | 'B' }) => {
      const { error } = await supabase
        .from('mcc_ab_tests')
        .update({ winner, is_active: false, ended_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDuplicateABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: ABTest) => {
      const { data, error } = await supabase
        .from('mcc_ab_tests')
        .insert({
          landing_id: source.landing_id,
          test_type: source.test_type,
          variant_a: source.variant_a as unknown as Json,
          variant_b: source.variant_b as unknown as Json,
          traffic_split: source.traffic_split ?? 50,
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteABTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mcc_ab_tests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

/** Compute variant performance metrics from event data */
export function useVariantPerformance(landingId?: string) {
  return useQuery({
    queryKey: ['mcc-variant-performance', landingId],
    enabled: !!landingId,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data, error } = await supabase
        .from('mcc_landing_events')
        .select('event_name, payload')
        .eq('landing_id', landingId!)
        .gte('created_at', since);
      if (error) throw error;

      // Group by variant_id in payload
      const byVariant: Record<string, { views: number; cta: number; completed: number }> = {};

      (data || []).forEach((e: any) => {
        const vid = (e.payload as any)?.variant_id || 'none';
        if (!byVariant[vid]) byVariant[vid] = { views: 0, cta: 0, completed: 0 };
        switch (e.event_name) {
          case 'landing_view': byVariant[vid].views++; break;
          case 'primary_cta_click': byVariant[vid].cta++; break;
          case 'first_service_completed': byVariant[vid].completed++; break;
        }
      });

      return byVariant;
    },
  });
}
