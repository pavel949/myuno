import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useWishlist');

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export function useWishlist() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('marketplace_wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlist((data || []) as WishlistItem[]);
    } catch (err) {
      errorLog.silent(err, 'fetch_wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(item => item.product_id === productId);
  }, [wishlist]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to add to wishlist');
      return false;
    }

    try {
      const { error } = await supabase
        .from('marketplace_wishlist')
        .insert({ user_id: user.id, product_id: productId });

      if (error) throw error;
      
      await fetchWishlist();
      toast.success('Added to wishlist');
      return true;
    } catch (err) {
      errorLog.silent(err, 'add_to_wishlist');
      toast.error('Failed to add to wishlist');
      return false;
    }
  }, [user, fetchWishlist]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('marketplace_wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      
      await fetchWishlist();
      toast.success('Removed from wishlist');
      return true;
    } catch (err) {
      errorLog.silent(err, 'remove_from_wishlist');
      return false;
    }
  }, [user, fetchWishlist]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  return {
    wishlist,
    isLoading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    wishlistCount: wishlist.length
  };
}
