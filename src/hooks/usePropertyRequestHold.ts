import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { readFunctionErrorCode } from '@/lib/functionError';
import { readRequestHoldView, requestHoldPhase, secondsUntilDeadline, type RequestHoldPhase } from '@/lib/property/bookingMode';

const POLL_MS = 5_000;
const LIVE_PHASES: readonly RequestHoldPhase[] = ['awaiting_card', 'awaiting_reply', 'confirming'];

export type RequestDecision = 'accept' | 'decline' | 'expire';

/**
 * Live state of a request-to-book card hold for the signed-in actor.
 * The row is read under the actor's own RLS; nothing here grants access.
 */
export function usePropertyRequestHold(orderId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['property-request-hold', user?.id, orderId];

  const query = useQuery({
    queryKey,
    enabled: !!user && !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('id, status, metadata').eq('id', orderId!).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Booking request not found');
      const hold = readRequestHoldView(data.metadata);
      return { phase: requestHoldPhase(data.status, hold), replyDeadlineAt: hold?.replyDeadlineAt ?? null };
    },
    refetchInterval: current => (current.state.data && !LIVE_PHASES.includes(current.state.data.phase) ? false : POLL_MS),
  });

  const phase = query.data?.phase;
  const replyDeadlineAt = query.data?.replyDeadlineAt ?? null;

  // The clock is an external system: tick once a second while a reply is due.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== 'awaiting_reply') return;
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [phase]);
  const secondsLeft = phase === 'awaiting_reply' ? secondsUntilDeadline(replyDeadlineAt, now) : null;

  const decide = useMutation({
    mutationFn: async (decision: RequestDecision) => {
      const { data, error } = await supabase.functions.invoke('property-booking-request-decision', {
        body: { order_id: orderId, decision },
      });
      if (error) throw new Error(await readFunctionErrorCode(error) ?? 'request_failed');
      return data;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // When the window closes with no reply, release the hold without waiting
  // for the scheduled sweep. The server re-checks the deadline; this is only a trigger.
  const expiryRequested = useRef<string | null>(null);
  const { mutate } = decide;
  useEffect(() => {
    if (secondsLeft !== 0 || !orderId || expiryRequested.current === orderId) return;
    expiryRequested.current = orderId;
    mutate('expire');
  }, [secondsLeft, orderId, mutate]);

  return { phase, secondsLeft, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch, decide };
}
