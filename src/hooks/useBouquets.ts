import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Bouquet {
  id: string;
  shop_id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string | null;
  image: string | null;
  images: string[] | null;
  price: number;
  currency: string | null;
  flowers: string[] | null;
  colors: string[] | null;
  size: string | null;
  is_popular: boolean | null;
  is_active: boolean | null;
  stock_quantity: number | null;
  created_at: string;
  // Joined data
  shop?: {
    id: string;
    name_en: string;
    name_ru: string;
    delivery_fee: number | null;
    min_order_amount: number | null;
    provider_id: string | null;
  };
}

interface UseBouquetsOptions {
  shopId?: string;
  category?: string;
  onlyActive?: boolean;
}

export function useBouquets(options: UseBouquetsOptions = {}) {
  const { shopId, category, onlyActive = true } = options;
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBouquets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('bouquets')
        .select(`
          *,
          shop:flower_shops!bouquets_shop_id_fkey (
            id,
            name_en,
            name_ru,
            delivery_fee,
            min_order_amount,
            provider_id
          )
        `)
        .order('is_popular', { ascending: false })
        .order('created_at', { ascending: false });

      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      if (shopId) {
        query = query.eq('shop_id', shopId);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBouquets((data as unknown as Bouquet[]) || []);
    } catch (err) {
      console.error('Error fetching bouquets:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch bouquets'));
      setBouquets([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, category, onlyActive]);

  useEffect(() => {
    fetchBouquets();
  }, [fetchBouquets]);

  return {
    bouquets,
    isLoading,
    error,
    refetch: fetchBouquets,
  };
}

export function useBouquet(id: string) {
  const [bouquet, setBouquet] = useState<Bouquet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchBouquet = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('bouquets')
          .select(`
            *,
            shop:flower_shops!bouquets_shop_id_fkey (
              id,
              name_en,
              name_ru,
              delivery_fee,
              min_order_amount,
              provider_id
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        setBouquet(data as unknown as Bouquet);
      } catch (err) {
        console.error('Error fetching bouquet:', err);
        setBouquet(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBouquet();
  }, [id]);

  return { bouquet, isLoading };
}
