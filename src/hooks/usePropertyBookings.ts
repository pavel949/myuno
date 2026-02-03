import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('usePropertyBookings');

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
  // Mapped from orders
  order_id?: string;
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
  deposit_amount?: number;
  currency?: string;
  source?: string;
  external_id?: string;
  status?: string;
  notes?: string;
  documents?: string[]; // URLs to attached documents
}

/**
 * Maps an order row to PropertyBooking interface for backward compatibility
 */
function mapOrderToBooking(order: any, propertyId: string): PropertyBooking {
  const guestParticipant = order.order_participants?.find((p: any) => p.role === 'guest');
  const propertyItem = order.order_items?.find((i: any) => i.item_type === 'property');
  
  // Property ID is stored in order_items.metadata.property_id (not resource_id due to FK constraint)
  const itemPropertyId = propertyItem?.metadata?.property_id || propertyItem?.resource_id;
  
  return {
    id: order.id,
    order_id: order.id,
    property_id: itemPropertyId || propertyId,
    owner_id: order.provider_org_id || '',
    guest_name: guestParticipant?.name,
    guest_phone: guestParticipant?.phone,
    guest_email: guestParticipant?.email,
    check_in: order.start_at?.split('T')[0] || '',
    check_out: order.end_at?.split('T')[0] || '',
    guests_count: order.metadata?.guests_count,
    total_amount: order.total_amount,
    currency: order.currency,
    source: order.metadata?.source,
    external_id: order.metadata?.external_id,
    status: order.status,
    notes: order.notes,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export function usePropertyBookings(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['property-bookings', user?.id, propertyId],
    queryFn: async () => {
      if (!user?.id) return [];

      // Query orders where vertical = 'property' and user is the owner
      // We need to find orders linked to properties the user owns
      // Fetch orders with property vertical
      // Note: property_id is stored in order_items.metadata.property_id
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items!inner (
            id, resource_id, item_type, item_name, unit_price, amount, start_at, end_at, metadata
          ),
          order_participants (
            id, role, name, phone, email
          )
        `)
        .eq('vertical', 'property')
        .eq('order_items.item_type', 'property')
        .is('deleted_at', null)
        .order('start_at', { ascending: true });

      // Filter by specific property if provided - check in metadata
      // Note: PostgREST doesn't support filtering by JSONB deeply, so we filter in JS
      const { data, error } = await query;

      if (error) {
        errorLog.silent(error, 'fetch_bookings');
        throw error;
      }

      // Filter by property_id in metadata if specified
      let filteredData = data || [];
      if (propertyId) {
        filteredData = filteredData.filter((order) => {
          const propertyItem = order.order_items?.find((i: any) => i.item_type === 'property');
          const meta = propertyItem?.metadata as Record<string, unknown> | null;
          const itemPropertyId = meta?.property_id || propertyItem?.resource_id;
          return itemPropertyId === propertyId;
        });
      }

      // Map orders to PropertyBooking format
      return filteredData.map((order) => 
        mapOrderToBooking(order, propertyId || '')
      );
    },
    enabled: !!user?.id,
  });

  const createBooking = useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create order with order_type = 'property' (matches DB constraint)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_type: 'property',
          vertical: 'property',
          customer_user_id: user.id,
          start_at: `${input.check_in}T14:00:00Z`,
          end_at: `${input.check_out}T12:00:00Z`,
          total_amount: input.total_amount || 0,
          currency: input.currency || 'THB',
          status: (input.status === 'confirmed' ? 'confirmed' : 'pending') as any,
          notes: input.notes,
          metadata: {
            source: input.source || 'manual',
            external_id: input.external_id,
            guests_count: input.guests_count,
            deposit_amount: input.deposit_amount,
            documents: input.documents,
          },
        })
        .select()
        .single();

      if (orderError) {
        errorLog.silent(orderError, 'create_order');
        throw orderError;
      }

      // Create order_item linking to property
      // NOTE: We store property_id in metadata instead of resource_id 
      // because resource_id has FK constraint to resources table
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          item_type: 'property',
          item_name: 'Property Booking',
          unit_price: input.total_amount || 0,
          amount: input.total_amount || 0,
          qty: 1,
          start_at: `${input.check_in}T14:00:00Z`,
          end_at: `${input.check_out}T12:00:00Z`,
          metadata: {
            property_id: input.property_id,
          },
        });

      if (itemError) {
        errorLog.silent(itemError, 'create_order_item');
        // Rollback: delete order
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemError;
      }

      // Create guest participant if guest info provided
      if (input.guest_name || input.guest_phone || input.guest_email) {
        const { error: participantError } = await supabase
          .from('order_participants')
          .insert({
            order_id: order.id,
            role: 'guest',
            name: input.guest_name || 'Guest',
            phone: input.guest_phone,
            email: input.guest_email,
          });

        if (participantError) {
          errorLog.silent(participantError, 'create_participant');
          // Non-critical, don't rollback
        }
      }

      return mapOrderToBooking(order, input.property_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-property-bookings', user?.id] });
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PropertyBooking> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Update the order
      const orderUpdates: any = {};
      if (updates.check_in) orderUpdates.start_at = `${updates.check_in}T14:00:00Z`;
      if (updates.check_out) orderUpdates.end_at = `${updates.check_out}T12:00:00Z`;
      if (updates.total_amount !== undefined) orderUpdates.total_amount = updates.total_amount;
      if (updates.currency) orderUpdates.currency = updates.currency;
      if (updates.status) orderUpdates.status = updates.status;
      if (updates.notes !== undefined) orderUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('orders')
        .update(orderUpdates)
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        errorLog.silent(error, 'update_booking');
        throw error;
      }
      
      if (!data) throw new Error('Booking not found or access denied');

      // Update guest participant if provided
      if (updates.guest_name || updates.guest_phone || updates.guest_email) {
        await supabase
          .from('order_participants')
          .upsert({
            order_id: id,
            role: 'guest',
            name: updates.guest_name || 'Guest',
            phone: updates.guest_phone,
            email: updates.guest_email,
          }, {
            onConflict: 'order_id,role',
          });
      }

      return mapOrderToBooking(data, updates.property_id || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-property-bookings', user?.id] });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from('orders')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', id);

      if (error) {
        errorLog.silent(error, 'delete_booking');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-property-bookings', user?.id] });
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

      // Get all properties owned by user
      const { data: properties, error: propError } = await supabase
        .from('owner_properties')
        .select('id')
        .eq('owner_id', user.id);

      if (propError) {
        errorLog.silent(propError, 'fetch_owner_properties');
        throw propError;
      }

      if (!properties?.length) return [];

      const propertyIds = properties.map(p => p.id);

      // Get orders for these properties
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items!inner (
            id, resource_id, item_type, item_name, unit_price, amount
          ),
          order_participants (
            id, role, name, phone, email
          )
        `)
        .eq('vertical', 'property')
        .eq('order_items.item_type', 'property')
        .in('order_items.resource_id', propertyIds)
        .is('deleted_at', null)
        .order('start_at', { ascending: true });

      if (error) {
        errorLog.silent(error, 'fetch_all_bookings');
        throw error;
      }

      // Enrich with property data
      const enrichedData = await Promise.all((data || []).map(async (order) => {
        const resourceId = order.order_items?.[0]?.resource_id;
        
        let propertyData = null;
        if (resourceId) {
          const { data: prop } = await supabase
            .from('owner_properties')
            .select('id, title, title_ru, address, cover_image')
            .eq('id', resourceId)
            .single();
          propertyData = prop;
        }

        return {
          ...mapOrderToBooking(order, resourceId || ''),
          owner_properties: propertyData,
        };
      }));

      return enrichedData;
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

      // Get orders where user is the customer
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items!inner (
            id, resource_id, item_type, item_name
          ),
          order_participants (
            id, role, name, phone, email
          )
        `)
        .eq('vertical', 'property')
        .eq('customer_user_id', user.id)
        .is('deleted_at', null)
        .order('start_at', { ascending: true });

      if (error) {
        errorLog.silent(error, 'fetch_guest_bookings');
        throw error;
      }

      // Enrich with property data
      const enrichedData = await Promise.all((data || []).map(async (order) => {
        const resourceId = order.order_items?.[0]?.resource_id;
        
        let propertyData = null;
        if (resourceId) {
          const { data: prop } = await supabase
            .from('owner_properties')
            .select('id, title, title_ru, address, cover_image, check_in_time, check_out_time')
            .eq('id', resourceId)
            .single();
          propertyData = prop;
        }

        return {
          ...mapOrderToBooking(order, resourceId || ''),
          owner_properties: propertyData,
        };
      }));

      return enrichedData;
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
