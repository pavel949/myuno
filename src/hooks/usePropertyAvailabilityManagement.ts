import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { AvailabilityEntry } from '@/components/property/PropertyCalendar';

interface PropertyAvailabilityRow {
  id: string;
  property_id: string;
  date: string;
  status: 'available' | 'blocked' | 'booked';
  price_override: number | null;
  min_nights_override: number | null;
  note: string | null;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
}

export function usePropertyAvailabilityManagement(propertyId?: string) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();

  // Fetch availability for a property
  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['property-availability-management', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('property_availability')
        .select('*')
        .eq('property_id', propertyId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching availability:', error);
        throw error;
      }

      return (data as PropertyAvailabilityRow[]).map(row => ({
        date: new Date(row.date),
        status: row.status,
        priceOverride: row.price_override ?? undefined,
        minNightsOverride: row.min_nights_override ?? undefined,
        note: row.note ?? undefined,
        bookingId: row.booking_id ?? undefined,
      })) as AvailabilityEntry[];
    },
    enabled: !!propertyId,
  });

  // Upsert availability entries
  const upsertMutation = useMutation({
    mutationFn: async (entries: AvailabilityEntry[]) => {
      if (!propertyId) throw new Error('Property ID required');

      const rows = entries.map(entry => ({
        property_id: propertyId,
        date: format(entry.date, 'yyyy-MM-dd'),
        status: entry.status,
        price_override: entry.priceOverride ?? null,
        min_nights_override: entry.minNightsOverride ?? null,
        note: entry.note ?? null,
      }));

      const { error } = await supabase
        .from('property_availability')
        .upsert(rows, { 
          onConflict: 'property_id,date',
          ignoreDuplicates: false 
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-availability-management', propertyId] });
      toast({
        title: isRu ? 'Сохранено' : 'Saved',
        description: isRu ? 'Доступность обновлена' : 'Availability updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating availability:', error);
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Не удалось обновить доступность' : 'Failed to update availability',
        variant: 'destructive',
      });
    },
  });

  // Delete availability entries for date range
  const deleteMutation = useMutation({
    mutationFn: async (dates: Date[]) => {
      if (!propertyId) throw new Error('Property ID required');

      const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));

      const { error } = await supabase
        .from('property_availability')
        .delete()
        .eq('property_id', propertyId)
        .in('date', dateStrings);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-availability-management', propertyId] });
    },
    onError: (error) => {
      console.error('Error deleting availability:', error);
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Не удалось удалить записи' : 'Failed to delete availability entries',
        variant: 'destructive',
      });
    },
  });

  // Sync availability from full array (replaces all)
  const syncAvailability = async (entries: AvailabilityEntry[]) => {
    // Filter only non-available entries (we don't need to store 'available' status)
    const entriesToSave = entries.filter(e => 
      e.status !== 'available' || 
      e.priceOverride !== undefined || 
      e.minNightsOverride !== undefined
    );

    if (entriesToSave.length === 0) {
      // Clear all if nothing to save
      await supabase
        .from('property_availability')
        .delete()
        .eq('property_id', propertyId);
      
      queryClient.invalidateQueries({ queryKey: ['property-availability-management', propertyId] });
      return;
    }

    await upsertMutation.mutateAsync(entriesToSave);
  };

  return {
    availability,
    isLoading,
    syncAvailability,
    upsertAvailability: upsertMutation.mutateAsync,
    deleteAvailability: deleteMutation.mutateAsync,
    isSaving: upsertMutation.isPending || deleteMutation.isPending,
  };
}
