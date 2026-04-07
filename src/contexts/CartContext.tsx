/**
 * @module CartContext
 * @description Shopping cart with dual storage strategy.
 *
 * - Guest users: cart stored in localStorage (`myuno-cart` key)
 * - Authenticated users: cart synced to `cart_items` table in DB
 * - On login: local cart merges into DB, then localStorage is cleared
 *
 * Supports multiple item types: food, flowers, service, product, tour, activity, yacht.
 *
 * Usage: `const { items, addItem, getTotal } = useCart();`
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('CartContext');

export interface CartItem {
  id: string;
  type: 'food' | 'flowers' | 'service' | 'product' | 'tour' | 'activity' | 'yacht';
  name: string;
  nameRu?: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  providerId?: string;
  providerName?: string;
  providerNameRu?: string;
  options?: Record<string, string>;
  // Booking-specific fields for tours, yachts, activities
  scheduledDate?: string;
  scheduledTime?: string;
  participants?: number;
  charterType?: 'half_day' | 'full_day' | 'sunset' | 'overnight';
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearByType: (type: CartItem['type']) => void;
  clearByProvider: (providerId: string) => void;
  getItemCount: () => number;
  getTotal: () => number;
  getItemsByType: (type: CartItem['type']) => CartItem[];
  getItemsByProvider: (providerId: string) => CartItem[];
  getProviderIds: () => string[];
  hasMultipleProviders: () => boolean;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'myuno-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load cart from localStorage for guests
  const loadLocalCart = useCallback(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save cart to localStorage for guests
  const saveLocalCart = useCallback((cartItems: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, []);

  // Load cart from database for authenticated users
  const loadDatabaseCart = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((item): CartItem => ({
        id: item.item_id,
        type: item.item_type as CartItem['type'],
        name: item.name,
        nameRu: item.name_ru || undefined,
        price: Number(item.price),
        currency: item.currency,
        quantity: item.quantity,
        image: item.image || undefined,
        providerId: item.provider_id || undefined,
        providerName: item.provider_name || undefined,
        providerNameRu: item.provider_name_ru || undefined,
        options: item.options as Record<string, string> | undefined,
      }));
    } catch (error) {
      errorLog.silent(error, 'load_database_cart');
      return [];
    }
  }, [user]);

  // Sync local cart to database when user logs in
  const syncLocalCartToDatabase = useCallback(async (localItems: CartItem[]): Promise<boolean> => {
    if (!user || localItems.length === 0) return true;

    try {
      const rows = localItems.map(item => ({
        user_id: user.id,
        item_id: item.id,
        item_type: item.type,
        name: item.name,
        name_ru: item.nameRu,
        price: item.price,
        currency: item.currency,
        quantity: item.quantity,
        image: item.image,
        provider_id: item.providerId,
        provider_name: item.providerName,
        provider_name_ru: item.providerNameRu,
        options: item.options,
      }));

      // Upsert all items in a single batch call to avoid race conditions
      const { error } = await supabase.from('cart_items').upsert(rows, {
        onConflict: 'user_id,item_id',
      });

      if (error) throw error;

      // Clear local storage only after successful sync
      localStorage.removeItem(CART_STORAGE_KEY);
      return true;
    } catch (error) {
      errorLog.error(error, 'sync_cart_to_database');
      return false;
    }
  }, [user]);

  // Initialize cart based on auth state
  useEffect(() => {
    let isMounted = true;
    
    const initializeCart = async () => {
      if (isMounted) setIsLoading(true);
      
      if (user) {
        // User is logged in - load from database
        const localItems = loadLocalCart();

        if (!isMounted) return;

        // If there are local items, sync them to database first
        if (localItems.length > 0) {
          setIsSyncing(true);
          const syncOk = await syncLocalCartToDatabase(localItems);
          if (!isMounted) return;
          setIsSyncing(false);

          if (!syncOk) {
            // Sync failed — use local items as fallback so nothing is lost
            setItems(localItems);
          } else {
            // Reload from database after confirmed sync
            const updatedItems = await loadDatabaseCart();
            if (isMounted) setItems(updatedItems);
          }
        } else {
          const dbItems = await loadDatabaseCart();
          if (isMounted) setItems(dbItems);
        }
      } else {
        // Guest user - load from localStorage
        if (isMounted) setItems(loadLocalCart());
      }
      
      if (isMounted) setIsLoading(false);
    };

    initializeCart();
    return () => { isMounted = false; };
  }, [user, loadLocalCart, loadDatabaseCart, syncLocalCartToDatabase]);

  // Save to localStorage for guests when items change
  useEffect(() => {
    if (!user && !isLoading) {
      saveLocalCart(items);
    }
  }, [items, user, isLoading, saveLocalCart]);

  const addItem = async (newItem: Omit<CartItem, 'quantity'>) => {
    const existingItem = items.find(item => item.id === newItem.id);
    
    // Optimistic update
    const previousItems = [...items];
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === newItem.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return updated;
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });

    if (user) {
      try {
        if (existingItem) {
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + 1 })
            .eq('user_id', user.id)
            .eq('item_id', newItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('cart_items').insert({
            user_id: user.id,
            item_id: newItem.id,
            item_type: newItem.type,
            name: newItem.name,
            name_ru: newItem.nameRu,
            price: newItem.price,
            currency: newItem.currency,
            quantity: 1,
            image: newItem.image,
            provider_id: newItem.providerId,
            provider_name: newItem.providerName,
            provider_name_ru: newItem.providerNameRu,
            options: newItem.options,
          });
          if (error) throw error;
        }
      } catch (error) {
        // Rollback on failure
        setItems(previousItems);
        errorLog.silent(error, 'add_item_to_cart');
      }
    }
  };

  const removeItem = async (id: string) => {
    const previousItems = [...items];
    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== id));

    if (user) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', id);
        if (error) throw error;
      } catch (error) {
        // Rollback on failure
        setItems(previousItems);
        errorLog.silent(error, 'remove_item_from_cart');
      }
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    const previousItems = [...items];
    // Optimistic update
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));

    if (user) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('item_id', id);
        if (error) throw error;
      } catch (error) {
        // Rollback on failure
        setItems(previousItems);
        errorLog.silent(error, 'update_item_quantity');
      }
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        errorLog.silent(error, 'clear_cart');
      }
    }

    setItems([]);
  };

  const clearByType = async (type: CartItem['type']) => {
    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', type);
      } catch (error) {
        errorLog.silent(error, 'clear_cart_by_type');
      }
    }

    setItems(prev => prev.filter(item => item.type !== type));
  };

  const clearByProvider = async (providerId: string) => {
    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('provider_id', providerId);
      } catch (error) {
        errorLog.silent(error, 'clear_cart_by_provider');
      }
    }

    setItems(prev => prev.filter(item => item.providerId !== providerId));
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getItemsByType = useCallback((type: CartItem['type']) => {
    return items.filter(item => item.type === type);
  }, [items]);

  const getItemsByProvider = useCallback((providerId: string) => {
    return items.filter(item => item.providerId === providerId);
  }, [items]);

  const getProviderIds = useCallback(() => {
    const providerIds = new Set<string>();
    items.forEach(item => {
      if (item.providerId) providerIds.add(item.providerId);
    });
    return Array.from(providerIds);
  }, [items]);

  const hasMultipleProviders = useCallback(() => {
    return getProviderIds().length > 1;
  }, [getProviderIds]);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      clearByType,
      clearByProvider,
      getItemCount,
      getTotal,
      getItemsByType,
      getItemsByProvider,
      getProviderIds,
      hasMultipleProviders,
      isLoading,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
