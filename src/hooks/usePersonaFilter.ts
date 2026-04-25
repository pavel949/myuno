/**
 * @hook usePersonaFilter
 * @description Reads `?persona=<slug>` from the URL and exposes a tiny,
 * generic filter API so any catalog page can become persona-aware in 1–3 lines.
 *
 * Design contract (from /persona-tagged discovery plan):
 *  - If `?persona=` is absent → no filtering, returns the original list.
 *  - If `?persona=` is present BUT no listings carry the matched tag(s) →
 *    returns the original list (graceful "show all offers" fallback).
 *  - Otherwise → returns the filtered subset.
 *
 * `applyFilter(items, getTags)` is generic so it works against `tags`,
 * `persona_tags`, or any other string-array column on the item.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resolvePersonaSlug } from '@/lib/landings/slugAliases';
import { getPersonaListingTags } from '@/lib/landings/personaTagMap';

export interface UsePersonaFilterResult {
  /** Resolved canonical persona slug (after alias resolution), or null. */
  personaSlug: string | null;
  /** Tag vocabulary to filter by. Empty when no persona is active. */
  personaTags: string[];
  /**
   * Apply persona filter to a list of items. `getTags` returns the tag-array
   * to test against (e.g. `(item) => item.persona_tags ?? item.tags ?? []`).
   * Falls back to the original list when no items match.
   */
  applyFilter<T>(items: T[], getTags: (item: T) => string[] | null | undefined): T[];
  /** Remove `?persona=` from the URL (for the "Clear" chip action). */
  clearPersona: () => void;
}

export function usePersonaFilter(): UsePersonaFilterResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('persona');

  const personaSlug = useMemo(() => {
    if (!raw) return null;
    return resolvePersonaSlug(raw);
  }, [raw]);

  const personaTags = useMemo(
    () => (personaSlug ? getPersonaListingTags(personaSlug) : []),
    [personaSlug],
  );

  const applyFilter = useCallback(
    function applyFilterImpl<T>(
      items: T[],
      getTags: (item: T) => string[] | null | undefined,
    ): T[] {
      if (!personaSlug || personaTags.length === 0) return items;
      const tagSet = new Set(personaTags.map((t) => t.toLowerCase()));
      const matched = items.filter((item) => {
        const itemTags = getTags(item);
        if (!itemTags || itemTags.length === 0) return false;
        return itemTags.some((t) => tagSet.has(String(t).toLowerCase()));
      });
      // Graceful fallback — never strand the user with an empty catalog.
      return matched.length > 0 ? matched : items;
    },
    [personaSlug, personaTags],
  );

  const clearPersona = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('persona');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return { personaSlug, personaTags, applyFilter, clearPersona };
}
