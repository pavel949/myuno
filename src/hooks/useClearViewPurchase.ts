/**
 * useClearViewPurchase — checks whether the current user has paid access
 * to a project's full ClearView report and provides a checkout trigger.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStripeUnifiedCheckout } from '@/hooks/useStripeUnifiedCheckout';

export type ClearViewTier = 'single' | 'bundle3';

export function useClearViewAccess(projectId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['clearview-access', projectId, user?.id],
    enabled: !!projectId,
    queryFn: async (): Promise<{ hasAccess: boolean; validUntil?: string | null }> => {
      if (!projectId) return { hasAccess: false };
      // Public/anon users never have paid access
      if (!user?.id) return { hasAccess: false };

      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('clearview_purchases' as any)
        .select('valid_until')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .gt('valid_until', new Date().toISOString())
        .order('valid_until', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return { hasAccess: false };
      if (!data) return { hasAccess: false };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { hasAccess: true, validUntil: (data as any).valid_until };
    },
    staleTime: 60_000,
  });
}

export function useClearViewCheckout() {
  const { createCheckout, isProcessing } = useStripeUnifiedCheckout();

  const purchase = async (params: { projectId: string; tier: ClearViewTier }) =>
    createCheckout('create-clearview-checkout', params, { requireAuth: true });

  return { purchase, isProcessing };
}
