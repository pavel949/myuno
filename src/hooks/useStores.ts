import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Store {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  phone: string | null;
  delivery_available: boolean;
  delivery_fee: number;
  min_order_amount: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  working_hours: Record<string, string>;
}

export function useStores(category?: string) {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      let query = supabase.from('stores').select('*').eq('is_active', true);
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (!error && data) setStores(data as Store[]);
      setIsLoading(false);
    };
    fetchStores();
  }, [category]);

  return { stores, isLoading };
}

export function useStore(id: string) {
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchStore = async () => {
      const { data, error } = await supabase.from('stores').select('*').eq('id', id).single();
      if (!error && data) setStore(data as Store);
      setIsLoading(false);
    };
    fetchStore();
  }, [id]);

  return { store, isLoading };
}
