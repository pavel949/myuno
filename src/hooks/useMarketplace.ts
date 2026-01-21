import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

// Hook for fetching categories
export function useMarketplaceCategories() {
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('marketplace_categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (queryError) throw queryError;
        setCategories(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}

// Hook for fetching products with filters
export function useMarketplaceProducts(options?: {
  category?: string;
  subcategory?: string;
  search?: string;
  popularOnly?: boolean;
  newOnly?: boolean;
  limit?: number;
}) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const stableOptions = useMemo(() => JSON.stringify(options), [options]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const opts = JSON.parse(stableOptions) || {};
        let query = supabase
          .from('marketplace_products')
          .select('*')
          .eq('in_stock', true)
          .order('sort_order', { ascending: true });

        if (opts.category) {
          query = query.eq('category_slug', opts.category);
        }
        if (opts.subcategory) {
          query = query.eq('subcategory', opts.subcategory);
        }
        if (opts.popularOnly) {
          query = query.eq('is_popular', true);
        }
        if (opts.newOnly) {
          query = query.eq('is_new', true);
        }
        if (opts.limit) {
          query = query.limit(opts.limit);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        let result = data || [];

        // Client-side search filter
        if (opts.search && opts.search.length >= 2) {
          const searchLower = opts.search.toLowerCase();
          result = result.filter((p: MarketplaceProduct) =>
            p.name_en.toLowerCase().includes(searchLower) ||
            p.name_ru.toLowerCase().includes(searchLower) ||
            p.description_en?.toLowerCase().includes(searchLower) ||
            p.description_ru?.toLowerCase().includes(searchLower) ||
            p.tags?.some(t => t.toLowerCase().includes(searchLower))
          );
        }

        setProducts(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [stableOptions]);

  return { products, isLoading, error };
}

// Hook for delivery settings
export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('marketplace_delivery_settings')
        .select('*')
        .order('is_default', { ascending: false });
      setSettings(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

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
