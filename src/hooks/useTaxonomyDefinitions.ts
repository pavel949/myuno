/**
 * Hook for Taxonomy Definitions (Meta-taxonomy)
 * Used by AdminTaxonomyManager to display and manage taxonomy types
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaxonomyDefinition {
  id: string;
  type_key: string;
  name_en: string;
  name_ru: string;
  icon: string;
  vertical: string;
  supports_hierarchy: boolean;
  metadata_schema: unknown;
  is_system: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaxonomyWithCount extends TaxonomyDefinition {
  value_count: number;
}

export type TaxonomyVertical = 
  | 'property' 
  | 'transport' 
  | 'home_services' 
  | 'yachts' 
  | 'tours' 
  | 'restaurants' 
  | 'medical' 
  | 'pets' 
  | 'salons' 
  | 'events' 
  | 'general';

export const VERTICAL_CONFIG: Record<TaxonomyVertical, { labelEn: string; labelRu: string; icon: string }> = {
  property: { labelEn: 'Property', labelRu: 'Недвижимость', icon: '🏠' },
  transport: { labelEn: 'Transport', labelRu: 'Транспорт', icon: '🚗' },
  home_services: { labelEn: 'Home Services', labelRu: 'Домашние услуги', icon: '🔧' },
  yachts: { labelEn: 'Boat Charters', labelRu: 'Чартер', icon: '🚤' },
  tours: { labelEn: 'Tours', labelRu: 'Туры', icon: '🎯' },
  restaurants: { labelEn: 'Restaurants', labelRu: 'Рестораны', icon: '🍽️' },
  medical: { labelEn: 'Medical', labelRu: 'Медицина', icon: '🏥' },
  pets: { labelEn: 'Pets', labelRu: 'Питомцы', icon: '🐾' },
  salons: { labelEn: 'Salons', labelRu: 'Салоны', icon: '💇' },
  events: { labelEn: 'Events', labelRu: 'События', icon: '🎉' },
  general: { labelEn: 'General', labelRu: 'Общие', icon: '📍' },
};

/**
 * Fetch all taxonomy definitions with value counts
 */
export function useTaxonomyDefinitions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['taxonomy-definitions'],
    queryFn: async (): Promise<TaxonomyWithCount[]> => {
      // Get definitions
      const { data: definitions, error: defError } = await supabase
        .from('taxonomy_definitions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (defError) throw defError;

      // Get value counts per type
      const { data: counts, error: countError } = await supabase
        .from('lookup_values')
        .select('lookup_type')
        .eq('is_active', true);

      if (countError) throw countError;

      // Count values per type
      const countMap: Record<string, number> = {};
      (counts || []).forEach((item: { lookup_type: string }) => {
        countMap[item.lookup_type] = (countMap[item.lookup_type] || 0) + 1;
      });

      return (definitions || []).map((def) => ({
        ...(def as unknown as TaxonomyDefinition),
        value_count: countMap[(def as { type_key: string }).type_key] || 0,
      })) as TaxonomyWithCount[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Group by vertical
  const groupedByVertical = (query.data || []).reduce((acc, def) => {
    const vertical = (def.vertical || 'general') as TaxonomyVertical;
    if (!acc[vertical]) acc[vertical] = [];
    acc[vertical].push(def);
    return acc;
  }, {} as Record<TaxonomyVertical, TaxonomyWithCount[]>) || {};

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (definition: Omit<TaxonomyDefinition, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('taxonomy_definitions')
        .insert(definition as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-definitions'] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaxonomyDefinition> & { id: string }) => {
      const { data, error } = await supabase
        .from('taxonomy_definitions')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-definitions'] });
    },
  });

  // Delete mutation (soft delete via is_active)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('taxonomy_definitions')
        .update({ is_active: false } as never)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-definitions'] });
    },
  });

  return {
    definitions: query.data || [],
    groupedByVertical,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // CRUD
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Get a single taxonomy definition by type_key
 */
export function useTaxonomyDefinition(typeKey: string) {
  const { definitions, isLoading } = useTaxonomyDefinitions();
  const definition = definitions.find((def) => def.type_key === typeKey);
  return { definition, isLoading };
}
