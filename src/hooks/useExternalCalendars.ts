import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExternalCalendar {
  id: string;
  property_id: string;
  owner_id: string;
  name: string;
  ical_url: string;
  last_synced_at: string | null;
  sync_error: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExternalCalendarInput {
  property_id: string;
  name: string;
  ical_url: string;
}

export function useExternalCalendars(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: calendars, isLoading } = useQuery({
    queryKey: ['external-calendars', user?.id, propertyId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('property_external_calendars')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ExternalCalendar[];
    },
    enabled: !!user?.id,
  });

  const createCalendar = useMutation({
    mutationFn: async (input: CreateExternalCalendarInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_external_calendars')
        .insert({
          ...input,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ExternalCalendar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-calendars', user?.id] });
    },
  });

  const updateCalendar = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExternalCalendar> & { id: string }) => {
      const { data, error } = await supabase
        .from('property_external_calendars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ExternalCalendar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-calendars', user?.id] });
    },
  });

  const deleteCalendar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_external_calendars')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-calendars', user?.id] });
    },
  });

  const syncCalendar = useMutation({
    mutationFn: async (calendarId: string) => {
      const { data, error } = await supabase.functions.invoke('ical-sync', {
        body: { calendar_ids: [calendarId] },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-calendars', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
    },
  });

  const syncAllCalendars = useMutation({
    mutationFn: async (propertyId?: string) => {
      const calendarIds = calendars
        ?.filter(c => !propertyId || c.property_id === propertyId)
        .map(c => c.id) || [];

      if (calendarIds.length === 0) return { results: [] };

      const { data, error } = await supabase.functions.invoke('ical-sync', {
        body: { calendar_ids: calendarIds },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-calendars', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
    },
  });

  return {
    calendars,
    isLoading,
    createCalendar: createCalendar.mutateAsync,
    updateCalendar: updateCalendar.mutateAsync,
    deleteCalendar: deleteCalendar.mutateAsync,
    syncCalendar: syncCalendar.mutateAsync,
    syncAllCalendars: syncAllCalendars.mutateAsync,
    isCreating: createCalendar.isPending,
    isUpdating: updateCalendar.isPending,
    isDeleting: deleteCalendar.isPending,
    isSyncing: syncCalendar.isPending || syncAllCalendars.isPending,
  };
}

// Hook to get iCal export URL for a property
export function useICalExportUrl(propertyId?: string) {
  const { user } = useAuth();

  const { data: exportUrl, isLoading } = useQuery({
    queryKey: ['ical-export-url', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      const { data, error } = await supabase
        .from('owner_properties')
        .select('ical_token')
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      return `${supabaseUrl}/functions/v1/ical-export?property=${propertyId}&token=${data.ical_token}`;
    },
    enabled: !!propertyId && !!user?.id,
  });

  return { exportUrl, isLoading };
}
