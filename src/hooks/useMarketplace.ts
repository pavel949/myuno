import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface MarketplaceCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  icon: string | null;
  image_url: string | null;
  gradient: string | null;
  sort_order: number;
  is_active: boolean;
  category_group: string | null;
}

export interface MarketplaceSubcategory {
  id: string;
  category_slug: string;
  slug: string;
  name_en: string;
  name_ru: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MarketplaceProduct {
  id: string;
  category_slug: string;
  subcategory: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  unit: string;
  unit_ru: string;
  cover_image: string | null;
  images: string[] | null;
  in_stock: boolean;
  is_popular: boolean;
  is_new: boolean;
  is_active: boolean;
  rating: number | null;
  review_count: number;
  vendor_name: string | null;
  vendor_name_ru: string | null;
  tags: string[] | null;
  sort_order: number;
  is_shippable_international: boolean;
  weight_kg: number;
  unit_value: number | null;
  unit_measure: string | null;
  pack_quantity: number | null;
}

export interface DeliverySetting {
  id: string;
  zone_name_en: string;
  zone_name_ru: string;
  base_fee: number;
  free_delivery_threshold: number | null;
  min_order_amount: number;
  estimated_time_minutes: number;
  is_default: boolean;
  is_active: boolean;
}

// Centralized query keys
const MARKETPLACE_KEYS = {
  categories: ['marketplace-categories'] as const,
  subcategories: (categorySlug?: string) => ['marketplace-subcategories', categorySlug] as const,
  products: (options: ProductOptions) => ['marketplace-products', options] as const,
  allProducts: ['marketplace-products', 'all-in-stock'] as const,
  deliverySettings: ['marketplace-delivery-settings'] as const,
};

// Fetch functions
const fetchCategories = async (): Promise<MarketplaceCategory[]> => {
  const { data, error } = await supabase
    .from('marketplace_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

const fetchSubcategories = async (categorySlug?: string): Promise<MarketplaceSubcategory[]> => {
  let query = supabase
    .from('marketplace_subcategories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (categorySlug) {
    query = query.eq('category_slug', categorySlug);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as MarketplaceSubcategory[];
};

const fetchAllProducts = async (): Promise<MarketplaceProduct[]> => {
  const { data, error } = await supabase
    .from('marketplace_products')
    .select('*')
    .eq('in_stock', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

const fetchDeliverySettings = async (): Promise<DeliverySetting[]> => {
  const { data, error } = await supabase
    .from('marketplace_delivery_settings')
    .select('*')
    .order('is_default', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Hook for fetching categories
export function useMarketplaceCategories() {
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: MARKETPLACE_KEYS.categories,
    queryFn: fetchCategories,
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { categories, isLoading, error: error as Error | null };
}

// Hook for fetching subcategories
export function useMarketplaceSubcategories(categorySlug?: string) {
  const { data: subcategories = [], isLoading, error } = useQuery({
    queryKey: MARKETPLACE_KEYS.subcategories(categorySlug),
    queryFn: () => fetchSubcategories(categorySlug),
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { subcategories, isLoading, error: error as Error | null };
}

interface ProductOptions {
  category?: string;
  subcategory?: string;
  search?: string;
  popularOnly?: boolean;
  newOnly?: boolean;
  dealsOnly?: boolean;
  limit?: number;
}

/**
 * Optimized products hook that fetches all products once and filters client-side
 * This reduces API calls significantly on the home page
 */
export function useMarketplaceProducts(options: ProductOptions = {}) {
  // Fetch all products with shared cache
  const { data: allProducts = [], isLoading, error } = useQuery({
    queryKey: MARKETPLACE_KEYS.allProducts,
    queryFn: fetchAllProducts,
    ...CACHE_PROFILES.DYNAMIC,
  });

  // Client-side filtering using memoization
  const products = useMemo(() => {
    let result = [...allProducts];

    if (options.category) {
      result = result.filter(p => p.category_slug === options.category);
    }
    if (options.subcategory) {
      result = result.filter(p => p.subcategory === options.subcategory);
    }
    if (options.popularOnly) {
      result = result.filter(p => p.is_popular);
    }
    if (options.newOnly) {
      result = result.filter(p => p.is_new);
    }
    if (options.dealsOnly) {
      result = result.filter(p => p.original_price && p.original_price > p.price);
    }
    if (options.search && options.search.length >= 2) {
      const searchLower = options.search.toLowerCase();
      result = result.filter(p =>
        p.name_en.toLowerCase().includes(searchLower) ||
        p.name_ru.toLowerCase().includes(searchLower) ||
        p.description_en?.toLowerCase().includes(searchLower) ||
        p.description_ru?.toLowerCase().includes(searchLower) ||
        p.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }, [allProducts, options.category, options.subcategory, options.popularOnly, options.newOnly, options.dealsOnly, options.search, options.limit]);

  return { products, isLoading, error: error as Error | null };
}

// Hook for delivery settings
export function useDeliverySettings() {
  const { data: settings = [], isLoading } = useQuery({
    queryKey: MARKETPLACE_KEYS.deliverySettings,
    queryFn: fetchDeliverySettings,
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  const defaultZone = settings.find(s => s.is_default) || settings[0];

  const calculateDeliveryFee = (subtotal: number): number => {
    if (!defaultZone) return 100;
    if (defaultZone.free_delivery_threshold && subtotal >= defaultZone.free_delivery_threshold) {
      return 0;
    }
    return defaultZone.base_fee;
  };

  const freeDeliveryThreshold = defaultZone?.free_delivery_threshold || 1500;
  const amountToFreeDelivery = (subtotal: number) => Math.max(0, freeDeliveryThreshold - subtotal);

  return { 
    settings, 
    defaultZone, 
    calculateDeliveryFee, 
    freeDeliveryThreshold,
    amountToFreeDelivery,
    isLoading 
  };
}
