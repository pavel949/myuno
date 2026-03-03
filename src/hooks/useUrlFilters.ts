import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useUrlFilters — persist filter state in URL search params.
 * Survives navigation (back/forward) and page refresh.
 *
 * Usage:
 *   const { getValue, setValue, getValues, setValues } = useUrlFilters();
 *   const status = getValue('status', 'all');
 *   setValue('status', 'active');
 */
export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getValue = useCallback(
    (key: string, fallback: string = ''): string => {
      return searchParams.get(key) ?? fallback;
    },
    [searchParams],
  );

  const setValue = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const setValues = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (!value || value === '') {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const clear = useCallback(
    (keys?: string[]) => {
      setSearchParams((prev) => {
        if (!keys) return new URLSearchParams();
        const next = new URLSearchParams(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  return { getValue, setValue, setValues, clear, searchParams };
}
