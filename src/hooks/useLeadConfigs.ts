/**
 * useLeadConfigs - Hybrid hook with DB-first + static fallback
 * Reads lead form configs from sys_lead_configs table
 * Falls back to static LEAD_VERTICALS if DB is empty or unavailable
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LEAD_VERTICALS, LeadVerticalConfig, LeadFormField } from '@/lib/leadVerticalConfig';

interface DbLeadConfig {
  id: string;
  vertical_id: string;
  icon: string | null;
  name_en: string;
  name_ru: string;
  short_desc_en: string | null;
  short_desc_ru: string | null;
  cta_text_en: string | null;
  cta_text_ru: string | null;
  popularity_score: number;
  request_types: { value: string; labelEn: string; labelRu: string }[];
  fields: LeadFormField[];
  is_active: boolean;
  sort_order: number;
}

function mapDbToLeadConfig(row: DbLeadConfig): LeadVerticalConfig {
  return {
    id: row.vertical_id,
    icon: row.icon || '📋',
    nameEn: row.name_en,
    nameRu: row.name_ru,
    shortDescEn: row.short_desc_en || '',
    shortDescRu: row.short_desc_ru || '',
    ctaTextEn: row.cta_text_en || 'Submit',
    ctaTextRu: row.cta_text_ru || 'Отправить',
    popularityScore: row.popularity_score || 50,
    requestTypes: row.request_types || [],
    fields: row.fields || [],
  };
}

export function useLeadConfigs() {
  return useQuery({
    queryKey: ['lead-configs'],
    queryFn: async (): Promise<LeadVerticalConfig[]> => {
      try {
        const { data, error } = await supabase
          .from('sys_lead_configs')
          .select('*')
          .eq('is_active', true)
          .order('popularity_score', { ascending: false });

        if (error) {
          console.warn('Failed to fetch lead configs from DB, using fallback:', error.message);
          return LEAD_VERTICALS;
        }

        if (!data || data.length === 0) {
          console.info('No lead configs in DB, using static fallback');
          return LEAD_VERTICALS;
        }

        // Map DB rows to LeadVerticalConfig interface
        return data.map(row => mapDbToLeadConfig(row as unknown as DbLeadConfig));
      } catch (err) {
        console.error('Error fetching lead configs:', err);
        return LEAD_VERTICALS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
  });
}

/**
 * Get a single lead config by vertical ID
 */
export function useLeadConfigByVertical(verticalId: string | undefined) {
  const { data: configs, isLoading, error } = useLeadConfigs();

  const config = verticalId 
    ? configs?.find(c => c.id === verticalId)
    : undefined;

  return { config, isLoading, error };
}

/**
 * Get lead configs sorted by popularity for FAB display
 */
export function usePopularLeadConfigs(limit?: number) {
  const { data: configs, isLoading, error } = useLeadConfigs();

  const sortedConfigs = configs
    ?.slice()
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);

  return { configs: sortedConfigs, isLoading, error };
}

/**
 * Sync helper - returns static configs for initial data population
 */
export function getStaticLeadConfigs(): LeadVerticalConfig[] {
  return LEAD_VERTICALS;
}
