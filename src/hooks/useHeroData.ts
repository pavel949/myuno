/**
 * useHeroData — fetches all HeroBlock data in true parallel via Promise.all.
 * Replaces 3 separate useQuery calls in HeroBlock with 2 parallel requests:
 *   1. profiles + loyalty RPC (profile + tier in one concurrent batch)
 *   2. orders count (streak)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeroLoyaltyTier {
  name: string;
  icon: string;
  color: string;
  cashback: number;
}

export interface HeroData {
  firstName: string | null;
  loyaltyTier: HeroLoyaltyTier | null;
  activityStreak: number;
}

export function useHeroData(userId: string | undefined) {
  return useQuery<HeroData>({
    queryKey: ['hero-data', userId],
    queryFn: async (): Promise<HeroData> => {
      if (!userId) return { firstName: null, loyaltyTier: null, activityStreak: 0 };

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Run profile+loyalty and streak in true parallel
      const [profileResult, loyaltyResult, streakResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', userId)
          .maybeSingle(),
        supabase.rpc('get_or_create_loyalty_status', { p_user_id: userId }),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('customer_user_id', userId)
          .gte('created_at', thirtyDaysAgo.toISOString()),
      ]);

      const fullName = profileResult.data?.full_name ?? null;
      const firstName = fullName ? fullName.split(' ')[0] : null;

      let loyaltyTier: HeroLoyaltyTier | null = null;
      try {
        const parsed = loyaltyResult.data as any;
        if (parsed?.current_tier) {
          loyaltyTier = {
            name: parsed.current_tier.tier_name,
            icon: parsed.current_tier.icon,
            color: parsed.current_tier.color,
            cashback: parsed.current_tier.cashback_percent,
          };
        }
      } catch { /* loyalty is non-critical */ }

      const activityStreak = streakResult.count ?? 0;

      return { firstName, loyaltyTier, activityStreak };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
