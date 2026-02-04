/**
 * useIntakeConfigs - Hybrid hook with DB-first + static fallback
 * Reads intake vertical configs from sys_intake_configs table
 * Falls back to static INTAKE_VERTICALS if DB is empty or unavailable
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { INTAKE_VERTICALS, VerticalConfig, FieldLabel } from '@/lib/intakeVerticals';

interface DbIntakeConfig {
  id: string;
  vertical_id: string;
  target_table: string;
  name_en: string;
  name_ru: string;
  icon: string | null;
  keywords: string[];
  required_fields: string[];
  optional_fields: string[];
  field_labels: Record<string, FieldLabel>;
  is_active: boolean;
  sort_order: number;
}

function mapDbToVerticalConfig(row: DbIntakeConfig): VerticalConfig {
  return {
    id: row.vertical_id,
    table: row.target_table,
    nameEn: row.name_en,
    nameRu: row.name_ru,
    icon: row.icon || '📦',
    keywords: row.keywords || [],
    requiredFields: row.required_fields || [],
    optionalFields: row.optional_fields || [],
    fieldLabels: row.field_labels || {},
  };
}

export function useIntakeConfigs() {
  return useQuery({
    queryKey: ['intake-configs'],
    queryFn: async (): Promise<VerticalConfig[]> => {
      try {
        const { data, error } = await supabase
          .from('sys_intake_configs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) {
          console.warn('Failed to fetch intake configs from DB, using fallback:', error.message);
          return INTAKE_VERTICALS;
        }

        if (!data || data.length === 0) {
          console.info('No intake configs in DB, using static fallback');
          return INTAKE_VERTICALS;
        }

        // Map DB rows to VerticalConfig interface
        return data.map(row => mapDbToVerticalConfig(row as unknown as DbIntakeConfig));
      } catch (err) {
        console.error('Error fetching intake configs:', err);
        return INTAKE_VERTICALS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
  });
}

/**
 * Get a single intake config by vertical ID
 */
export function useIntakeConfigByVertical(verticalId: string | undefined) {
  const { data: configs, isLoading, error } = useIntakeConfigs();

  const config = verticalId 
    ? configs?.find(c => c.id === verticalId)
    : undefined;

  return { config, isLoading, error };
}

/**
 * Sync helper - returns static configs for initial data population
 */
export function getStaticIntakeConfigs(): VerticalConfig[] {
  return INTAKE_VERTICALS;
}
