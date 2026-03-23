/**
 * useProviderInputValidation - Provides soft validation hints for provider input forms
 * Non-blocking guidance to improve catalog quality
 */

import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProviderInputRule {
  id: string;
  entity_type: string;
  field_name: string;
  rule_type: 'warn_empty' | 'warn_duplicate' | 'suggest_value' | 'hint';
  rule_config: Record<string, unknown>;
  message_en: string;
  message_ru: string | null;
  severity: 'info' | 'warning' | 'error';
  is_active: boolean;
}

interface ValidationResult {
  field: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  type: string;
}

export function useProviderInputValidation(entityType: string) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Fetch rules for this entity type
  const { data: rules = [] } = useQuery({
    queryKey: ['provider-input-rules', entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_input_rules')
        .select('*')
        .eq('entity_type', entityType)
        .eq('is_active', true);
      
      if (error) {
        logger.warn('Failed to fetch provider input rules:', error);
        return [];
      }
      return data as ProviderInputRule[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  /**
   * Validate form data against rules (non-blocking)
   */
  const validate = (formData: Record<string, unknown>): ValidationResult[] => {
    const results: ValidationResult[] = [];

    for (const rule of rules) {
      const value = formData[rule.field_name];
      const message = isRu && rule.message_ru ? rule.message_ru : rule.message_en;

      switch (rule.rule_type) {
        case 'warn_empty':
          if (!value || (typeof value === 'string' && value.trim() === '') || 
              (Array.isArray(value) && value.length === 0)) {
            results.push({
              field: rule.field_name,
              message,
              severity: rule.severity,
              type: 'warn_empty',
            });
          }
          break;

        case 'hint':
          // Always show hints for fields that have them
          results.push({
            field: rule.field_name,
            message,
            severity: 'info',
            type: 'hint',
          });
          break;

        case 'suggest_value':
          // Show suggestion if value seems incomplete
          if (!value) {
            results.push({
              field: rule.field_name,
              message,
              severity: 'info',
              type: 'suggest_value',
            });
          }
          break;
      }
    }

    return results;
  };

  /**
   * Get hint for a specific field
   */
  const getFieldHint = (fieldName: string): string | null => {
    const rule = rules.find(r => r.field_name === fieldName && r.rule_type === 'hint');
    if (!rule) return null;
    return isRu && rule.message_ru ? rule.message_ru : rule.message_en;
  };

  /**
   * Get warning for a specific field
   */
  const getFieldWarning = (fieldName: string, value: unknown): string | null => {
    const rule = rules.find(r => r.field_name === fieldName && r.rule_type === 'warn_empty');
    if (!rule) return null;
    
    const isEmpty = !value || 
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);
    
    if (!isEmpty) return null;
    return isRu && rule.message_ru ? rule.message_ru : rule.message_en;
  };

  return {
    rules,
    validate,
    getFieldHint,
    getFieldWarning,
  };
}

/**
 * Hook to fetch normalized taxonomy values for faceting
 */
export function useTaxonomyNormalization(entityType: string, fieldName: string) {
  return useQuery({
    queryKey: ['taxonomy-normalization', entityType, fieldName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('taxonomy_normalization')
        .select('original_value, normalized_value, normalization_type')
        .eq('entity_type', entityType)
        .eq('field_name', fieldName)
        .eq('is_active', true);
      
      if (error) {
        logger.warn('Failed to fetch taxonomy normalization:', error);
        return new Map<string, string>();
      }
      
      const map = new Map<string, string>();
      for (const row of data || []) {
        map.set(row.original_value, row.normalized_value);
      }
      return map;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Normalize a taxonomy value using the lookup
 */
export function normalizeValue(value: string, normMap: Map<string, string>): string {
  if (!value) return value;
  // Check for exact match first
  if (normMap.has(value)) {
    return normMap.get(value)!;
  }
  // Default normalization: lowercase, replace hyphens with underscores
  return value.toLowerCase().replace(/-/g, '_');
}

/**
 * Hook to fetch facet definitions for an entity type
 */
export function useCatalogFacets(entityType: string) {
  return useQuery({
    queryKey: ['catalog-facets', entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_facet_definitions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        logger.warn('Failed to fetch catalog facets:', error);
        return [];
      }
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
}
