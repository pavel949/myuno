import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceProduct, MarketplaceCategory } from '@/types/marketplace';
import { CACHE_PROFILES } from '@/lib/queryConfig';

interface MarketIndexData {
  allProducts: MarketplaceProduct[];
  popularProducts: MarketplaceProduct[];
  newProducts: MarketplaceProduct[];
  categories: MarketplaceCategory[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Optimized hook for MarketIndex page
 * Fetches all products in a single request, then derives popular/new from that data
 * Reduces 4 separate API calls to 2 parallel calls
 */
export function useMarketIndexData(): MarketIndexData {
  // Fetch all in-stock products in one request
  const productsQuery = useQuery({
    queryKey: ['marketplace-products', 'all-in-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('in_stock', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as MarketplaceProduct[];
    },
    ...CACHE_PROFILES.DYNAMIC,
  });

  // Fetch categories in parallel
  const categoriesQuery = useQuery({
    queryKey: ['marketplace-categories', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as MarketplaceCategory[];
    },
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  // Derive filtered lists from all products (no additional API calls)
  const allProducts = productsQuery.data || [];
  
  // Filter popular products client-side (instead of separate API call)
  const popularProducts = allProducts.filter(p => p.is_popular).slice(0, 20);
  
  // Filter new products client-side (instead of separate API call)
  const newProducts = allProducts.filter(p => p.is_new).slice(0, 12);

  const isLoading = productsQuery.isLoading || categoriesQuery.isLoading;
  const error = productsQuery.error || categoriesQuery.error;

  return {
    allProducts,
    popularProducts,
    newProducts,
    categories: categoriesQuery.data || [],
    isLoading,
    error: error as Error | null,
  };
}
