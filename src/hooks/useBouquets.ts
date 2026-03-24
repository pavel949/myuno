import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BouquetWithShop, SizeVariant } from '@/types/bouquet';

// Re-export types for backward compatibility
export type { SizeVariant } from '@/types/bouquet';
export type Bouquet = BouquetWithShop;

interface UseBouquetsOptions {
  shopId?: string;
  category?: string;
  onlyActive?: boolean;
}

async function fetchBouquets(options: UseBouquetsOptions): Promise<Bouquet[]> {
  const { shopId, category, onlyActive = true } = options;
  
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
    .order('bestseller_rank', { ascending: true, nullsFirst: false })
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

  const { data, error } = await query;

  if (error) throw error;

  return (data as unknown as Bouquet[]) || [];
}

export function useBouquets(options: UseBouquetsOptions = {}) {
  const { shopId, category, onlyActive = true } = options;

  const { 
    data: bouquets = [] as Bouquet[], 
    isLoading, 
    error,
    refetch 
  } = useQuery<Bouquet[], Error>({
    queryKey: ['bouquets', shopId, category, onlyActive],
    queryFn: () => fetchBouquets({ shopId, category, onlyActive }),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    bouquets,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  };
}

async function fetchBouquet(id: string): Promise<Bouquet | null> {
  if (!id) return null;
  
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
  return data as unknown as Bouquet;
}

export function useBouquet(id: string) {
  const { data: bouquet, isLoading } = useQuery<Bouquet | null, Error>({
    queryKey: ['bouquet', id],
    queryFn: () => fetchBouquet(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  return { bouquet: bouquet ?? null, isLoading };
}
