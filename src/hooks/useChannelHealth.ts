import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';
import { useAuth } from '@/contexts/AuthContext';
import { ExternalCalendar } from './useExternalCalendars';

export type ChannelStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface ChannelHealth {
  id: string;
  name: string;
  channelType: string;
  propertyId: string;
  propertyName?: string;
  status: ChannelStatus;
  lastSyncAt: string | null;
  syncError: string | null;
  isActive: boolean;
  autoSync: boolean;
  priority: number;
  syncIntervalMinutes: number;
  bookingsCount: number;
  lastEventsAdded: number;
  lastEventsUpdated: number;
  lastEventsRemoved: number;
}

export interface ConflictInfo {
  bookingId1: string;
  bookingId2: string;
  guestName1: string;
  guestName2: string;
  source1: string;
  source2: string;
  checkIn1: string;
  checkOut1: string;
  checkIn2: string;
  checkOut2: string;
  overlapDays: number;
}

// Determine channel status based on sync state
function getChannelStatus(calendar: { sync_error: string | null; is_active: boolean; last_synced_at: string | null }): ChannelStatus {
  if (calendar.sync_error) return 'error';
  if (!calendar.is_active) return 'unknown';
  
  if (!calendar.last_synced_at) return 'warning';
  
  const lastSync = new Date(calendar.last_synced_at);
  const now = new Date();
  const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
  
  // Warning if not synced in last 2 hours (8x the 15-min interval)
  if (hoursSinceSync > 2) return 'warning';
  
  return 'healthy';
}

export function useChannelHealth(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: channels, isLoading } = useQuery({
    queryKey: ['channel-health', user?.id, propertyId],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch calendars with property info
      let query = supabase
        .from('property_external_calendars')
        .select(`
          *,
          properties!inner(id, title_en, title_ru)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data: calendars, error } = await query;
      if (error) throw error;

      // Fetch latest sync log for each calendar
      const calendarIds = (calendars || []).map(c => c.id);
      const { data: latestLogs } = await supabase
        .from('calendar_sync_logs')
        .select('calendar_id, events_added, events_updated, events_removed')
        .in('calendar_id', calendarIds)
        .order('synced_at', { ascending: false });

      // Get latest log per calendar
      const latestLogMap = new Map<string, { events_added: number; events_updated: number; events_removed: number }>();
      (latestLogs || []).forEach(log => {
        if (!latestLogMap.has(log.calendar_id)) {
          latestLogMap.set(log.calendar_id, log);
        }
      });

      // Fetch booking counts per calendar
      const { data: bookingCounts } = await supabase
        .from('property_bookings')
        .select('source_calendar_id')
        .in('source_calendar_id', calendarIds)
        .not('status', 'eq', 'cancelled');

      const countMap = new Map<string, number>();
      (bookingCounts || []).forEach(b => {
        const calId = b.source_calendar_id;
        countMap.set(calId, (countMap.get(calId) || 0) + 1);
      });

      return (calendars || []).map((cal): ChannelHealth => {
        const latestLog = latestLogMap.get(cal.id);
        const property = cal.properties as { title_en?: string } | null;
        
        return {
          id: cal.id,
          name: cal.name,
          channelType: cal.channel_type || 'other',
          propertyId: cal.property_id,
          propertyName: property?.title_en,
          status: getChannelStatus(cal),
          lastSyncAt: cal.last_synced_at,
          syncError: cal.sync_error,
          isActive: cal.is_active,
          autoSync: cal.auto_sync ?? true,
          priority: cal.priority || 0,
          syncIntervalMinutes: cal.sync_interval_minutes || 15,
          bookingsCount: countMap.get(cal.id) || 0,
          lastEventsAdded: latestLog?.events_added || 0,
          lastEventsUpdated: latestLog?.events_updated || 0,
          lastEventsRemoved: latestLog?.events_removed || 0,
        };
      });
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  // Update calendar settings
  const updateChannel = useMutation({
    mutationFn: async ({ 
      id, 
      autoSync, 
      priority, 
      syncIntervalMinutes 
    }: { 
      id: string; 
      autoSync?: boolean; 
      priority?: number; 
      syncIntervalMinutes?: number;
    }) => {
      const updates: Record<string, unknown> = {};
      if (autoSync !== undefined) updates.auto_sync = autoSync;
      if (priority !== undefined) updates.priority = priority;
      if (syncIntervalMinutes !== undefined) updates.sync_interval_minutes = syncIntervalMinutes;

      const { error } = await supabase
        .from('property_external_calendars')
        .update(updates as never)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-health'] });
      queryClient.invalidateQueries({ queryKey: ['external-calendars'] });
    },
  });

  // Calculate summary stats
  const stats = channels ? {
    total: channels.length,
    healthy: channels.filter(c => c.status === 'healthy').length,
    warning: channels.filter(c => c.status === 'warning').length,
    error: channels.filter(c => c.status === 'error').length,
    totalBookings: channels.reduce((sum, c) => sum + c.bookingsCount, 0),
    autoSyncEnabled: channels.filter(c => c.autoSync).length,
  } : null;

  return {
    channels,
    stats,
    isLoading,
    updateChannel: updateChannel.mutateAsync,
    isUpdating: updateChannel.isPending,
  };
}

// Hook to detect booking conflicts for a property
export function useBookingConflicts(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['booking-conflicts', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase.rpc('detect_booking_conflicts', {
        p_property_id: propertyId,
      });

      if (error) throw error;

      type ConflictRpcRow = {
        booking_id_1: string;
        booking_id_2: string;
        guest_name_1: string;
        guest_name_2: string;
        source_1: string;
        source_2: string;
        check_in_1: string;
        check_out_1: string;
        check_in_2: string;
        check_out_2: string;
        overlap_days: number;
      };
      return ((data ?? []) as ConflictRpcRow[]).map((c): ConflictInfo => ({
        bookingId1: c.booking_id_1,
        bookingId2: c.booking_id_2,
        guestName1: c.guest_name_1,
        guestName2: c.guest_name_2,
        source1: c.source_1,
        source2: c.source_2,
        checkIn1: c.check_in_1,
        checkOut1: c.check_out_1,
        checkIn2: c.check_in_2,
        checkOut2: c.check_out_2,
        overlapDays: c.overlap_days,
      }));
    },
    enabled: !!user?.id && !!propertyId,
  });
}

// Hook to read booking_conflicts table (from ical-scheduled-sync conflict detection)
export interface BookingConflictRow {
  id: string;
  property_id: string;
  conflict_date: string;
  channel_a: string;
  channel_b: string;
  order_id_a: string | null;
  order_id_b: string | null;
  detected_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  note: string | null;
  property?: { title_en?: string; title_ru?: string };
}

export function useBookingConflictsFromTable(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['booking-conflicts-table', user?.id, propertyId],
    queryFn: async () => {
      if (!user?.id) return { conflicts: [], unresolvedCount: 0 };

      let q = typedFrom('booking_conflicts')
        .select(`
          id,
          property_id,
          conflict_date,
          channel_a,
          channel_b,
          order_id_a,
          order_id_b,
          detected_at,
          resolved,
          resolved_at,
          resolved_by,
          note,
          properties(id, title_en, title_ru)
        `)
        .eq('resolved', false)
        .order('detected_at', { ascending: false });

      if (propertyId) {
        q = q.eq('property_id', propertyId);
      }

      const { data, error } = await q;
      if (error) throw error;

      type RawConflict = BookingConflictRow & { properties?: BookingConflictRow['property'] };
      const conflicts = ((data ?? []) as unknown as RawConflict[]).map((r) => ({
        ...r,
        property: r.properties,
      }));
      return {
        conflicts: conflicts as BookingConflictRow[],
        unresolvedCount: conflicts.length,
      };
    },
    enabled: !!user?.id,
  });

  const markResolved = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { error } = await typedFrom('booking_conflicts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          note: note || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-conflicts-table'] });
    },
  });

  return {
    ...query,
    markResolved: markResolved.mutateAsync,
    isMarkingResolved: markResolved.isPending,
  };
}

// Hook to get conflicts for all properties
export function useAllBookingConflicts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-booking-conflicts', user?.id],
    queryFn: async () => {
      if (!user?.id) return { conflicts: [], count: 0 };

      // Get all user properties from unified table
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      if (!properties || properties.length === 0) {
        return { conflicts: [], count: 0 };
      }

      // Check conflicts for each property
      const allConflicts: (ConflictInfo & { propertyId: string })[] = [];

      for (const prop of properties) {
        const { data } = await supabase.rpc('detect_booking_conflicts', {
          p_property_id: prop.id,
        });

        if (data) {
          type ConflictRpcRow = {
            booking_id_1: string; booking_id_2: string;
            guest_name_1: string; guest_name_2: string;
            source_1: string; source_2: string;
            check_in_1: string; check_out_1: string;
            check_in_2: string; check_out_2: string;
            overlap_days: number;
          };
          allConflicts.push(...(data as ConflictRpcRow[]).map((c) => ({
            propertyId: prop.id,
            bookingId1: c.booking_id_1,
            bookingId2: c.booking_id_2,
            guestName1: c.guest_name_1,
            guestName2: c.guest_name_2,
            source1: c.source_1,
            source2: c.source_2,
            checkIn1: c.check_in_1,
            checkOut1: c.check_out_1,
            checkIn2: c.check_in_2,
            checkOut2: c.check_out_2,
            overlapDays: c.overlap_days,
          })));
        }
      }

      return {
        conflicts: allConflicts,
        count: allConflicts.length,
      };
    },
    enabled: !!user?.id,
  });
}
