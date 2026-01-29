import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface FeaturedListing {
  id: string;
  entity_type: string;
  entity_id: string;
  provider_id: string;
  package_type: string;
  price_paid: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

async function fetchFeaturedListings(): Promise<FeaturedListing[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('featured_listings')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('price_paid', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useFeaturedCategories() {
  const query = useQuery({
    queryKey: ['featured-listings'],
    queryFn: fetchFeaturedListings,
    ...CACHE_PROFILES.DYNAMIC,
  });

  // Check if an entity is featured
  const isFeatured = (entityId: string, entityType?: string): boolean => {
    if (!query.data) return false;
    return query.data.some(
      f => f.entity_id === entityId && (!entityType || f.entity_type === entityType)
    );
  };

  // Get featured package type for an entity
  const getFeaturedPackage = (entityId: string): string | null => {
    if (!query.data) return null;
    const featured = query.data.find(f => f.entity_id === entityId);
    return featured?.package_type || null;
  };

  return {
    featuredListings: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    isFeatured,
    getFeaturedPackage,
    refetch: query.refetch,
  };
}
