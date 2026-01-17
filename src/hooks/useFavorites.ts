import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface FavoriteItem {
  id: string;
  item_type: string;
  item_id: string;
  item_data: any;
  created_at: string;
}

export function useFavorites(itemType?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
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
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user, itemType]);
  
  // External refetch function (for manual refresh)

  useEffect(() => {
    let isMounted = true;
    
    const loadFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }

      setLoading(true);
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
        if (isMounted) {
          setFavorites(data || []);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFavorites();
    
    return () => {
      isMounted = false;
    };
  }, [user, itemType]);

  const isFavorite = useCallback((type: string, id: string): boolean => {
    return favorites.some(f => f.item_type === type && f.item_id === id);
  }, [favorites]);

  const toggleFavorite = useCallback(async (type: string, id: string, itemData?: any) => {
    if (!user) {
      toast.error(language === 'ru' ? 'Войдите, чтобы добавить в избранное' : 'Login to add favorites');
      return false;
    }

    const isCurrentlyFavorite = isFavorite(type, id);

    try {
      if (isCurrentlyFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', type)
          .eq('item_id', id);

        if (error) throw error;

        setFavorites(prev => prev.filter(f => !(f.item_type === type && f.item_id === id)));
        toast.success(language === 'ru' ? 'Удалено из избранного' : 'Removed from favorites');
      } else {
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_type: type,
            item_id: id,
            item_data: itemData || null
          })
          .select()
          .single();

        if (error) throw error;

        setFavorites(prev => [data, ...prev]);
        toast.success(language === 'ru' ? 'Добавлено в избранное' : 'Added to favorites');
      }

      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(language === 'ru' ? 'Ошибка. Попробуйте снова' : 'Error. Please try again');
      return false;
    }
  }, [user, isFavorite, language]);

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
}
