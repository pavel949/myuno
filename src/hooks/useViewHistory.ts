import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ViewHistoryItem {
  id: string;
  item_id: string;
  item_type: string;
  item_data: {
    name?: string;
    name_en?: string;
    name_ru?: string;
    image?: string;
    rating?: number;
    price?: number;
    location?: string;
  } | null;
  viewed_at: string;
  view_count: number;
}

export function useViewHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ViewHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('view_history')
        .select('*')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setHistory((data || []) as ViewHistoryItem[]);
    } catch (error) {
      console.error('Error fetching view history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    
    const loadHistory = async () => {
      if (!user) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('view_history')
          .select('*')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        
        if (isMounted) {
          setHistory((data || []) as ViewHistoryItem[]);
        }
      } catch (error) {
        console.error('Error fetching view history:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadHistory();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const trackView = useCallback(async (
    itemId: string,
    itemType: string,
    itemData?: ViewHistoryItem['item_data']
  ) => {
    if (!user) return;

    try {
      // Check if item already exists in history
      const { data: existing } = await supabase
        .from('view_history')
        .select('id, view_count')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();

      if (existing) {
        // Update existing entry
        await supabase
          .from('view_history')
          .update({
            viewed_at: new Date().toISOString(),
            view_count: existing.view_count + 1,
            item_data: itemData
          })
          .eq('id', existing.id);
      } else {
        // Insert new entry
        await supabase
          .from('view_history')
          .insert({
            user_id: user.id,
            item_id: itemId,
            item_type: itemType,
            item_data: itemData
          });
      }

      // Refresh history
      fetchHistory();
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [user, fetchHistory]);

  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('view_history')
        .delete()
        .eq('user_id', user.id);

      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [user]);

  const removeFromHistory = useCallback(async (itemId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('view_history')
        .delete()
        .eq('id', itemId);

      setHistory(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }, [user]);

  return {
    history,
    isLoading,
    trackView,
    clearHistory,
    removeFromHistory,
    refetch: fetchHistory
  };
}
