import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { configurationStatus, dashboardSnapshotPeriod, summarizeDashboardSnapshots, verticalConfigurationStatus, type PlatformStatusItem } from '@/lib/adminDashboardEvidence';

export function useAdminDashboardSnapshots(days: number) {
  const { user } = useAuth();
  const { isAdmin, isLoading: checkingAccess } = useAdminCheck();
  const period = dashboardSnapshotPeriod(days);
  const query = useQuery({
    queryKey: ['admin-dashboard', 'snapshots', user?.id, period.from, period.through],
    enabled: !!user && isAdmin && !checkingAccess,
    queryFn: async () => {
      const { data, error } = await supabase.from('platform_metrics')
        .select('date,gmv,platform_revenue,completed_bookings')
        .gte('date', period.from).lte('date', period.through).order('date');
      if (error) throw error;
      if (!data) throw new Error('Snapshot response unavailable');
      return summarizeDashboardSnapshots(data, period.dates);
    },
    ...CACHE_PROFILES.ADMIN,
  });
  return { ...query, period, checkingAccess };
}

export async function readAdminPlatformStatus(now = new Date()): Promise<PlatformStatusItem[]> {
  const settings = async (key: string, kind: 'stripe' | 'email' | 'whatsapp'): Promise<PlatformStatusItem> => {
    const { data, error } = await supabase.from('system_settings').select('value').eq('key', key).maybeSingle();
    return { key, status: error ? 'unknown' : configurationStatus(data?.value, kind) };
  };
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const results = await Promise.allSettled([
    settings('stripe_mode', 'stripe'), settings('admin_emails', 'email'), settings('admin_whatsapp', 'whatsapp'),
    (async (): Promise<PlatformStatusItem> => {
      const { count, error } = await supabase.from('reconciliation_alerts').select('id', { count: 'exact', head: true })
        .is('resolved_at', null).gte('created_at', cutoff).lte('created_at', now.toISOString());
      return { key: 'reconciliation', status: error || typeof count !== 'number' || !Number.isFinite(count) ? 'unknown' : count === 0 ? 'verified' : 'needs_review' };
    })(),
    (async (): Promise<PlatformStatusItem> => {
      const { data, error } = await supabase.from('system_settings').select('value').like('key', 'feature_flag:vertical_%');
      return { key: 'verticals', status: error ? 'unknown' : verticalConfigurationStatus(data) };
    })(),
  ]);
  const keys = ['stripe_mode', 'admin_emails', 'admin_whatsapp', 'reconciliation', 'verticals'];
  return results.map((result, index) => result.status === 'fulfilled' ? result.value : { key: keys[index], status: 'unknown' });
}

export function useAdminPlatformStatus() {
  const { user } = useAuth();
  const { isAdmin, isLoading: checkingAccess } = useAdminCheck();
  return useQuery({
    queryKey: ['admin-dashboard', 'health', user?.id],
    enabled: !!user && isAdmin && !checkingAccess,
    queryFn: () => readAdminPlatformStatus(),
    ...CACHE_PROFILES.ADMIN,
  });
}
