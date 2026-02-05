/**
 * useLifeSituations - Hook for Life Situations meta-layer
 * Provides life situations data and catalog resolution
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LifeSituation {
  id: string;
  code: string;
  title_en: string;
  title_ru: string;
  description_en: string | null;
  description_ru: string | null;
  icon: string;
  color: string;
  priority: number;
  is_active: boolean;
}

export interface CatalogLifeMap {
  id: string;
  entity_type: string;
  entity_id: string;
  life_situation_id: string;
  weight: number;
  rules: Record<string, unknown>;
}

/**
 * Fetch all active life situations
 */
export function useLifeSituations() {
  return useQuery({
    queryKey: ['life-situations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_situations')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as LifeSituation[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Resolve catalog items by life situation code
 */
export function useResolveLifeSituation(lifeCode: string | null, limit = 20) {
  return useQuery({
    queryKey: ['life-situation-catalog', lifeCode, limit],
    queryFn: async () => {
      if (!lifeCode) return [];
      
      const { data, error } = await supabase
        .rpc('resolve_catalog_by_life_situation', {
          p_life_code: lifeCode,
          p_limit: limit,
        });

      if (error) throw error;
      return data as Array<{
        entity_type: string;
        entity_id: string;
        weight: number;
        rules: Record<string, unknown>;
      }>;
    },
    enabled: !!lifeCode,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Admin: Fetch all life situations (including inactive)
 */
export function useAdminLifeSituations() {
  return useQuery({
    queryKey: ['admin-life-situations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_situations')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as LifeSituation[];
    },
  });
}

/**
 * Admin: Fetch catalog mappings for a life situation
 */
export function useAdminCatalogMappings(lifeSituationId: string | null) {
  return useQuery({
    queryKey: ['admin-catalog-mappings', lifeSituationId],
    queryFn: async () => {
      if (!lifeSituationId) return [];
      
      const { data, error } = await supabase
        .from('catalog_life_map')
        .select('*')
        .eq('life_situation_id', lifeSituationId)
        .order('weight', { ascending: false });

      if (error) throw error;
      return data as CatalogLifeMap[];
    },
    enabled: !!lifeSituationId,
  });
}
