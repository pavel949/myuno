/**
 * Orders repository — read hooks for order-confirmation surfaces.
 *
 * Follows the src/data/ contract (see src/data/README.md). Replaces the
 * useState/useEffect order-polling that was duplicated across the per-vertical
 * "*OrderSuccess" pages.
 *
 * Note on polling: the legacy pages polled by Stripe session id up to 10×/2s
 * then gave up. `useOrderBySession` uses TanStack `refetchInterval`, which polls
 * until the order row lands (the webhook usually creates it within seconds) and
 * stops automatically on unmount — no arbitrary 20s give-up. This is the
 * idiomatic "poll until ready" shape and a small UX improvement.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

interface OrderBySessionArgs {
  /** Stripe Checkout session id (from the success-page query string). */
  sessionId: string | null;
  /** Supabase `select(...)` projection — pass exactly what the page renders. */
  columns: string;
  /** Optional `order_type` filter. */
  orderType?: string;
  /** Column or JSON path to match the session id against. */
  sessionColumn?: string;
  /** Poll interval while the order has not yet appeared. */
  pollMs?: number;
}

/**
 * Poll `orders` for the row created by a Stripe Checkout session. Returns
 * `{ order, isResolving }` where `isResolving` stays true until the row appears
 * (mirrors the legacy "loading until found" spinner), or false when there is no
 * session id.
 */
export function useOrderBySession<T = Record<string, unknown>>({
  sessionId,
  columns,
  orderType,
  sessionColumn = 'stripe_session_id',
  pollMs = 2000,
}: OrderBySessionArgs): { order: T | null; isResolving: boolean } {
  const query = useQuery({
    queryKey: ['order-by-session', orderType ?? null, sessionColumn, sessionId],
    enabled: !!sessionId,
    gcTime: CACHE_PROFILES.DYNAMIC.gcTime,
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<T | null> => {
      let q = supabase.from('orders').select(columns);
      if (orderType) q = q.eq('order_type', orderType);
      const { data, error } = await q.filter(sessionColumn, 'eq', sessionId!).limit(1);
      if (error) throw error;
      return (data?.[0] as T | undefined) ?? null;
    },
    refetchInterval: (q) => (q.state.data ? false : pollMs),
  });

  return { order: (query.data as T | null) ?? null, isResolving: !!sessionId && !query.data };
}

interface OrderByIdArgs {
  orderId: string | null;
  columns: string;
}

/** Fetch a single order by id. Returns `{ order, isLoading }`. */
export function useOrderById<T = Record<string, unknown>>({
  orderId,
  columns,
}: OrderByIdArgs): { order: T | null; isLoading: boolean } {
  const query = useQuery({
    queryKey: ['order-by-id', orderId, columns],
    enabled: !!orderId,
    ...CACHE_PROFILES.DYNAMIC,
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await supabase.from('orders').select(columns).eq('id', orderId!).single();
      if (error) throw error;
      return (data as T) ?? null;
    },
  });

  return { order: (query.data as T | null) ?? null, isLoading: !!orderId && query.isLoading };
}
