import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LoyaltyTier {
  id: string;
  tier_name: string;
  tier_order: number;
  min_gmv_thb: number;
  cashback_percent: number;
  benefits: string[];
  icon: string;
  color: string;
}

export interface LoyaltyStatus {
  id: string;
  user_id: string;
  current_tier_id: string;
  total_gmv_thb: number;
  gmv_this_year: number;
  total_bookings: number;
  bookings_this_year: number;
  tier_updated_at: string | null;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_code: string;
  achieved_at: string;
  bonus_awarded: number;
}

export interface AchievementDefinition {
  id: string;
  code: string;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  icon: string;
  bonus_amount: number;
  category: string;
  sort_order: number;
}

export interface UserLoyaltyData {
  status: LoyaltyStatus;
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  achievements: Achievement[];
  allAchievements: AchievementDefinition[];
  progressToNextTier: number; // 0-100
  amountToNextTier: number;
}

export const useLoyalty = () => {
  const { user } = useAuth();
  const [data, setData] = useState<UserLoyaltyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLoyaltyData = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get or create loyalty status with tier info
      const { data: statusResult, error: statusError } = await supabase
        .rpc('get_or_create_loyalty_status', { p_user_id: user.id });

      if (statusError) throw statusError;

      // Handle the JSONB result properly - cast through unknown first
      const statusData = (typeof statusResult === 'object' && statusResult !== null && !Array.isArray(statusResult)
        ? statusResult as unknown
        : null) as {
        status: LoyaltyStatus;
        current_tier: LoyaltyTier;
        next_tier: LoyaltyTier | null;
      } | null;
      
      if (!statusData || !statusData.status || !statusData.current_tier) {
        throw new Error('Invalid loyalty status response');
      }

      // Get user achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (achievementsError) throw achievementsError;

      // Get all achievement definitions
      const { data: allAchievements, error: defsError } = await supabase
        .from('achievement_definitions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (defsError) throw defsError;

      // Calculate progress to next tier
      let progressToNextTier = 100;
      let amountToNextTier = 0;

      if (statusData.next_tier) {
        const currentGmv = Number(statusData.status.gmv_this_year) || 0;
        const currentThreshold = Number(statusData.current_tier.min_gmv_thb) || 0;
        const nextThreshold = Number(statusData.next_tier.min_gmv_thb);
        
        const range = nextThreshold - currentThreshold;
        const progress = currentGmv - currentThreshold;
        
        progressToNextTier = Math.min(100, Math.max(0, (progress / range) * 100));
        amountToNextTier = Math.max(0, nextThreshold - currentGmv);
      }

      // Parse benefits from JSON
      const parseBenefits = (benefits: unknown): string[] => {
        if (Array.isArray(benefits)) return benefits as string[];
        if (typeof benefits === 'string') {
          try { return JSON.parse(benefits); } catch { return []; }
        }
        return [];
      };

      if (!signal?.aborted) {
        setData({
          status: statusData.status,
          currentTier: {
            ...statusData.current_tier,
            benefits: parseBenefits(statusData.current_tier.benefits),
          },
          nextTier: statusData.next_tier ? {
            ...statusData.next_tier,
            benefits: parseBenefits(statusData.next_tier.benefits),
          } : null,
          achievements: (achievements || []) as Achievement[],
          allAchievements: (allAchievements || []) as AchievementDefinition[],
          progressToNextTier,
          amountToNextTier,
        });
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load loyalty data');
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    loadLoyaltyData(controller.signal);
    return () => controller.abort();
  }, [loadLoyaltyData]);

  const refetch = useCallback(() => {
    loadLoyaltyData();
  }, [loadLoyaltyData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    currentTier: data?.currentTier ?? null,
    nextTier: data?.nextTier ?? null,
    progressToNextTier: data?.progressToNextTier ?? 0,
    amountToNextTier: data?.amountToNextTier ?? 0,
    achievements: data?.achievements ?? [],
    allAchievements: data?.allAchievements ?? [],
    cashbackPercent: data?.currentTier?.cashback_percent ?? 5,
  };
};
