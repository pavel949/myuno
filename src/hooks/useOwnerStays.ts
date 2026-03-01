/**
 * @module useOwnerStays
 * Hook for owner stays — zero-price bookings in property_bookings with source='owner_stay'.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OwnerStay {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  status: string | null;
  notes: string | null;
  created_at: string;
}

export function useOwnerStays(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['owner-stays', propertyId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<OwnerStay[]> => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_bookings')
        .select('id, property_id, check_in, check_out, status, notes, created_at')
        .eq('property_id', propertyId)
        .eq('source', 'owner_stay')
        .neq('status', 'cancelled')
        .order('check_in', { ascending: false });
      if (error) throw error;
      return (data || []) as OwnerStay[];
    },
    enabled: !!propertyId && !!user,
  });

  // Check date availability
  const checkAvailability = async (checkIn: string, checkOut: string): Promise<boolean> => {
    if (!propertyId) return false;
    const { data, error } = await supabase
      .from('property_bookings')
      .select('id')
      .eq('property_id', propertyId)
      .neq('status', 'cancelled')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn)
      .limit(1);
    if (error) throw error;
    return !data || data.length === 0;
  };

  const createStay = useMutation({
    mutationFn: async (args: { checkIn: string; checkOut: string; notes?: string }) => {
      if (!propertyId || !user) throw new Error('Missing context');
      
      // Validate availability
      const available = await checkAvailability(args.checkIn, args.checkOut);
      if (!available) throw new Error('Dates overlap with existing booking');

      const { data, error } = await supabase
        .from('property_bookings')
        .insert({
          property_id: propertyId,
          owner_id: user.id,
          check_in: args.checkIn,
          check_out: args.checkOut,
          source: 'owner_stay',
          guest_name: 'Owner Stay',
          total_amount: 0,
          status: 'confirmed',
          notes: args.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Owner stay booked');
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const cancelStay = useMutation({
    mutationFn: async (stayId: string) => {
      const { error } = await supabase
        .from('property_bookings')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', stayId)
        .eq('source', 'owner_stay');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Stay cancelled');
    },
  });

  return {
    stays: query.data || [],
    isLoading: query.isLoading,
    createStay: createStay.mutateAsync,
    isCreating: createStay.isPending,
    cancelStay: cancelStay.mutateAsync,
    isCancelling: cancelStay.isPending,
  };
}
