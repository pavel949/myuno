/**
 * useLifeOS - Enhanced LIFE OS hooks
 * Provides life situations data with role-aware catalog resolution
 * 
 * Per LIFE OS Contract:
 * - Supports role_scope (guest/resident/owner/investor)
 * - Locale-aware title resolution
 * - AI-readable structured responses
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

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

export interface LifeOSCatalogItem {
  entity_type: string;
  entity_id: string;
  title: string;
  title_localized: string;
  price: number | null;
  currency: string;
  location: string | null;
  provider_id: string | null;
  trust_level: string;
  weight: number;
  role_scope: string[];
  rules: Record<string, unknown>;
}

export interface CatalogLifeMap {
  id: string;
  entity_type: string;
  entity_id: string;
  life_situation_id: string;
  weight: number;
  role_scope: string[];
  rules: Record<string, unknown>;
}

// User role type for LIFE OS
export type LifeOSRole = 'guest' | 'resident' | 'owner' | 'investor';

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
 * Get current user's LIFE OS role based on their profile/roles
 */
export function useLifeOSRole(): LifeOSRole {
  const { user } = useAuth();
  
  // TODO: In production, this should check user_roles table
  // For now, return 'guest' for non-authenticated, 'resident' for authenticated
  if (!user) return 'guest';
  
  // This can be extended to check:
  // - provider_id (owner)
  // - investment records (investor)
  // - residency status (resident)
  return 'resident';
}

/**
 * Enhanced LIFE OS context resolver with role and locale support
 * Uses the new resolve_life_os_context RPC function
 */
export function useResolveLifeOSContext(
  lifeCode: string | null,
  options?: { 
    role?: LifeOSRole; 
    limit?: number;
  }
) {
  const { language } = useLanguage();
  const defaultRole = useLifeOSRole();
  const role = options?.role ?? defaultRole;
  const limit = options?.limit ?? 50;
  const locale = language === 'ru' ? 'ru' : 'en';

  return useQuery({
    queryKey: ['life-os-context', lifeCode, role, locale, limit],
    queryFn: async () => {
      if (!lifeCode) return [];
      
      const { data, error } = await supabase
        .rpc('resolve_life_os_context', {
          p_life_code: lifeCode,
          p_user_role: role,
          p_locale: locale,
          p_limit: limit,
        });

      if (error) throw error;
      return (data || []) as LifeOSCatalogItem[];
    },
    enabled: !!lifeCode,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Legacy resolver - delegates to new enhanced resolver
 * Maintains backward compatibility with existing code
 */
export function useResolveLifeSituation(lifeCode: string | null, limit = 20) {
  return useResolveLifeOSContext(lifeCode, { limit });
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

/**
 * AI Contract: Get life situation as AI-readable JSON
 * Per LIFE OS Contract §AI Operating Contract
 */
export function getLifeOSAIContext(
  situation: LifeSituation,
  items: LifeOSCatalogItem[]
): {
  life_situation: string;
  intent: string;
  time_horizon: string;
  risk_level: string;
  recommended_blocks: string[];
} {
  // Map situation code to AI contract fields
  const intentMap: Record<string, { intent: string; time_horizon: string; risk_level: string }> = {
    arrival_first_day: { intent: 'settle', time_horizon: '24h', risk_level: 'high' },
    long_term_living: { intent: 'establish', time_horizon: '30d', risk_level: 'medium' },
    family_with_children: { intent: 'care', time_horizon: '7d', risk_level: 'high' },
    emergency_medical: { intent: 'urgent_help', time_horizon: '1h', risk_level: 'critical' },
    investment_property: { intent: 'invest', time_horizon: '90d', risk_level: 'medium' },
    departure_day: { intent: 'depart', time_horizon: '12h', risk_level: 'medium' },
    wedding_event: { intent: 'celebrate', time_horizon: '30d', risk_level: 'medium' },
    retirement_living: { intent: 'settle_long_term', time_horizon: '180d', risk_level: 'low' },
  };

  const defaults = { intent: 'explore', time_horizon: '7d', risk_level: 'low' };
  const mapping = intentMap[situation.code] || defaults;

  // Extract unique entity types as recommended blocks
  const recommendedBlocks = [...new Set(items.map(item => item.entity_type))];

  return {
    life_situation: situation.code,
    intent: mapping.intent,
    time_horizon: mapping.time_horizon,
    risk_level: mapping.risk_level,
    recommended_blocks: recommendedBlocks,
  };
}
