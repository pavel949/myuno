import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { YachtAvailabilityEntry } from '@/components/yachts/YachtCalendar';

interface DbYachtAvailability {
  id: string;
  yacht_id: string;
  date: string;
  status: 'available' | 'blocked' | 'booked' | 'maintenance';
  price_override: number | null;
  note: string | null;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useYachtAvailability(yachtId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['yacht-availability', yachtId],
    queryFn: async () => {
      if (!yachtId) return [];

      const { data, error } = await supabase
        .from('yacht_availability')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('date', { ascending: true });

      if (error) {
        return [];
      }

      return (data as DbYachtAvailability[]).map((entry) => ({
        date: new Date(entry.date),
        status: entry.status,
        priceOverride: entry.price_override ?? undefined,
        note: entry.note ?? undefined,
        bookingId: entry.booking_id ?? undefined,
      })) as YachtAvailabilityEntry[];
    },
    enabled: !!yachtId,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({
      yachtId,
      entries,
    }: {
      yachtId: string;
      entries: YachtAvailabilityEntry[];
    }) => {
      // Transform entries for database
      const dbEntries = entries.map((entry) => ({
        yacht_id: yachtId,
        date: format(entry.date, 'yyyy-MM-dd'),
        status: entry.status,
        price_override: entry.priceOverride ?? null,
        note: entry.note ?? null,
        booking_id: entry.bookingId ?? null,
      }));

      // Upsert all entries
      const { error } = await supabase
        .from('yacht_availability')
        .upsert(dbEntries, {
          onConflict: 'yacht_id,date',
          ignoreDuplicates: false,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['yacht-availability', variables.yachtId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      yachtId,
      dates,
    }: {
      yachtId: string;
      dates: Date[];
    }) => {
      const dateStrings = dates.map((d) => format(d, 'yyyy-MM-dd'));

      const { error } = await supabase
        .from('yacht_availability')
        .delete()
        .eq('yacht_id', yachtId)
        .in('date', dateStrings);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['yacht-availability', variables.yachtId] });
    },
  });

  return {
    availability: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    updateAvailability: upsertMutation.mutateAsync,
    deleteAvailability: deleteMutation.mutateAsync,
    isUpdating: upsertMutation.isPending,
  };
}

// Hook to check if a yacht is available for specific dates
export function useCheckYachtAvailability(yachtId?: string, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['yacht-availability-check', yachtId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!yachtId || !startDate || !endDate) {
        return { isAvailable: true, blockedDates: [] };
      }

      const { data, error } = await supabase.rpc('check_yacht_availability', {
        p_yacht_id: yachtId,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd'),
      });

      if (error) {
        return { isAvailable: true, blockedDates: [] };
      }

      return {
        isAvailable: data as boolean,
        blockedDates: [],
      };
    },
    enabled: !!yachtId && !!startDate && !!endDate,
  });
}
