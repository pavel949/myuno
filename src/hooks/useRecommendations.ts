import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLifeOSRole } from '@/hooks/useLifeOS';
import { useLanguage } from '@/contexts/LanguageContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface RecommendedItem {
  id: string;
  item_type: string;
  title_en: string;
  title_ru: string;
  image: string;
  rating: number;
  price: number;
  location?: string;
  reason: 'context' | 'history' | 'popular' | 'similar' | 'new';
}

// Default fallback image for items without cover_image
import defaultFallback from '@/assets/categories/default-market.webp';
const DEFAULT_IMAGE = defaultFallback;

/**
 * Context-aware fetch: uses resolve_life_os_context RPC when a life situation is active,
 * falls back to generic popular items otherwise.
 */
const fetchContextualRecommendations = async (
  lifeCode: string | null,
  role: string,
  locale: string,
  userId?: string,
): Promise<RecommendedItem[]> => {
  // --- PATH A: LifeOS context active → use RPC ---
  if (lifeCode) {
    const { data, error } = await supabase.rpc('resolve_life_os_context', {
      p_life_code: lifeCode,
      p_user_role: role,
      p_locale: locale,
      p_limit: 16,
    });

    if (error || !data?.length) {
      // Fallback to generic if RPC fails
      return fetchGenericPopular(userId);
    }

    return data.map((item: any) => ({
      id: item.entity_id,
      item_type: item.entity_type,
      title_en: item.title || item.entity_type,
      title_ru: item.title_localized || item.title || item.entity_type,
      image: DEFAULT_IMAGE,
      rating: 0,
      price: item.price || 0,
      location: item.location || undefined,
      reason: 'context' as const,
    }));
  }

  // --- PATH B: No context → generic popular ---
  return fetchGenericPopular(userId);
};

/** Generic popular items (original logic, slightly simplified) */
const fetchGenericPopular = async (userId?: string): Promise<RecommendedItem[]> => {
  const items: RecommendedItem[] = [];

  let viewedTypes: string[] = [];
  if (userId) {
    const { data: historyData } = await supabase
      .from('view_history')
      .select('item_type')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(10);
    viewedTypes = [...new Set((historyData || []).map(h => h.item_type))];
  }

  const [listingsRes, eventsRes, waterRes] = await Promise.all([
    supabase
      .from('listings')
      .select('id, vertical, name_en, name_ru, cover_image, rating, price')
      .eq('is_active', true)
      .in('vertical', ['experience', 'yacht', 'restaurant'])
      .order('rating', { ascending: false })
      .limit(12),
    supabase
      .from('events')
      .select('id, title_en, title_ru, cover_image, rating, price, location_name')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(6),
    supabase
      .from('water_activities')
      .select('id, title_en, title_ru, cover_image, rating, price, location_name')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(6),
  ]);

  listingsRes.data?.forEach(l => items.push({
    id: l.id, item_type: l.vertical || 'listing',
    title_en: l.name_en, title_ru: l.name_ru || l.name_en,
    image: l.cover_image || DEFAULT_IMAGE, rating: l.rating || 0, price: l.price || 0,
    reason: viewedTypes.includes(l.vertical || '') ? 'history' : 'popular',
  }));

  eventsRes.data?.forEach(e => items.push({
    id: e.id, item_type: 'event',
    title_en: e.title_en, title_ru: e.title_ru,
    image: e.cover_image || DEFAULT_IMAGE, rating: e.rating || 0, price: e.price || 0,
    location: e.location_name || undefined,
    reason: viewedTypes.includes('event') ? 'history' : 'popular',
  }));

  waterRes.data?.forEach(w => items.push({
    id: w.id, item_type: 'water_activity',
    title_en: w.title_en, title_ru: w.title_ru,
    image: w.cover_image || DEFAULT_IMAGE, rating: w.rating || 0, price: w.price || 0,
    location: w.location_name || undefined,
    reason: viewedTypes.includes('water_activity') ? 'history' : 'popular',
  }));

  // Prioritize history items, then sort rest deterministically by rating
  const history = items.filter(i => i.reason === 'history');
  const rest = items.filter(i => i.reason !== 'history').sort((a, b) => b.rating - a.rating);
  return [...history, ...rest].slice(0, 12);
};

export function useRecommendations() {
  const { user } = useAuth();
  const { activeCode } = useLifeSituationContext();
  const role = useLifeOSRole();
  const { language } = useLanguage();
  const locale = language === 'ru' ? 'ru' : 'en';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recommendations', user?.id || 'anonymous', activeCode, role, locale],
    queryFn: () => fetchContextualRecommendations(activeCode, role, locale, user?.id),
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return {
    recommendations: data || [],
    isLoading,
    refetch,
    /** Whether results are contextual (LifeOS) or generic */
    isContextual: !!activeCode,
  };
}
