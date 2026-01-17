import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Restaurant {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  cuisine: string;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  price_range: number;
  delivery_available: boolean;
  delivery_fee: number;
  delivery_time?: string;
  min_order_amount: number;
  working_hours?: Record<string, string>;
  features?: string[];
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ru: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  price: number;
  currency: string;
  image?: string;
  is_vegetarian: boolean;
  is_spicy: boolean;
  is_popular: boolean;
  is_active: boolean;
  calories?: number;
  prep_time_minutes?: number;
}

interface UseRestaurantsOptions {
  cuisine?: string;
  district?: string;
  searchQuery?: string;
  featured?: boolean;
  deliveryOnly?: boolean;
  limit?: number;
}

export function useRestaurants(options: UseRestaurantsOptions = {}) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true);

      if (options.cuisine && options.cuisine !== 'all') {
        query = query.eq('cuisine', options.cuisine);
      }
      if (options.district && options.district !== 'all') {
        query = query.eq('district', options.district);
      }
      if (options.searchQuery) {
        query = query.or(`name_en.ilike.%${options.searchQuery}%,name_ru.ilike.%${options.searchQuery}%`);
      }
      if (options.featured) {
        query = query.eq('is_featured', true);
      }
      if (options.deliveryOnly) {
        query = query.eq('delivery_available', true);
      }

      query = query.order('rating', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setRestaurants((data || []) as Restaurant[]);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options.cuisine, options.district, options.searchQuery, options.featured, options.deliveryOnly, options.limit]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return { restaurants, isLoading, error, refetch: fetchRestaurants };
}

export function useRestaurant(id: string | undefined) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!id) {
      setRestaurant(null);
      setIsLoading(false);
      return;
    }

    const fetchRestaurant = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id)
          .single();

        if (restaurantError) throw restaurantError;
        if (!isMounted) return;
        setRestaurant(restaurantData as Restaurant);

        // Fetch menu categories
        const { data: categoriesData } = await supabase
          .from('restaurant_menu_categories')
          .select('*')
          .eq('restaurant_id', id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!isMounted) return;
        setMenuCategories((categoriesData || []) as MenuCategory[]);

        // Fetch menu items
        const { data: itemsData } = await supabase
          .from('restaurant_menu_items')
          .select('*')
          .eq('restaurant_id', id)
          .eq('is_active', true)
          .order('is_popular', { ascending: false });

        if (!isMounted) return;
        setMenuItems((itemsData || []) as MenuItem[]);
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRestaurant();
    
    return () => { isMounted = false; };
  }, [id]);

  return { restaurant, menuCategories, menuItems, isLoading, error };
}
