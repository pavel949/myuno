import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  price: number | null;
  currency: string;
  duration_minutes: number | null;
  images: string[] | null;
  category_id: string | null;
  provider_id: string;
  rating: number | null;
  review_count: number | null;
  languages: string[];
  provider?: {
    name: string;
    logo_url: string | null;
    is_verified: boolean;
    has_machine_translation?: boolean;
  };
  category?: {
    name_en: string;
    name_ru: string;
    slug: string;
  };
}

export interface Category {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string;
  icon: string | null;
  mini_app_type: string | null;
}

export type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

interface UseServicesOptions {
  categoryId?: string;
  searchQuery?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: SortOption;
  limit?: number;
}

function buildQuery(options: UseServicesOptions) {
  let query = supabase
    .from('services')
    .select(`
      *,
      provider:providers(name, logo_url, is_verified, has_machine_translation),
      category:categories(name_en, name_ru, slug)
    `)
    .eq('is_active', true);

  if (options.categoryId) query = query.eq('category_id', options.categoryId);
  if (options.searchQuery) query = query.or(`name_en.ilike.%${options.searchQuery}%,name_ru.ilike.%${options.searchQuery}%`);
  if (options.priceMin !== undefined) query = query.gte('price', options.priceMin);
  if (options.priceMax !== undefined) query = query.lte('price', options.priceMax);

  switch (options.sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  return query.limit(options.limit || 50);
}

export const useServices = (options: UseServicesOptions = {}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await buildQuery(options);
      if (queryError) throw queryError;
      setServices((data || []).map(s => ({ ...s, rating: null, review_count: null })) as Service[]);
    } catch (err) {
      console.error('Error loading services:', err);
      setError(err as Error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [options.categoryId, options.searchQuery, options.priceMin, options.priceMax, options.sortBy, options.limit]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isMounted) { setIsLoading(true); setError(null); }
      try {
        const { data, error: queryError } = await buildQuery(options);
        if (queryError) throw queryError;
        if (!isMounted) return;
        setServices((data || []).map(s => ({ ...s, rating: null, review_count: null })) as Service[]);
      } catch (err) {
        console.error('Error loading services:', err);
        if (isMounted) { setError(err as Error); setServices([]); }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [options.categoryId, options.searchQuery, options.priceMin, options.priceMax, options.sortBy, options.limit]);

  return { services, isLoading, error, refetch: loadServices };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadCategories = async () => {
      try {
        const { data: serviceCategories } = await supabase
          .from('services')
          .select('category_id')
          .eq('is_active', true);
        
        if (!isMounted) return;
        
        const categoryIds = [...new Set((serviceCategories || []).map(s => s.category_id).filter(Boolean))];
        
        if (categoryIds.length === 0) {
          const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .in('slug', ['beauty-spa', 'restaurants', 'fitness', 'medical', 'transport', 'services'])
            .order('sort_order');
          if (isMounted) setCategories(data || []);
        } else {
          const { data, error } = await supabase
            .from('categories')
            .select('id, name_en, name_ru, slug, icon, mini_app_type')
            .eq('is_active', true)
            .in('id', categoryIds)
            .order('sort_order');

          if (error) throw error;
          if (isMounted) setCategories(data || []);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCategories();
    return () => { isMounted = false; };
  }, []);

  return { categories, isLoading };
};
