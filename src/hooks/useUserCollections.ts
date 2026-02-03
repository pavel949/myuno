/**
 * Unified user collections hook - replaces both useWishlist and useFavorites
 * Supports all item types: product, property, restaurant, tour, etc.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { FavoriteItemData } from '@/types/favorites';

export type CollectionItemType = 
  | 'product' 
  | 'property' 
  | 'restaurant' 
  | 'tour' 
  | 'experience'
  | 'babysitter'
  | 'pet_service'
  | 'salon'
  | 'clinic'
  | 'spa';

export interface CollectionItem {
  id: string;
  user_id: string;
  item_type: CollectionItemType;
  item_id: string;
  item_data: FavoriteItemData | null;
  created_at: string;
}

interface UseUserCollectionsOptions {
  itemType?: CollectionItemType;
  autoFetch?: boolean;
}

export function useUserCollections(options: UseUserCollectionsOptions = {}) {
  const { itemType, autoFetch = true } = options;
  const { user } = useAuth();
  const { language } = useLanguage();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setItems((data || []).map(item => ({
        ...item,
        item_type: item.item_type as CollectionItemType,
        item_data: item.item_data as FavoriteItemData | null
      })));
    } catch (error) {
      console.error('Error fetching user collections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, itemType]);

  useEffect(() => {
    if (autoFetch) {
      fetchItems();
    }
  }, [fetchItems, autoFetch]);

  // Check if item is in collection
  const isInCollection = useCallback((type: CollectionItemType, id: string): boolean => {
    return items.some(item => item.item_type === type && item.item_id === id);
  }, [items]);

  // Shorthand for products (backward compat with useWishlist)
  const isInWishlist = useCallback((productId: string): boolean => {
    return isInCollection('product', productId);
  }, [isInCollection]);

  // Add item to collection
  const addToCollection = useCallback(async (
    type: CollectionItemType, 
    id: string, 
    itemData?: FavoriteItemData
  ): Promise<boolean> => {
    if (!user) {
      toast.error(language === 'ru' ? 'Войдите, чтобы сохранить' : 'Sign in to save');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          item_type: type,
          item_id: id,
          item_data: itemData ? JSON.parse(JSON.stringify(itemData)) : null
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: CollectionItem = {
        ...data,
        item_type: data.item_type as CollectionItemType,
        item_data: data.item_data as FavoriteItemData | null
      };
      
      setItems(prev => [newItem, ...prev]);
      toast.success(language === 'ru' ? 'Добавлено в избранное' : 'Added to favorites');
      return true;
    } catch (error) {
      console.error('Error adding to collection:', error);
      toast.error(language === 'ru' ? 'Ошибка. Попробуйте снова' : 'Error. Please try again');
      return false;
    }
  }, [user, language]);

  // Remove item from collection
  const removeFromCollection = useCallback(async (
    type: CollectionItemType, 
    id: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', type)
        .eq('item_id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => !(item.item_type === type && item.item_id === id)));
      toast.success(language === 'ru' ? 'Удалено из избранного' : 'Removed from favorites');
      return true;
    } catch (error) {
      console.error('Error removing from collection:', error);
      return false;
    }
  }, [user, language]);

  // Toggle item in collection
  const toggleCollection = useCallback(async (
    type: CollectionItemType, 
    id: string, 
    itemData?: FavoriteItemData
  ): Promise<boolean> => {
    if (isInCollection(type, id)) {
      return removeFromCollection(type, id);
    } else {
      return addToCollection(type, id, itemData);
    }
  }, [isInCollection, addToCollection, removeFromCollection]);

  // Shorthand for products (backward compat with useWishlist)
  const toggleWishlist = useCallback(async (productId: string, itemData?: FavoriteItemData) => {
    return toggleCollection('product', productId, itemData);
  }, [toggleCollection]);

  // Get items by type
  const getItemsByType = useCallback((type: CollectionItemType): CollectionItem[] => {
    return items.filter(item => item.item_type === type);
  }, [items]);

  // Computed counts
  const counts = useMemo(() => ({
    total: items.length,
    products: items.filter(i => i.item_type === 'product').length,
    properties: items.filter(i => i.item_type === 'property').length,
    restaurants: items.filter(i => i.item_type === 'restaurant').length,
    tours: items.filter(i => i.item_type === 'tour').length,
  }), [items]);

  return {
    // Data
    items,
    isLoading,
    counts,
    
    // Generic methods
    isInCollection,
    addToCollection,
    removeFromCollection,
    toggleCollection,
    getItemsByType,
    refetch: fetchItems,

    // Backward compat with useWishlist
    wishlist: items.filter(i => i.item_type === 'product'),
    wishlistCount: counts.products,
    isInWishlist,
    toggleWishlist,
    addToWishlist: (id: string, data?: FavoriteItemData) => addToCollection('product', id, data),
    removeFromWishlist: (id: string) => removeFromCollection('product', id),

    // Backward compat with useFavorites
    favorites: items,
    loading: isLoading,
    isFavorite: isInCollection,
    toggleFavorite: toggleCollection,
  };
}

// Convenience hooks for specific item types
export function useProductWishlist() {
  return useUserCollections({ itemType: 'product' });
}

export function usePropertyFavorites() {
  return useUserCollections({ itemType: 'property' });
}

export function useRestaurantFavorites() {
  return useUserCollections({ itemType: 'restaurant' });
}
