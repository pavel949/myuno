import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { untypedTables } from '@/lib/untypedTables';
import { toast } from 'sonner';

export interface PromotedListing {
  id: string;
  listing_id: string;
  listing_type: string;
  user_id: string;
  promotion_type: string;
  starts_at: string;
  expires_at: string;
  amount_paid: number;
  currency: string;
  status: string;
  created_at: string;
}

const PROMO_PRICES: Record<string, number> = {
  '7': 500,
  '14': 900,
  '30': 1500,
};

export function getPromoPrice(days: string) {
  return PROMO_PRICES[days] || 500;
}

export function usePromotedListings() {
  const { user } = useAuth();

  const myPromotions = useQuery({
    queryKey: ['my-promoted-listings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await untypedTables.promotedListings()
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PromotedListing[];
    },
  });

  return { myPromotions };
}

export function useActivePromotions(listingType: string) {
  return useQuery({
    queryKey: ['active-promotions', listingType],
    queryFn: async () => {
      const { data, error } = await untypedTables.promotedListings()
        .select('listing_id')
        .eq('listing_type', listingType)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());
      if (error) throw error;
      return new Set((data || []).map((d: any) => d.listing_id));
    },
    staleTime: 60_000,
  });
}

export function usePromoteListing() {
  const { user } = useAuth();
  const { payFromWallet } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      listingId, listingType, days 
    }: { 
      listingId: string; listingType: string; days: string 
    }) => {
      if (!user) throw new Error('Not authenticated');
      const price = getPromoPrice(days);

      const payResult = await payFromWallet(
        price,
        `Promoted listing (${days} days)`,
        `Продвижение объекта (${days} дней)`,
        'promoted_listing',
        listingId
      );

      if (!payResult.success) {
        throw new Error(payResult.error || 'Payment failed');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(days));

      const { error } = await untypedTables.promotedListings().insert({
        listing_id: listingId,
        listing_type: listingType,
        user_id: user.id,
        promotion_type: 'featured',
        expires_at: expiresAt.toISOString(),
        amount_paid: price,
        currency: 'THB',
        status: 'active',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-promoted-listings'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
    },
  });
}

export function useAdminPromotions() {
  return useQuery({
    queryKey: ['admin-all-promotions'],
    queryFn: async () => {
      const { data, error } = await untypedTables.promotedListings()
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as PromotedListing[];
    },
  });
}
