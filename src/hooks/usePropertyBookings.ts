import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useStorefront } from '@/contexts/StorefrontContext';
import { getAccessiblePropertyIds } from '@/lib/getAccessiblePropertyIds';
import { createErrorHandler } from '@/lib/errorHandler';
import type { Database } from '@/integrations/supabase/types';

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
  check_in_time?: string;  // e.g., "14:00"
  check_out_time?: string; // e.g., "11:00"
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

interface OrderWithJoins {
  id: string;
  start_at: string | null;
  end_at: string | null;
  total_amount: number | null;
  currency: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  provider_org_id: string | null;
  metadata: Record<string, unknown> | null;
  order_participants?: Array<{ role: string; name: string | null; phone: string | null; email: string | null }> | null;
  order_items?: Array<{ item_type: string; resource_id: string | null; metadata: Record<string, unknown> | null }> | null;
}

/**
 * Maps an order row to PropertyBooking interface for backward compatibility.
 * Accepts unknown shape and extracts fields defensively to tolerate Supabase
 * generated-type drift (e.g. metadata being typed as Json).
 */
function mapOrderToBooking(orderInput: unknown, propertyId: string): PropertyBooking {
  const order = (orderInput || {}) as {
    id?: string;
    start_at?: string | null;
    end_at?: string | null;
    total_amount?: number | null;
    currency?: string | null;
    status?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    provider_org_id?: string | null;
    metadata?: Record<string, unknown> | null | string;
    order_participants?: Array<{ role: string; name: string | null; phone: string | null; email: string | null }> | null;
    order_items?: Array<{ item_type: string; resource_id: string | null; metadata: Record<string, unknown> | null }> | null;
  };
  const meta = (typeof order.metadata === 'object' && order.metadata !== null ? order.metadata : {}) as Record<string, unknown>;
  const guestParticipant = order.order_participants?.find((p) => p.role === 'guest');
  const propertyItem = order.order_items?.find((i) => i.item_type === 'property');
  const itemMeta = (propertyItem?.metadata && typeof propertyItem.metadata === 'object' ? propertyItem.metadata : {}) as Record<string, unknown>;
  const itemPropertyId = (itemMeta.property_id as string | undefined) || propertyItem?.resource_id;

  return {
    id: order.id || '',
    order_id: order.id,
    property_id: itemPropertyId || propertyId,
    owner_id: order.provider_org_id || '',
    guest_name: guestParticipant?.name || undefined,
    guest_phone: guestParticipant?.phone || undefined,
    guest_email: guestParticipant?.email || undefined,
    check_in: order.start_at?.split('T')[0] || '',
    check_out: order.end_at?.split('T')[0] || '',
    guests_count: meta.guests_count as number | undefined,
    total_amount: order.total_amount ?? undefined,
    currency: order.currency ?? undefined,
    source: meta.source as string | undefined,
    external_id: meta.external_id as string | undefined,
    status: order.status,
    notes: order.notes ?? undefined,
    created_at: order.created_at || '',
    updated_at: order.updated_at || '',
  };
}

export function usePropertyBookings(propertyId?: string) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const { storefront } = useStorefront();
  const activeCompanyId = activeCompany?.company_id ?? null;
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['property-bookings', user?.id, activeCompanyId, propertyId],
    queryFn: async () => {
      if (!user?.id) return [];

      // Use unified access layer (owned + delegated + MC company)
      const { allIds: allPropertyIds } = await getAccessiblePropertyIds({
        userId: user.id,
        activeCompanyId,
      });
      
      if (allPropertyIds.length === 0) return [];

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

      // Filter by specific property if provided
      if (propertyId) {
        if (!allPropertyIds.includes(propertyId)) return [];
        query = query.eq('order_items.resource_id', propertyId);
      } else {
        query = query.in('order_items.resource_id', allPropertyIds);
      }

      const { data, error } = await query;

      if (error) {
        errorLog.silent(error, 'fetch_bookings');
        throw error;
      }

      // Map orders to PropertyBooking format
      return (data || []).map((order) => 
        mapOrderToBooking(order, propertyId || '')
      );
    },
    enabled: !!user?.id,
  });

  const createBooking = useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // P1: Overlap validation — check existing orders and manual blocks
      const checkInTime = input.check_in_time || '14:00';
      const checkOutTime = input.check_out_time || '12:00';
      const newStart = `${input.check_in}T${checkInTime}:00Z`;
      const newEnd = `${input.check_out}T${checkOutTime}:00Z`;

      const [{ data: ordersInRange }, { data: blockedDates }] = await Promise.all([
        supabase
          .from('orders')
          .select('id')
          .eq('vertical', 'property')
          .is('deleted_at', null)
          .not('status', 'eq', 'cancelled')
          .gt('end_at', newStart)
          .lt('start_at', newEnd),
        supabase
          .from('property_availability')
          .select('date')
          .eq('property_id', input.property_id)
          .eq('status', 'blocked')
          .gte('date', input.check_in)
          .lte('date', input.check_out),
      ]);

      const orderIds = (ordersInRange || []).map((o: { id: string }) => o.id);
      const overlappingForProperty = orderIds.length
        ? (await supabase
            .from('order_items')
            .select('order_id')
            .eq('item_type', 'property')
            .eq('resource_id', input.property_id)
            .in('order_id', orderIds)).data || []
        : [];
      if (overlappingForProperty.length > 0) {
        throw new Error('Выбранные даты пересекаются с существующим бронированием');
      }
      if ((blockedDates || []).length > 0) {
        throw new Error('Выбранные даты заблокированы в календаре');
      }

      // Create order with order_type = 'property' (matches DB constraint)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_type: 'property',
          vertical: 'property',
          customer_user_id: user.id,
          start_at: `${input.check_in}T${input.check_in_time || '14:00'}:00Z`,
          end_at: `${input.check_out}T${input.check_out_time || '12:00'}:00Z`,
          total_amount: input.total_amount || 0,
          currency: input.currency || 'THB',
          status: (input.status === 'confirmed' ? 'confirmed' : 'pending') as Database['public']['Enums']['order_status'],
          notes: input.notes,
          // Storefront attribution
          source_storefront_id: storefront?.id || null,
          source_company_id: storefront?.company_id || null,
          metadata: {
            source: input.source || 'manual',
            external_id: input.external_id,
            guests_count: input.guests_count,
            deposit_amount: input.deposit_amount,
            documents: input.documents,
            check_in_time: input.check_in_time || '14:00',
            check_out_time: input.check_out_time || '11:00',
            ...(storefront ? { storefront_slug: storefront.slug } : {}),
          },
        })
        .select()
        .single();

      if (orderError) {
        errorLog.silent(orderError, 'create_order');
        throw orderError;
      }

      // Create order_item linking to property
      // Store property_id in BOTH resource_id and metadata for compatibility
      // resource_id is used by useAllPropertyBookings for filtering
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          item_type: 'property',
          item_name: 'Property Booking',
          unit_price: input.total_amount || 0,
          amount: input.total_amount || 0,
          qty: 1,
          resource_id: input.property_id,
          start_at: `${input.check_in}T${input.check_in_time || '14:00'}:00Z`,
          end_at: `${input.check_out}T${input.check_out_time || '12:00'}:00Z`,
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

      // P1: Booking message rules — fire booking_confirmed for confirmed bookings
      if (input.status === 'confirmed') {
        supabase.functions.invoke('execute-booking-message-rules', {
          body: { immediate_order_id: order.id },
        }).then(({ error }) => {
          if (error) errorLog.silent(error, 'booking_message_rules');
        });
      }

      // P1: Booking lifecycle automation — create operational tasks for check-in, check-out, cleaning
      if (input.status === 'confirmed' || !input.status) {
        const guestName = input.guest_name || 'Guest';
        const checkInDate = input.check_in;
        const checkOutDate = input.check_out;
        const cleaningDate = (() => {
          const d = new Date(checkInDate);
          d.setDate(d.getDate() - 1);
          return d.toISOString().split('T')[0];
        })();
        const today = new Date().toISOString().split('T')[0];
        const effectiveCleaningDate = cleaningDate < today ? today : cleaningDate;

        const tasks = [
          { task_type: 'cleaning', scheduled_date: effectiveCleaningDate, title: `Pre-arrival cleaning: ${guestName}`, title_ru: `Уборка перед заездом: ${guestName}` },
          { task_type: 'check_in', scheduled_date: checkInDate, title: `Check-in: ${guestName}`, title_ru: `Заезд: ${guestName}` },
          { task_type: 'check_out', scheduled_date: checkOutDate, title: `Check-out: ${guestName}`, title_ru: `Выезд: ${guestName}` },
        ];
        for (const t of tasks) {
          await supabase.from('property_operational_tasks').insert({
            property_id: input.property_id,
            task_type: t.task_type,
            title: t.title,
            title_ru: t.title_ru,
            scheduled_date: t.scheduled_date,
            priority: t.task_type === 'check_out' ? 'normal' : 'high',
            status: 'pending',
          });
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

      // P1: Overlap validation when dates change (exclude current booking)
      if (updates.check_in || updates.check_out) {
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('start_at, end_at, order_items!inner(resource_id)')
          .eq('id', id)
          .single();
        const curr = currentOrder as { start_at?: string; end_at?: string; order_items?: { resource_id: string }[] } | null;
        const propertyId = curr?.order_items?.[0]?.resource_id;
        const checkIn = updates.check_in ?? curr?.start_at?.split('T')[0];
        const checkOut = updates.check_out ?? curr?.end_at?.split('T')[0];
        if (propertyId && checkIn && checkOut) {
          const checkInTime = (updates as Record<string, string>).check_in_time || '14:00';
          const checkOutTime = (updates as Record<string, string>).check_out_time || '12:00';
          const newStart = `${checkIn}T${checkInTime}:00Z`;
          const newEnd = `${checkOut}T${checkOutTime}:00Z`;

          const { data: ordersInRange } = await supabase
            .from('orders')
            .select('id')
            .eq('vertical', 'property')
            .is('deleted_at', null)
            .not('status', 'eq', 'cancelled')
            .neq('id', id)
            .gt('end_at', newStart)
            .lt('start_at', newEnd);

          const orderIds = (ordersInRange || []).map((o: { id: string }) => o.id);
          const overlappingForProperty = orderIds.length
            ? (await supabase
                .from('order_items')
                .select('order_id')
                .eq('item_type', 'property')
                .eq('resource_id', propertyId)
                .in('order_id', orderIds)).data || []
            : [];
          if (overlappingForProperty.length > 0) {
            throw new Error('Выбранные даты пересекаются с существующим бронированием');
          }

          const { data: blockedDates } = await supabase
            .from('property_availability')
            .select('date')
            .eq('property_id', propertyId)
            .eq('status', 'blocked')
            .gte('date', checkIn)
            .lte('date', checkOut);
          if ((blockedDates || []).length > 0) {
            throw new Error('Выбранные даты заблокированы в календаре');
          }
        }
      }

      // Update the order
      const orderUpdates: Record<string, string | number> = {};
      if (updates.check_in) {
        // Preserve custom check-in time from metadata if available
        const checkInTime = (updates as Record<string, string>).check_in_time || '14:00';
        orderUpdates.start_at = `${updates.check_in}T${checkInTime}:00Z`;
      }
      if (updates.check_out) {
        const checkOutTime = (updates as Record<string, string>).check_out_time || '12:00';
        orderUpdates.end_at = `${updates.check_out}T${checkOutTime}:00Z`;
      }
      if (updates.total_amount !== undefined) orderUpdates.total_amount = updates.total_amount;
      if (updates.currency) orderUpdates.currency = updates.currency;
      if (updates.status) orderUpdates.status = updates.status;
      if (updates.notes !== undefined) orderUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('orders')
        .update(orderUpdates as never)
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

  // Bulk update booking statuses
  const bulkUpdateBookings = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string; }) => {
      if (!ids.length) return;
      // bookings are stored in the orders table; ids are order IDs
      const { error } = await supabase
        .from('orders')
        .update({ status: status as Database['public']['Enums']['order_status'] })
        .in('id', ids);
      if (error) {
        errorLog.silent(error, 'bulk_update_bookings');
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
    error,
    refetch,
    createBooking: createBooking.mutateAsync,
    updateBooking: updateBooking.mutateAsync,
    deleteBooking: deleteBooking.mutateAsync,
    isCreating: createBooking.isPending,
    isUpdating: updateBooking.isPending,
    isDeleting: deleteBooking.isPending,
    bulkUpdateBookings: bulkUpdateBookings.mutateAsync,
    isBulkUpdating: bulkUpdateBookings.isPending,
    getBookingsForMonth,
    isDateBooked,
    getBookingForDate,
  };
}

// Hook for all owner's bookings across all properties
export function useAllPropertyBookings() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id ?? null;

  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['all-property-bookings', user?.id, activeCompanyId],
    queryFn: async () => {
      if (!user?.id) return [];

      // Use unified access layer (owned + delegated + MC company)
      const { allIds: propertyIds } = await getAccessiblePropertyIds({
        userId: user.id,
        activeCompanyId,
      });

      if (!propertyIds.length) return [];

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

      // P1 FIX: Batch property lookup instead of N+1 queries
      const resourceIds = [...new Set(
        (data || [])
          .map(order => order.order_items?.[0]?.resource_id)
          .filter(Boolean) as string[]
      )];

      let propertiesMap: Record<string, { id: string; title: string; title_ru: string | null; address: string | null; cover_image: string | null }> = {};
      
      if (resourceIds.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, title_en, title_ru, address, cover_image')
          .in('id', resourceIds);
        
        propertiesMap = (props || []).reduce((acc, prop) => {
          acc[prop.id] = { ...prop, title: prop.title_en };
          return acc;
        }, {} as typeof propertiesMap);
      }

      // Map orders with pre-fetched property data
      const enrichedData = (data || []).map(order => {
        const resourceId = order.order_items?.[0]?.resource_id;
        const propertyData = resourceId ? propertiesMap[resourceId] || null : null;
        
        return {
          ...mapOrderToBooking(order, resourceId || ''),
          owner_properties: propertyData,
        };
      });

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
    error,
    refetch,
  };
}

// Hook for guest's bookings (where user is the guest)
export function useGuestPropertyBookings() {
  const { user } = useAuth();

  const { data: bookings, isLoading, error, refetch } = useQuery({
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

      // P1 FIX: Batch property lookup instead of N+1 queries
      const resourceIds = [...new Set(
        (data || [])
          .map(order => order.order_items?.[0]?.resource_id)
          .filter(Boolean) as string[]
      )];

      let propertiesMap: Record<string, { id: string; title: string; title_ru: string | null; address: string | null; cover_image: string | null; check_in_time: string | null; check_out_time: string | null }> = {};
      
      if (resourceIds.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, title_en, title_ru, address, cover_image, check_in_time, check_out_time')
          .in('id', resourceIds);
        
        propertiesMap = (props || []).reduce((acc, prop) => {
          acc[prop.id] = { ...prop, title: prop.title_en };
          return acc;
        }, {} as typeof propertiesMap);
      }

      // Map orders with pre-fetched property data
      const enrichedData = (data || []).map(order => {
        const resourceId = order.order_items?.[0]?.resource_id;
        const propertyData = resourceId ? propertiesMap[resourceId] || null : null;
        
        return {
          ...mapOrderToBooking(order, resourceId || ''),
          owner_properties: propertyData,
        };
      });

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
    error,
    refetch,
  };
}
