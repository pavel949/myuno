import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Public calendar RPC includes manual blocks, orders and imported calendars.
 * Only occupied nights in [checkIn, checkOut) exclude a home; checkout-only
 * dates permit a new arrival. Unknown/error/pending responses never mean free.
 */
export const SEARCH_AVAILABILITY_TIMEOUT_MS = 10_000;
export const SEARCH_AVAILABILITY_CONCURRENCY = 4;

export function createAvailabilityLimiter(limit = SEARCH_AVAILABILITY_CONCURRENCY) {
  let active = 0;
  const queue: Array<() => void> = [];
  const drain = () => { while (active < limit && queue.length) queue.shift()!(); };
  return <T,>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> => new Promise((resolve, reject) => {
    const cancel = () => {
      const index = queue.indexOf(start);
      if (index >= 0) queue.splice(index, 1);
      reject(new DOMException('Availability check cancelled', 'AbortError'));
    };
    const start = () => {
      signal?.removeEventListener('abort', cancel);
      if (signal?.aborted) { cancel(); return; }
      active += 1;
      Promise.resolve().then(task).then(resolve, reject).finally(() => { active -= 1; drain(); });
    };
    if (signal?.aborted) { cancel(); return; }
    signal?.addEventListener('abort', cancel, { once: true });
    queue.push(start);
    drain();
  });
}

export async function checkSearchPropertyAvailability(id: string, checkIn: string, checkOut: string, signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Availability check cancelled', 'AbortError');
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let cancel: () => void = () => undefined;
  const interrupted = new Promise<never>((_resolve, reject) => {
    cancel = () => {
      controller.abort();
      reject(new DOMException('Availability check cancelled', 'AbortError'));
    };
    signal?.addEventListener('abort', cancel, { once: true });
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error('Availability check timed out'));
    }, SEARCH_AVAILABILITY_TIMEOUT_MS);
  });
  const request = Promise.resolve().then(() => supabase.rpc('get_property_unavailable_dates', {
    p_property_id: id, p_from: checkIn, p_to: checkOut,
  }).abortSignal(controller.signal));
  const { data, error } = await Promise.race([request, interrupted]).finally(() => {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Availability response missing');
  for (const row of data) {
    if (!row || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !['booked', 'blocked', 'checkout_only'].includes(row.kind)) {
      throw new Error('Invalid availability response');
    }
  }
  return !data.some(row => row.date >= checkIn && row.date < checkOut && row.kind !== 'checkout_only');
}

export function useSearchPropertyAvailability(ids: string[], checkIn?: string, checkOut?: string) {
  const schedule = useMemo(() => createAvailabilityLimiter(), []);
  const enabled = !!checkIn && !!checkOut && checkIn < checkOut;
  const uniqueIds = [...new Set(ids)];
  const queries = useQueries({ queries: enabled ? uniqueIds.map(id => ({
    queryKey: ['search-property-availability', id, checkIn, checkOut],
    queryFn: ({ signal }: { signal: AbortSignal }) => schedule(() => checkSearchPropertyAvailability(id, checkIn!, checkOut!, signal), signal),
    staleTime: 30_000,
    retry: 1,
  })) : [] });
  return {
    enabled,
    availableIds: new Set(uniqueIds.filter((_, index) => queries[index]?.isSuccess && !queries[index]?.isFetching && queries[index]?.data === true)),
    pending: queries.some(query => query.isPending || query.isFetching),
    failed: queries.some(query => query.isError && !query.isFetching),
    retry: () => Promise.all(queries.filter(query => query.isError).map(query => query.refetch())),
  };
}
