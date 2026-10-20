import { QueryClient, QueryObserver, type QueryObserverResult } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { useAdminDashboardSnapshots, useAdminPlatformStatus } from '@/hooks/useAdminDashboardEvidence';
import type { PlatformStatusItem, summarizeDashboardSnapshots } from '@/lib/adminDashboardEvidence';

interface EvidenceOptions { error?: Error; updatedAt?: number }
type SnapshotSummary = ReturnType<typeof summarizeDashboardSnapshots>;

/** Real TanStack discriminants/methods, derived from an offline synthetic cache. */
function cachedResult<T>(data: T, options: EvidenceOptions): QueryObserverResult<T, Error> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false, gcTime: Infinity } } });
  const queryKey = ['synthetic-evidence-result'];
  client.setQueryData<T>(queryKey, data, { updatedAt: options.updatedAt ?? 0 });
  if (options.error) {
    client.getQueryCache().find({ queryKey })?.setState({ status: 'error', error: options.error, errorUpdatedAt: Date.now() });
  }
  const observer = new QueryObserver<T, Error>(client, { queryKey, enabled: false });
  const result = observer.getCurrentResult();
  // A button click records a test call and resolves the same state; no queryFn,
  // subscription or fetch is installed by this factory.
  const refetch = vi.fn<typeof result.refetch>().mockResolvedValue(result);
  return { ...result, refetch };
}

export function dashboardSnapshotResult(
  data: SnapshotSummary = { coverage: 0, complete: false, gmv: null, platformRevenue: null, completedBookings: null },
  options: EvidenceOptions = {},
): ReturnType<typeof useAdminDashboardSnapshots> {
  return {
    ...cachedResult(data, options),
    period: { days: 7, from: '2026-10-13', through: '2026-10-19', dates: [] },
    checkingAccess: false,
  };
}

export function platformStatusResult(options: EvidenceOptions = {}): ReturnType<typeof useAdminPlatformStatus> {
  return cachedResult<PlatformStatusItem[]>([
    { key: 'stripe_mode', status: 'configured' },
    { key: 'admin_emails', status: 'unknown' },
    { key: 'verticals', status: 'unknown' },
  ], options);
}
