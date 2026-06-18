/**
 * useUrlFilterState — sync catalog state (search, category, view, filters)
 * with URL query params. Enables shareable & SEO-friendly catalog URLs.
 *
 * URL schema:
 *   ?q=<search>&cat=<category>&view=list|map&f.<sectionId>=<csv values>
 *
 * Example: /restaurants?q=sushi&cat=all&view=map&f.cuisine=japanese,thai&f.features=sea_view
 */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterValues } from '@/components/filters/UniversalFilter';

export type CatalogView = 'list' | 'map';

export interface UrlFilterState {
  search: string;
  category: string;
  view: CatalogView;
  filters: FilterValues;
}

interface Options {
  defaultCategory?: string;
  defaultView?: CatalogView;
}

const FILTER_PREFIX = 'f.';

export function useUrlFilterState(opts: Options = {}) {
  const { defaultCategory = 'all', defaultView = 'list' } = opts;
  const [params, setParams] = useSearchParams();

  const state: UrlFilterState = useMemo(() => {
    const filters: FilterValues = {};
    params.forEach((value, key) => {
      if (!key.startsWith(FILTER_PREFIX)) return;
      const sectionId = key.slice(FILTER_PREFIX.length);
      if (!value) return;
      const parts = value.split(',').filter(Boolean);
      filters[sectionId] = parts.length === 1 ? parts[0] : parts;
    });
    return {
      search: params.get('q') ?? '',
      category: params.get('cat') ?? defaultCategory,
      view: (params.get('view') as CatalogView) === 'map' ? 'map' : defaultView,
      filters,
    };
  }, [params, defaultCategory, defaultView]);

  const update = useCallback(
    (partial: Partial<UrlFilterState>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          if (partial.search !== undefined) {
            if (partial.search) next.set('q', partial.search);
            else next.delete('q');
          }
          if (partial.category !== undefined) {
            if (partial.category && partial.category !== defaultCategory) {
              next.set('cat', partial.category);
            } else {
              next.delete('cat');
            }
          }
          if (partial.view !== undefined) {
            if (partial.view !== defaultView) next.set('view', partial.view);
            else next.delete('view');
          }
          if (partial.filters !== undefined) {
            // Wipe existing filter keys, then re-set from new values
            Array.from(next.keys())
              .filter((k) => k.startsWith(FILTER_PREFIX))
              .forEach((k) => next.delete(k));
            Object.entries(partial.filters).forEach(([sectionId, value]) => {
              if (value == null) return;
              const csv = Array.isArray(value) ? value.join(',') : String(value);
              if (csv) next.set(`${FILTER_PREFIX}${sectionId}`, csv);
            });
          }

          return next;
        },
        { replace: true },
      );
    },
    [setParams, defaultCategory, defaultView],
  );

  const setSearch = useCallback((q: string) => update({ search: q }), [update]);
  const setCategory = useCallback((cat: string) => update({ category: cat }), [update]);
  const setView = useCallback((view: CatalogView) => update({ view }), [update]);
  const setFilters = useCallback((filters: FilterValues) => update({ filters }), [update]);
  const reset = useCallback(
    () => update({ search: '', category: defaultCategory, view: defaultView, filters: {} }),
    [update, defaultCategory, defaultView],
  );

  const activeFilterCount = useMemo(() => {
    return Object.values(state.filters).reduce<number>((acc, v) => {
      if (v == null) return acc;
      if (Array.isArray(v)) return acc + v.length;
      return acc + 1;
    }, 0);
  }, [state.filters]);

  return { ...state, setSearch, setCategory, setView, setFilters, reset, activeFilterCount };
}
