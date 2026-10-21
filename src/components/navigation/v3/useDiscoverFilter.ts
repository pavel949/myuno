/**
 * useDiscoverFilter — the shared UI state of the Discover surface.
 *
 * The search query and the selected situation live in the URL (`?q=`,
 * `?situation=`), not in component-local state. That gives three guarantees:
 *  1. every surface (list, cluster sections, map link, analytics) reads the
 *     exact same filter values from one place;
 *  2. browser back/forward restores the previous filter automatically — no
 *     re-application, no effect that re-runs the filter on mount;
 *  3. a filtered view is shareable and reload-safe.
 */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DISCOVER_QUERY_PARAM,
  DISCOVER_SITUATION_PARAM,
  buildSituationFilterSearch,
  parseSituationFilter,
  buildSituationMapUrl,
  type SituationFilterState,
} from '@/lib/navigation/situationUrls';

export interface DiscoverFilter {
  /** Current free-text query (always trimmed at the edges of the URL). */
  query: string;
  /** Currently selected situation code, or '' when none. */
  selectedSituation: string;
  /** Filter state object, ready to hand to any URL builder / analytics call. */
  filter: { query: string; situation: string };
  setQuery: (next: string) => void;
  setSelectedSituation: (next: string | null) => void;
  clear: () => void;
  /** Map URL carrying the currently applied filter. */
  mapUrl: string;
}

export function useDiscoverFilter(): DiscoverFilter {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.toString();

  const filter = useMemo(() => parseSituationFilter(new URLSearchParams(raw)), [raw]);

  const apply = useCallback(
    (next: SituationFilterState) => {
      const params = new URLSearchParams(raw);
      const merged = buildSituationFilterSearch({
        query: next.query ?? filter.query,
        situation: next.situation ?? filter.situation,
      });
      const nextParams = new URLSearchParams(merged);
      // Preserve unrelated params (utm, ref, …) that other surfaces may rely on.
      params.delete(DISCOVER_QUERY_PARAM);
      params.delete(DISCOVER_SITUATION_PARAM);
      for (const [k, v] of nextParams.entries()) params.set(k, v);
      // Typing must not flood history — replace instead of push.
      setSearchParams(params, { replace: true });
    },
    [raw, filter.query, filter.situation, setSearchParams],
  );

  const setQuery = useCallback((next: string) => apply({ query: next }), [apply]);

  const setSelectedSituation = useCallback(
    (next: string | null) => apply({ situation: next ?? '' }),
    [apply],
  );

  const clear = useCallback(() => apply({ query: '', situation: '' }), [apply]);

  return {
    query: filter.query,
    selectedSituation: filter.situation,
    filter,
    setQuery,
    setSelectedSituation,
    clear,
    mapUrl: buildSituationMapUrl(filter),
  };
}
