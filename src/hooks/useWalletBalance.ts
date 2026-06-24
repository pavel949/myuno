import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CACHE_PROFILES, queryKeys } from '@/lib/queryConfig';

/**
 * Read-only wallet balance for the current user.
 *
 * Mirrors the direct `wallets.select('balance')` read it replaces — it does NOT
 * create a wallet (unlike `useWallet`'s `get_or_create_wallet` RPC), so it has
 * no side effects and is safe to call from presentation components. Returns 0
 * when the user has no wallet row yet.
 */
export function useWalletBalance(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const enabled = (options?.enabled ?? true) && !!user;

  return useQuery({
    queryKey: queryKeys.user.wallet(user?.id ?? 'anon'),
    enabled,
    ...CACHE_PROFILES.DYNAMIC,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user!.id)
        .single();
      // PGRST116 = "no rows" — a user without a wallet simply has balance 0.
      if (error && error.code !== 'PGRST116') throw error;
      return data?.balance ?? 0;
    },
  });
}
