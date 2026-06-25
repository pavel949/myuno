/**
 * useStripeLive — reads the platform Stripe mode from system_settings.
 * Mirrors the check in src/components/admin/GoLiveChecklist.tsx
 * (`system_settings.key = 'stripe_mode'`, value === 'live').
 *
 * Used to gate online-card payment options until live keys are configured —
 * while in test mode real cards fail, so the "Pay online" option is hidden.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStripeLive(): { isLive: boolean; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['system_settings', 'stripe_mode'],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'stripe_mode')
        .maybeSingle();
      if (error) throw error;
      return data?.value === 'live';
    },
    staleTime: 5 * 60_000,
  });

  return { isLive: data ?? false, isLoading };
}
