import { useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Order, OrderStatus } from './useOrders';

export interface OrderTimelineEvent {
  status: string;
  actor_name: string;
  reason: string | null;
  created_at: string;
}

export interface OrderTrackingData {
  order: Order | null;
  timeline: OrderTimelineEvent[];
  isLoading: boolean;
  error: Error | null;
}

const STATUS_SEQUENCE: OrderStatus[] = [
  'pending',
  'confirmed', 
  'in_progress',
  'completed'
];

export function useOrderTracking(orderId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();
  const actorId = user?.id;
  const { data: order, isLoading: orderLoading, error, refetch } = useQuery({
    queryKey: ['order-tracking', actorId, orderId],
    queryFn: async ({ signal }) => {
      if (!orderId || !actorId) return null;
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*), order_participants(*), order_addresses(*)`)
        .eq('id', orderId)
        .abortSignal(signal)
        .maybeSingle();
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (error) throw error;
      return data as Order | null;
    },
    enabled: !!orderId && !!actorId && !authLoading,
  });
  // No RPC is issued until this actor can read the authoritative order row.
  const authorizedOrder = actorId && !authLoading && !error ? order ?? null : null;
  const { data: timeline, error: timelineError, isLoading: timelineLoading, refetch: fetchTimeline } = useQuery({
    queryKey: ['order-tracking-timeline', actorId, orderId],
    queryFn: async ({ signal }) => {
      if (!authorizedOrder || !actorId || !orderId) return [];
      const { data, error } = await supabase.rpc('get_order_timeline', { p_order_id: orderId }).abortSignal(signal);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (error) throw error;
      return (data ?? []) as OrderTimelineEvent[];
    },
    enabled: !!authorizedOrder,
  });

  // Keep stable refs for callbacks to avoid re-subscribing on every render
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const fetchTimelineRef = useRef(fetchTimeline);
  fetchTimelineRef.current = fetchTimeline;

  // Real-time subscription for order updates
  useEffect(() => {
    if (!orderId || !authorizedOrder) return;

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          refetchRef.current();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_status_history',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchTimelineRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, actorId, authorizedOrder]);

  // Calculate progress percentage
  const getProgressPercentage = useCallback((status: OrderStatus): number => {
    const index = STATUS_SEQUENCE.indexOf(status);
    if (index === -1) return 0;
    return ((index + 1) / STATUS_SEQUENCE.length) * 100;
  }, []);

  // Check if a status is completed
  const isStatusCompleted = useCallback((status: OrderStatus, currentStatus: OrderStatus): boolean => {
    const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
    const checkIndex = STATUS_SEQUENCE.indexOf(status);
    return checkIndex <= currentIndex;
  }, []);

  return {
    order: authorizedOrder,
    timeline: authorizedOrder && !timelineError ? timeline ?? [] : [],
    timelineError: authorizedOrder ? timelineError : null,
    timelineLoading: !!authorizedOrder && timelineLoading,
    retryTimeline: fetchTimeline,
    isLoading: !!authLoading || (!!actorId && orderLoading),
    error,
    refetch,
    getProgressPercentage,
    isStatusCompleted,
    STATUS_SEQUENCE,
  };
}

/**
 * Hook to check restaurant availability for reservations
 */
export function useRestaurantAvailability(
  restaurantId: string | undefined,
  date: Date | undefined,
  time: string | undefined,
  covers: number = 2
) {
  return useQuery({
    queryKey: ['restaurant-availability', restaurantId, date?.toISOString(), time, covers],
    queryFn: async () => {
      if (!restaurantId || !date || !time) {
        return { available: true, spots_remaining: 30 };
      }

      const dateStr = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('check_restaurant_availability', {
        p_restaurant_id: restaurantId,
        p_date: dateStr,
        p_time: time,
        p_covers: covers,
      });

      if (error) {
        return { available: true, spots_remaining: 30 };
      }

      return data as { available: boolean; spots_remaining: number; max_covers?: number; reason?: string };
    },
    enabled: !!restaurantId && !!date && !!time,
    staleTime: 30000, // 30 seconds
  });
}
