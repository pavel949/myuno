import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AdminBouquet {
  id: string;
  shop_id: string;
  sku: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  composition_en: string | null;
  composition_ru: string | null;
  category: string | null;
  image: string | null;
  images: string[] | null;
  price: number;
  currency: string | null;
  flowers: string[] | null;
  colors: string[] | null;
  size: string | null;
  style: string | null;
  occasion_tags: string[] | null;
  color_palette: string | null;
  lifeos_tags: string[] | null;
  availability_note: string | null;
  preparation_time_minutes: number | null;
  is_popular: boolean | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  stock_quantity: number | null;
  created_at: string;
  shop?: {
    id: string;
    name_en: string;
    name_ru: string;
  };
}

export interface BouquetFormData {
  shop_id: string;
  sku: string;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  composition_en: string;
  composition_ru: string;
  category: string;
  image: string;
  images: string[];
  price: number;
  currency: string;
  flowers: string[];
  colors: string[];
  size: string;
  style: string;
  occasion_tags: string[];
  color_palette: string;
  lifeos_tags: string[];
  availability_note: string;
  preparation_time_minutes: number;
  is_popular: boolean;
  is_active: boolean;
  stock_quantity: number | null;
}

export function useAdminBouquets() {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminBouquet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bouquets')
        .select(`
          *,
          shop:flower_shops!bouquets_shop_id_fkey (
            id,
            name_en,
            name_ru
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data as unknown as AdminBouquet[]) || []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (data: Partial<BouquetFormData>) => {
    try {
      const { error } = await supabase
        .from('bouquets')
        .insert(data as any);

      if (error) throw error;
      await fetchItems();
    } catch (err) {
      throw err;
    }
  };

  const updateItem = async (data: { id: string } & Partial<BouquetFormData>) => {
    const { id, ...updates } = data;
    try {
      const { error } = await supabase
        .from('bouquets')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
      await fetchItems();
    } catch (err) {
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bouquets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchItems();
    } catch (err) {
      throw err;
    }
  };

  return {
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchItems,
  };
}
