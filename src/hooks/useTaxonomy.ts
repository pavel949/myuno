/**
 * Universal Taxonomy Hook
 * Single source of truth for all taxonomies across the platform
 * Replaces hardcoded imports from propertyTaxonomy.ts, transportTaxonomy.ts, etc.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface TaxonomyValue {
  id: string;
  lookup_type: string;
  value_key: string;
  value_en: string;
  value_ru: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface TaxonomyOption {
  id: string;
  value: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
  color?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface TaxonomyHierarchy {
  parent: TaxonomyOption;
  children: TaxonomyOption[];
}

/**
 * Main hook for fetching taxonomy values
 * @param lookupType - The type of taxonomy to fetch (e.g., 'property_type', 'district')
 * @param options - Additional options for filtering and sorting
 */
export function useTaxonomy(
  lookupType: string,
  options?: {
    includeInactive?: boolean;
    parentId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['taxonomy', lookupType, options],
    queryFn: async (): Promise<TaxonomyOption[]> => {
      let q = supabase
        .from('lookup_values')
        .select('*')
        .eq('lookup_type', lookupType)
        .order('sort_order', { ascending: true });

      if (!options?.includeInactive) {
        q = q.eq('is_active', true);
      }

      if (options?.parentId !== undefined) {
        if (options.parentId === null) {
          q = q.is('parent_id', null);
        } else {
          q = q.eq('parent_id', options.parentId);
        }
      }

      const { data, error } = await q;

      if (error) {
        logger.error(`Error fetching taxonomy ${lookupType}:`, error);
        throw error;
      }

      // Filter by metadata if provided
      let filtered = (data || []) as TaxonomyValue[];
      if (options?.metadata) {
        filtered = filtered.filter((item) => {
          const meta = item.metadata || {};
          return Object.entries(options.metadata || {}).every(
            ([key, value]) => meta[key] === value
          );
        });
      }

      return filtered.map(transformToOption);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (value: Omit<TaxonomyValue, 'id' | 'lookup_type'>) => {
      const { data, error } = await supabase
        .from('lookup_values')
        .insert({
          ...value,
          lookup_type: lookupType,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', lookupType] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaxonomyValue> & { id: string }) => {
      const { data, error } = await supabase
        .from('lookup_values')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', lookupType] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lookup_values')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', lookupType] });
    },
  });

  // Bulk update mutation (for reordering, bulk activate/deactivate)
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; sort_order?: number; is_active?: boolean }>) => {
      const promises = updates.map(({ id, ...data }) =>
        supabase.from('lookup_values').update(data as any).eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy', lookupType] });
    },
  });

  return {
    options: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // CRUD operations
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    bulkUpdate: bulkUpdateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for hierarchical taxonomies (e.g., amenities with categories)
 */
export function useTaxonomyHierarchy(lookupType: string) {
  const query = useQuery({
    queryKey: ['taxonomy-hierarchy', lookupType],
    queryFn: async (): Promise<TaxonomyHierarchy[]> => {
      const { data, error } = await supabase
        .from('lookup_values')
        .select('*')
        .eq('lookup_type', lookupType)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const items = (data || []) as TaxonomyValue[];
      const parents = items.filter((item) => !item.parent_id);
      
      return parents.map((parent) => ({
        parent: transformToOption(parent),
        children: items
          .filter((item) => item.parent_id === parent.id)
          .map(transformToOption),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    hierarchy: query.data || [],
    flatOptions: query.data?.flatMap((h) => [h.parent, ...h.children]) || [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Get a single taxonomy value by key
 */
export function useTaxonomyValue(lookupType: string, valueKey: string) {
  const { options, isLoading } = useTaxonomy(lookupType);
  const value = options.find((opt) => opt.value === valueKey);
  return { value, isLoading };
}

/**
 * Get localized label for a taxonomy value
 */
export function useTaxonomyLabel(
  lookupType: string,
  valueKey: string | null | undefined,
  language: string = 'en'
): string {
  const { value, isLoading } = useTaxonomyValue(lookupType, valueKey || '');
  
  if (isLoading || !value) return valueKey || '';
  return language === 'ru' ? value.labelRu : value.labelEn;
}

/**
 * Hook for multiple taxonomy labels (batch)
 */
export function useTaxonomyLabels(
  lookupType: string,
  valueKeys: string[],
  language: string = 'en'
): string[] {
  const { options, isLoading } = useTaxonomy(lookupType);
  
  if (isLoading) return valueKeys;
  
  return valueKeys.map((key) => {
    const value = options.find((opt) => opt.value === key);
    if (!value) return key;
    return language === 'ru' ? value.labelRu : value.labelEn;
  });
}

// Helper function to transform DB record to option
function transformToOption(item: TaxonomyValue): TaxonomyOption {
  return {
    id: item.id,
    value: item.value_key,
    labelEn: item.value_en,
    labelRu: item.value_ru || item.value_en,
    icon: item.icon || undefined,
    color: item.color || undefined,
    parentId: item.parent_id || undefined,
    metadata: item.metadata,
  };
}

// ============= UTILITY FUNCTIONS FOR MIGRATION =============

/**
 * Get taxonomy options formatted for Select components
 */
export function formatForSelect(
  options: TaxonomyOption[],
  language: string = 'en'
): Array<{ value: string; label: string }> {
  return options.map((opt) => ({
    value: opt.value,
    label: language === 'ru' ? opt.labelRu : opt.labelEn,
  }));
}

/**
 * Get taxonomy options formatted for filter chips
 */
export function formatForChips(
  options: TaxonomyOption[],
  language: string = 'en'
): Array<{ id: string; label: string; icon?: string }> {
  return options.map((opt) => ({
    id: opt.value,
    label: language === 'ru' ? opt.labelRu : opt.labelEn,
    icon: opt.icon,
  }));
}
