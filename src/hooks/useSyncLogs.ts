import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SyncLog {
  id: string;
  calendar_id: string;
  property_id: string;
  owner_id: string;
  synced_at: string;
  events_found: number;
  events_added: number;
  events_updated: number;
  events_removed: number;
  sync_duration_ms: number | null;
  sync_type: string;
  error: string | null;
  created_at: string;
}

export function useSyncLogs(options?: {
  calendarId?: string;
  propertyId?: string;
  limit?: number;
  days?: number;
}) {
  const { user } = useAuth();
  const { calendarId, propertyId, limit = 50, days = 7 } = options || {};

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['sync-logs', user?.id, calendarId, propertyId, limit, days],
    queryFn: async () => {
      if (!user?.id) return [];

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let query = supabase
        .from('calendar_sync_logs')
        .select('*')
        .eq('owner_id', user.id)
        .gte('synced_at', cutoffDate.toISOString())
        .order('synced_at', { ascending: false })
        .limit(limit);

      if (calendarId) {
        query = query.eq('calendar_id', calendarId);
      }
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SyncLog[];
    },
    enabled: !!user?.id,
  });

  // Calculate aggregate stats
  const stats = logs ? {
    totalSyncs: logs.length,
    successfulSyncs: logs.filter(l => !l.error).length,
    failedSyncs: logs.filter(l => !!l.error).length,
    totalEventsAdded: logs.reduce((sum, l) => sum + (l.events_added || 0), 0),
    totalEventsUpdated: logs.reduce((sum, l) => sum + (l.events_updated || 0), 0),
    totalEventsRemoved: logs.reduce((sum, l) => sum + (l.events_removed || 0), 0),
    averageDuration: logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.sync_duration_ms || 0), 0) / logs.length)
      : 0,
    lastSyncAt: logs.length > 0 ? logs[0].synced_at : null,
    lastError: logs.find(l => l.error)?.error || null,
  } : null;

  return {
    logs,
    stats,
    isLoading,
    refetch,
  };
}

// Get sync logs grouped by day for charts
export function useSyncLogsByDay(options?: { propertyId?: string; days?: number }) {
  const { user } = useAuth();
  const { propertyId, days = 7 } = options || {};

  return useQuery({
    queryKey: ['sync-logs-by-day', user?.id, propertyId, days],
    queryFn: async () => {
      if (!user?.id) return [];

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let query = supabase
        .from('calendar_sync_logs')
        .select('synced_at, events_added, events_updated, events_removed, error')
        .eq('owner_id', user.id)
        .gte('synced_at', cutoffDate.toISOString())
        .order('synced_at', { ascending: true });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by day
      const byDay = new Map<string, {
        date: string;
        syncs: number;
        successful: number;
        failed: number;
        eventsAdded: number;
        eventsUpdated: number;
        eventsRemoved: number;
      }>();

      (data || []).forEach(log => {
        const day = log.synced_at.split('T')[0];
        const existing = byDay.get(day) || {
          date: day,
          syncs: 0,
          successful: 0,
          failed: 0,
          eventsAdded: 0,
          eventsUpdated: 0,
          eventsRemoved: 0,
        };

        existing.syncs++;
        if (log.error) {
          existing.failed++;
        } else {
          existing.successful++;
        }
        existing.eventsAdded += log.events_added || 0;
        existing.eventsUpdated += log.events_updated || 0;
        existing.eventsRemoved += log.events_removed || 0;

        byDay.set(day, existing);
      });

      return Array.from(byDay.values());
    },
    enabled: !!user?.id,
  });
}
