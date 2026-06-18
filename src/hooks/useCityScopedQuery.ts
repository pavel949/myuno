/**
 * @module useCityScopedQuery
 * @description React Query wrapper that auto-injects `currentCity.id`
 * into Supabase queries and disables the query until the city is resolved.
 *
 * Phase 1 of multi-location rollout — standard helper for `.eq('city_id', ...)`
 * across all marketplace/discovery hooks.
 *
 * Usage:
 *   const { data } = useCityScopedQuery(
 *     ['properties', filters],
 *     async (cityId) =>
 *       supabase.from('properties').select('*').eq('city_id', cityId),
 *   );
 *
 * The query key automatically prepends `cityId` so cache invalidates on
 * city switch.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useLocation } from '@/contexts/LocationContext';

export function useCityScopedQuery<TData>(
  key: readonly unknown[],
  fetcher: (cityId: string) => Promise<{ data: TData | null; error: unknown }>,
  options: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn' | 'enabled'> & {
    enabled?: boolean;
  } = {},
) {
  const { currentCity } = useLocation();
  const cityId = currentCity?.id ?? null;

  return useQuery<TData, Error>({
    queryKey: ['city', cityId, ...key],
    enabled: !!cityId && (options.enabled ?? true),
    queryFn: async () => {
      if (!cityId) throw new Error('No active city');
      const { data, error } = await fetcher(cityId);
      if (error) throw error instanceof Error ? error : new Error(String(error));
      return data as TData;
    },
    ...options,
  });
}
