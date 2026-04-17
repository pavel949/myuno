import { useMemo, useCallback, useState, useEffect } from 'react';
import { useSupabaseQuery, useSupabaseSingle, QueryFilter } from './useSupabaseQuery';
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

const RESTAURANT_LIST_COLUMNS = '*';

const MENU_CATEGORY_COLUMNS = 'id, restaurant_id, name_en, name_ru, sort_order, is_active';
const MENU_ITEM_COLUMNS = `
  id, restaurant_id, category_id, name_en, name_ru,
  description_en, description_ru, price, currency, image,
  is_vegetarian, is_spicy, is_popular, is_active, calories, prep_time_minutes
`;

export function useRestaurants(options: UseRestaurantsOptions = {}) {
  const filters = useMemo((): QueryFilter[] => {
    const result: QueryFilter[] = [{ column: 'is_active', value: true }];
    
    if (options.cuisine && options.cuisine !== 'all') {
      result.push({ column: 'cuisine', value: options.cuisine });
    }
    if (options.district && options.district !== 'all') {
      result.push({ column: 'district', value: options.district });
    }
    if (options.featured) {
      result.push({ column: 'is_featured', value: true });
    }
    if (options.deliveryOnly) {
      result.push({ column: 'delivery_available', value: true });
    }
    if (options.searchQuery) {
      result.push({
        column: '',
        value: `name_en.ilike.%${options.searchQuery}%,name_ru.ilike.%${options.searchQuery}%`,
        operator: 'or',
      });
    }
    
    return result;
  }, [options.cuisine, options.district, options.searchQuery, options.featured, options.deliveryOnly]);

  const { data, isLoading, error, refetch } = useSupabaseQuery<Restaurant>({
    table: 'restaurants',
    select: RESTAURANT_LIST_COLUMNS,
    filters,
    orderBy: { column: 'rating', ascending: false },
    limit: options.limit,
  });

  return { restaurants: data, isLoading, error, refetch };
}

export function useRestaurant(id: string | undefined) {
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const transform = useCallback((data: unknown) => data as Restaurant, []);
  
  const { data: restaurant, isLoading: restaurantLoading, error } = useSupabaseSingle<Restaurant>({
    table: 'restaurants',
    id,
    transform,
  });

  // Fetch menu data when restaurant is loaded
  useEffect(() => {
    let isMounted = true;
    
    if (!id) return;

    const fetchMenuData = async () => {
      setMenuLoading(true);
      try {
        const [categoriesResult, itemsResult] = await Promise.all([
          supabase
            .from('restaurant_menu_categories')
            .select(MENU_CATEGORY_COLUMNS)
            .eq('restaurant_id', id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('restaurant_menu_items')
            .select(MENU_ITEM_COLUMNS)
            .eq('restaurant_id', id)
            .eq('is_active', true)
            .order('is_popular', { ascending: false }),
        ]);

        if (isMounted) {
          setMenuCategories((categoriesResult.data || []) as MenuCategory[]);
          setMenuItems((itemsResult.data || []) as MenuItem[]);
        }
      } catch (err) {
        console.error('Error fetching menu data:', err);
      } finally {
        if (isMounted) setMenuLoading(false);
      }
    };

    fetchMenuData();
    return () => { isMounted = false; };
  }, [id]);

  return { 
    restaurant, 
    menuCategories, 
    menuItems, 
    isLoading: restaurantLoading || menuLoading, 
    error 
  };
}
