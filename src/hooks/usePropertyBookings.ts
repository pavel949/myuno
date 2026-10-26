import { useRef } from 'react';
import { addDays, isValid } from 'date-fns';
import { bangkokTodayISO, parseCivilDate, civilDateKey, civilStaysOverlap, stayOccupiesDate, toBangkokDateKey } from '@/lib/hotelDates';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { propertyOrderHoldsInventory } from '@/lib/propertyInventory';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { ManualBookingRequestIdentity, createManualBooking, executePropertyBookingChange, readPropertyBookingReply } from '@/lib/manualPropertyBooking';
import { getAccessiblePropertyIds } from '@/lib/getAccessiblePropertyIds';
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
  check_in_time?: string;
  check_out_time?: string;
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

/** Transient outcome of the existing preparation writes, not booking/inventory authority. */
export interface BookingPreparationOutcome {
  status: 'complete' | 'needs_attention' | 'not_requested';
  unconfirmedTaskTypes: string[];
  guestDetailsUnconfirmed?: boolean;
}

export type CreatedPropertyBooking = PropertyBooking & { preparation: BookingPreparationOutcome; replayed: boolean };

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
    check_in: toBangkokDateKey(order.start_at) || '',
    check_out: toBangkokDateKey(order.end_at) || '',
    check_in_time: typeof meta.check_in_time === 'string' ? meta.check_in_time : undefined,
    check_out_time: typeof meta.check_out_time === 'string' ? meta.check_out_time : undefined,
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

function requireStayDates(checkIn: string, checkOut: string) {
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && isValid(parseCivilDate(value)) && civilDateKey(parseCivilDate(value)) === value;
  if (!validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn)
    throw new Error('Укажите корректные даты: выезд должен быть позже заезда');
}

export function usePropertyBookings(propertyId?: string) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const manualRequest = useRef(new ManualBookingRequestIdentity());
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

      const selectedIds = propertyId ? [propertyId] : allPropertyIds;
      const [raw, checked] = await Promise.all([query,
        (supabase as unknown as {rpc(name:string,args:Record<string,unknown>):PromiseLike<{data:unknown;error:unknown}>}).rpc('list_property_reservations_checked',{p_property_ids:selectedIds}),
      ]);
      const {data,error}=raw;

      if (error) {
        errorLog.silent(error, 'fetch_bookings');
        throw error;
      }

      if (checked.error) throw checked.error;
      if (!Array.isArray(checked.data)) throw new Error('Checked property reservations unavailable');
      const merged = new Map<string,unknown>((data || []).map(order => [order.id,order]));
      for (const value of checked.data) {
        const id = (value as {order?:{id?:string}})?.order?.id;
        if (!id) throw new Error('Checked property reservation identity unavailable');
        const reply = readPropertyBookingReply(value,id);
        if (!selectedIds.includes(reply.order_items[0].resource_id)) throw new Error('Checked property reservation scope mismatch');
        merged.set(id,{...reply.order,order_items:reply.order_items,order_participants:reply.order_participants});
      }
      // Checked cohort rows override matching legacy raw projections by identity.
      return [...merged.values()].map((order) =>
        mapOrderToBooking(order, propertyId || '')
      );
    },
    enabled: !!user?.id,
  });

  const createBooking = useMutation({
    mutationFn: async (input: CreateBookingInput): Promise<CreatedPropertyBooking> => {
      if (!user?.id) throw new Error('Not authenticated');

      requireStayDates(input.check_in, input.check_out);

      const requestId = await manualRequest.current.forIntent(user.id, input);
      // No separate browser order/item/guest writes or raw-write fallback.
      // The reviewed RPC must be activated before this client is deployed.
      const result = await createManualBooking(supabase, requestId, input);
      const order = { ...result.order, order_participants: result.order_participants, order_items: result.order_items };
      manualRequest.current.acknowledge(requestId);
      const preparation: BookingPreparationOutcome = result.replayed && order.status === 'confirmed'
        ? { status: 'needs_attention', unconfirmedTaskTypes: ['cleaning', 'check_in', 'check_out'] }
        : { status: 'not_requested', unconfirmedTaskTypes: [] };

      // P1: Booking message rules — fire booking_confirmed for confirmed bookings
      if (!result.replayed && order.status === 'confirmed') {
        void Promise.resolve().then(() => supabase.functions.invoke('execute-booking-message-rules', {
          body: { immediate_order_id: order.id },
        })).then(({ error }) => {
          if (error) errorLog.silent(error, 'booking_message_rules');
        }).catch(error => errorLog.silent(error, 'booking_message_rules'));
      }

      // Preparation is secondary: a failed acknowledgement must never make callers
      // retry the already-persisted booking. Do not retry these non-idempotent inserts.
      // P1: Booking lifecycle automation — create operational tasks for check-in, check-out, cleaning
      if (!result.replayed && order.status === 'confirmed') {
        preparation.status = 'complete';
        const guestName = input.guest_name || 'Guest';
        const checkInDate = input.check_in;
        const checkOutDate = input.check_out;
        const cleaningDate = civilDateKey(addDays(parseCivilDate(checkInDate), -1));
        const today = bangkokTodayISO();
        const effectiveCleaningDate = cleaningDate < today ? today : cleaningDate;

        const tasks = [
          { task_type: 'cleaning', scheduled_date: effectiveCleaningDate, title: `Pre-arrival cleaning: ${guestName}`, title_ru: `Уборка перед заездом: ${guestName}` },
          { task_type: 'check_in', scheduled_date: checkInDate, title: `Check-in: ${guestName}`, title_ru: `Заезд: ${guestName}` },
          { task_type: 'check_out', scheduled_date: checkOutDate, title: `Check-out: ${guestName}`, title_ru: `Выезд: ${guestName}` },
        ];
        for (const t of tasks) {
          try {
            const { error } = await supabase.from('property_operational_tasks').insert({
              property_id: input.property_id,
              task_type: t.task_type,
              title: t.title,
              title_ru: t.title_ru,
              scheduled_date: t.scheduled_date,
              priority: t.task_type === 'check_out' ? 'normal' : 'high',
              status: 'pending',
            });
            if (error) throw error;
          } catch (error) {
            preparation.status = 'needs_attention';
            preparation.unconfirmedTaskTypes.push(t.task_type);
            errorLog.silent(error, 'create_booking_preparation_task');
          }
        }
      }

      if (preparation.guestDetailsUnconfirmed) preparation.status = 'needs_attention';
      return { ...mapOrderToBooking(order, input.property_id), preparation, replayed: result.replayed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-property-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['multi-property-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['guest-property-bookings', user?.id] });
    },
  });

  const changeBooking = async (id: string, updates: Partial<PropertyBooking>) => {
    if (!user?.id) throw new Error('Not authenticated');
    const patch: Record<string, unknown> = {};
    for (const field of ['check_in', 'check_out', 'check_in_time', 'check_out_time', 'guest_name', 'guest_phone', 'guest_email', 'guests_count', 'total_amount', 'currency', 'status', 'notes'] as const) {
      if (updates[field] !== undefined) patch[field] = updates[field];
    }
    if (typeof patch.check_in === 'string' && typeof patch.check_out === 'string') requireStayDates(patch.check_in, patch.check_out);
    const expected = updates.updated_at || bookings?.find(booking => booking.id === id)?.updated_at;
    const result = await executePropertyBookingChange(supabase, user.id, id, patch, expected);
    return mapOrderToBooking({ ...result.order, order_participants: result.order_participants, order_items: result.order_items }, updates.property_id || '');
  };
  const invalidateBookings = () => {
    queryClient.invalidateQueries({ queryKey: ['property-bookings', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['all-property-bookings', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['multi-property-bookings', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['guest-property-bookings', user?.id] });
  };
  const updateBooking = useMutation({
    mutationFn: ({ id, ...updates }: Partial<PropertyBooking> & { id: string }) => changeBooking(id, updates),
    onSuccess: invalidateBookings,
  });
  // The existing delete action now cancels through the checked inventory writer.
  // It never hides a still-reserved stay by setting deleted_at.
  const deleteBooking = useMutation({
    mutationFn: (id: string) => changeBooking(id, { status: 'cancelled' }),
    onSuccess: invalidateBookings,
  });
  const bulkUpdateBookings = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      // Each order has its own authorized CAS/receipt. This is deliberately not
      // an all-or-nothing bulk transaction; refresh even on partial failure.
      try { for (const id of [...new Set(ids)]) await changeBooking(id, { status }); }
      finally { invalidateBookings(); }
    },
  });

  // Get bookings for a specific month
  const getBookingsForMonth = (year: number, month: number): PropertyBooking[] => {
    if (!bookings) return [];
    
    const monthWindow = {
      check_in: civilDateKey(new Date(year, month, 1)),
      check_out: civilDateKey(new Date(year, month + 1, 1)),
    };
    return bookings.filter(booking => civilStaysOverlap(booking, monthWindow));
  };

  // Check if a date is booked
  const isDateBooked = (date: Date, excludeId?: string): boolean => {
    if (!bookings) return false;
    
    const dateStr = civilDateKey(date);
    
    return bookings.some(booking => {
      if (excludeId && booking.id === excludeId) return false;
      return propertyOrderHoldsInventory(booking.status) && stayOccupiesDate(booking, dateStr);
    });
  };

  // Get booking for a specific date
  const getBookingForDate = (date: Date): PropertyBooking | undefined => {
    if (!bookings) return undefined;
    
    const dateStr = civilDateKey(date);
    
    return bookings.find(booking => 
      propertyOrderHoldsInventory(booking.status) && stayOccupiesDate(booking, dateStr)
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
    b.check_in > bangkokTodayISO() && propertyOrderHoldsInventory(b.status) && !['completed', 'checked_out'].includes(b.status ?? '')
  ) || [];

  // Active bookings (currently checked in)
  const activeBookings = bookings?.filter(b => {
    const today = bangkokTodayISO();
    return b.check_in <= today && b.check_out > today && propertyOrderHoldsInventory(b.status) && !['completed', 'checked_out'].includes(b.status ?? '');
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

      // Display enrichment uses only the public projection. Orders remain authoritative.
      const propertyItem = (order: NonNullable<typeof data>[number]) =>
        order.order_items?.find(item => item.item_type === 'property');
      const resourceIds = [...new Set((data || []).map(order => propertyItem(order)?.resource_id).filter((id): id is string => !!id))];
      const propertiesMap: Record<string, { id: string; title: string | null; title_ru: string | null; address: string | null; cover_image: string | null; check_in_time: string | null; check_out_time: string | null }> = {};
      let propertyNamesUnavailable = false;
      if (resourceIds.length > 0) {
        const { data: props, error: projectionError } = await supabase
          .from('public_property_catalog')
          .select('id, title_en, title_ru, address, cover_image, check_in_time, check_out_time')
          .in('id', resourceIds);
        propertyNamesUnavailable = !!projectionError;
        if (!projectionError) for (const prop of props || []) {
          if (prop.id) propertiesMap[prop.id] = { ...prop, id: prop.id, title: prop.title_en };
        }
      }
      const enrichedData = (data || []).map(order => {
        const item = propertyItem(order);
        const resourceId = item?.resource_id;
        // A stored human-readable name is a historical snapshot, never an identity/link.
        const storedName = item?.item_name?.trim();
        const historicalPropertyName = storedName && !/^property booking$/i.test(storedName) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storedName) ? storedName : null;
        return {
          ...mapOrderToBooking(order, resourceId || ''),
          owner_properties: resourceId ? propertiesMap[resourceId] || null : null,
          historicalPropertyName,
          propertyNamesUnavailable,
        };
      });

      return enrichedData;
    },
    enabled: !!user?.id,
  });

  // Upcoming bookings
  const upcomingBookings = bookings?.filter(b => 
    b.check_in > bangkokTodayISO() && propertyOrderHoldsInventory(b.status) && !['completed', 'checked_out'].includes(b.status ?? '')
  ) || [];

  // Active bookings (currently checked in)
  const activeBookings = bookings?.filter(b => {
    const today = bangkokTodayISO();
    return b.check_in <= today && b.check_out > today && propertyOrderHoldsInventory(b.status) && !['completed', 'checked_out'].includes(b.status ?? '');
  }) || [];

  // Past bookings
  const pastBookings = bookings?.filter(b => 
    b.check_out <= bangkokTodayISO() || ['completed', 'checked_out'].includes(b.status ?? '')
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
