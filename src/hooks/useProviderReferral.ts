/**
 * useProviderReferral — provider-to-provider (B2B) referral overview.
 *
 * One RPC (`get_my_provider_referral_overview`) returns the current provider's
 * referral code, the commission discount they have earned, and the list of
 * providers they referred. The reward economics live server-side in
 * `provider_referral_settings`; the conversion event is provider verification
 * (see migration 20260625120000_provider_referral_program.sql).
 *
 * Doc: docs/canonical/research/no-budget-growth-playbook.md §7 (B2B track).
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderReferralEntry {
  provider_name: string | null;
  discount_percent: number;
  status: string;
  starts_at: string;
  expires_at: string;
}

export interface ProviderReferralOverview {
  code: string | null;
  is_provider: boolean;
  active_discount_percent: number;
  per_referral_discount_percent: number;
  discount_months: number;
  max_total_discount_percent: number;
  referred: ProviderReferralEntry[];
}

/** Minimal typed surface for an RPC that is not in the generated types yet. */
type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export function useProviderReferral() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['provider-referral-overview', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ProviderReferralOverview | null> => {
      const client = supabase as unknown as RpcClient;
      const { data, error } = await client.rpc('get_my_provider_referral_overview');
      if (error) throw new Error(error.message);
      if (!data || typeof data !== 'object') return null;
      return data as ProviderReferralOverview;
    },
  });

  const overview = query.data ?? null;

  const stats = useMemo(() => {
    const referred = overview?.referred ?? [];
    return {
      totalReferred: referred.length,
      activeReferred: referred.filter((r) => r.status === 'active').length,
      activeDiscount: overview?.active_discount_percent ?? 0,
    };
  }, [overview]);

  return {
    overview,
    stats,
    isProvider: overview?.is_provider ?? false,
    referralCode: overview?.code ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
