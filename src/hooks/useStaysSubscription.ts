import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaysTier {
  id: string;
  code: string;
  name_en: string;
  name_ru: string;
  price_thb_monthly: number;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
}

export type PropertyStaysSubscription = {
  id: string;
  property_id: string;
  tier_code: string;
  status: string;
  created_at: string;
  stays_subscription_tiers?: StaysTier | null;
};

export function useStaysTiers() {
  return useQuery({
    queryKey: ['stays-subscription-tiers'],
    queryFn: async (): Promise<StaysTier[]> => {
      const { data, error } = await (supabase as any)
        .from('stays_subscription_tiers')
        .select('*')
        .order('price_thb_monthly', { ascending: true });
      if (error) throw error;
      return (data ?? []) as StaysTier[];
    },
    staleTime: 5 * 60_000,
  });
}

export function usePropertyStaysSubscription(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-stays-subscription', propertyId],
    queryFn: async (): Promise<PropertyStaysSubscription | null> => {
      if (!propertyId) return null;
      const { data, error } = await (supabase as any)
        .from('property_stays_subscriptions')
        .select('*, stays_subscription_tiers(*)')
        .eq('property_id', propertyId)
        .maybeSingle();
      if (error) throw error;
      return data as PropertyStaysSubscription | null;
    },
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

export function useStaysSubscribeCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { propertyId: string; tierCode: string }) => {
      const { data, error } = await supabase.functions.invoke('stays-subscribe', {
        body: { property_id: params.propertyId, tier_code: params.tierCode },
      });
      if (error) throw error;
      const payload = data as { url?: string; error?: string };
      if (payload?.error) throw new Error(payload.error);
      if (!payload?.url) throw new Error('No checkout URL returned');
      return payload.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-stays-subscription'] });
    },
  });
}
