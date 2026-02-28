import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface YachtExternalCalendar {
  id: string;
  yacht_id: string;
  owner_id: string;
  name: string;
  ical_url: string;
  last_synced_at: string | null;
  sync_error: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateYachtCalendarInput {
  yacht_id: string;
  name: string;
  ical_url: string;
}

export function useYachtExternalCalendars(yachtId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: calendars, isLoading } = useQuery({
    queryKey: ['yacht-external-calendars', user?.id, yachtId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('yacht_external_calendars')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (yachtId) {
        query = query.eq('yacht_id', yachtId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as YachtExternalCalendar[];
    },
    enabled: !!user?.id,
  });

  const createCalendar = useMutation({
    mutationFn: async (input: CreateYachtCalendarInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('yacht_external_calendars')
        .insert({
          ...input,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as YachtExternalCalendar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-external-calendars', user?.id] });
    },
  });

  const updateCalendar = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<YachtExternalCalendar> & { id: string }) => {
      const { data, error } = await supabase
        .from('yacht_external_calendars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as YachtExternalCalendar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-external-calendars', user?.id] });
    },
  });

  const deleteCalendar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('yacht_external_calendars')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-external-calendars', user?.id] });
    },
  });

  const syncCalendar = useMutation({
    mutationFn: async (calendarId: string) => {
      const { data, error } = await supabase.functions.invoke('yacht-ical-sync', {
        body: { calendar_ids: [calendarId] },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-external-calendars', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['yacht-availability'] });
    },
  });

  const syncAllCalendars = useMutation({
    mutationFn: async (yachtIdFilter?: string) => {
      const calendarIds = calendars
        ?.filter(c => !yachtIdFilter || c.yacht_id === yachtIdFilter)
        .map(c => c.id) || [];

      if (calendarIds.length === 0) return { results: [] };

      const { data, error } = await supabase.functions.invoke('yacht-ical-sync', {
        body: { calendar_ids: calendarIds },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-external-calendars', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['yacht-availability'] });
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

// Hook to get iCal export URL for a yacht
export function useYachtICalExportUrl(yachtId?: string) {
  const { user } = useAuth();

  const { data: exportUrl, isLoading } = useQuery({
    queryKey: ['yacht-ical-export-url', yachtId],
    queryFn: async () => {
      if (!yachtId) return null;

      const { data, error } = await supabase
        .from('listings')
        .select('attributes')
        .eq('id', yachtId)
        .eq('vertical', 'yacht')
        .single();

      if (error) throw error;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const attrs = (data.attributes || {}) as Record<string, any>;
      const icalToken = attrs.ical_token as string | undefined;
      return `${supabaseUrl}/functions/v1/yacht-calendar-export?yacht=${yachtId}&token=${icalToken || ''}`;
    },
    enabled: !!yachtId && !!user?.id,
  });

  return { exportUrl, isLoading };
}
