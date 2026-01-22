import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PropertyBooking {
  id: string;
  property_id: string;
  owner_id: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  check_in: string;
  check_out: string;
  guests_count?: number;
  total_amount?: number;
  currency?: string;
  source?: string;
  external_id?: string;
  status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingInput {
  property_id: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  check_in: string;
  check_out: string;
  guests_count?: number;
  total_amount?: number;
  currency?: string;
  source?: string;
  external_id?: string;
  status?: string;
  notes?: string;
}

export function usePropertyBookings(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['property-bookings', user?.id, propertyId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('property_bookings')
        .select('*')
        .eq('owner_id', user.id)
        .order('check_in', { ascending: true });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PropertyBooking[];
    },
    enabled: !!user?.id,
  });

  const createBooking = useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_bookings')
        .insert({
          ...input,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PropertyBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PropertyBooking> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Update only if user owns this booking
      const { data, error } = await supabase
        .from('property_bookings')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', user.id) // Security: verify ownership
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Booking not found or access denied');
      return data as PropertyBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Delete only if user owns this booking
      const { error, count } = await supabase
        .from('property_bookings')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id); // Security: verify ownership

      if (error) throw error;
      // Note: count may be null if not using .select(), but the query will simply not delete if not owner
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
    },
  });

  // Get bookings for a specific month
  const getBookingsForMonth = (year: number, month: number): PropertyBooking[] => {
    if (!bookings) return [];
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    return bookings.filter(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return checkIn <= endOfMonth && checkOut >= startOfMonth;
    });
  };

  // Check if a date is booked
  const isDateBooked = (date: Date, excludeId?: string): boolean => {
    if (!bookings) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    
    return bookings.some(booking => {
      if (excludeId && booking.id === excludeId) return false;
      return dateStr >= booking.check_in && dateStr < booking.check_out;
    });
  };

  // Get booking for a specific date
  const getBookingForDate = (date: Date): PropertyBooking | undefined => {
    if (!bookings) return undefined;
    
    const dateStr = date.toISOString().split('T')[0];
    
    return bookings.find(booking => 
      dateStr >= booking.check_in && dateStr < booking.check_out
    );
  };

  return {
    bookings,
    isLoading,
    createBooking: createBooking.mutateAsync,
    updateBooking: updateBooking.mutateAsync,
    deleteBooking: deleteBooking.mutateAsync,
    isCreating: createBooking.isPending,
    isUpdating: updateBooking.isPending,
    isDeleting: deleteBooking.isPending,
    getBookingsForMonth,
    isDateBooked,
    getBookingForDate,
  };
}

// Hook for all owner's bookings across all properties
export function useAllPropertyBookings() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['all-property-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('property_bookings')
        .select(`
          *,
          owner_properties (
            id,
            title,
            title_ru,
            address,
            cover_image
          )
        `)
        .eq('owner_id', user.id)
        .order('check_in', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Upcoming bookings
  const upcomingBookings = bookings?.filter(b => 
    new Date(b.check_in) >= new Date() && b.status !== 'cancelled'
  ) || [];

  // Active bookings (currently checked in)
  const activeBookings = bookings?.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.check_in <= today && b.check_out > today && b.status !== 'cancelled';
  }) || [];

  return {
    bookings,
    upcomingBookings,
    activeBookings,
    isLoading,
  };
}

// Hook for guest's bookings (where user is the guest)
export function useGuestPropertyBookings() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['guest-property-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('property_bookings')
        .select(`
          *,
          owner_properties (
            id,
            title,
            title_ru,
            address,
            cover_image,
            check_in_time,
            check_out_time
          )
        `)
        .eq('guest_id', user.id)
        .order('check_in', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Upcoming bookings
  const upcomingBookings = bookings?.filter(b => 
    new Date(b.check_in) >= new Date() && b.status !== 'cancelled'
  ) || [];

  // Active bookings (currently checked in)
  const activeBookings = bookings?.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.check_in <= today && b.check_out > today && b.status !== 'cancelled';
  }) || [];

  // Past bookings
  const pastBookings = bookings?.filter(b => 
    new Date(b.check_out) < new Date()
  ) || [];

  return {
    bookings,
    upcomingBookings,
    activeBookings,
    pastBookings,
    isLoading,
  };
}
