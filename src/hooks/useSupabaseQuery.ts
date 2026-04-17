import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'or';

export interface QueryFilter {
  column: string;
  value: string | boolean | number;
  operator?: FilterOperator;
}

interface UseSupabaseQueryOptions<T> {
  table: string;
  select?: string;
  filters?: QueryFilter[];
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  enabled?: boolean;
  transform?: (data: unknown[]) => T[];
}

interface QueryResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Generic Supabase query hook for read-only list queries
 * Eliminates duplicate fetching patterns across hooks
 */
export function useSupabaseQuery<T>({
  table,
  select = '*',
  filters = [],
  orderBy,
  limit,
  enabled = true,
  transform,
}: UseSupabaseQueryOptions<T>): QueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  
  // Store transform in ref to avoid re-fetching when transform changes
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Memoize filters to prevent unnecessary re-fetches
  const stableFilters = useMemo(() => JSON.stringify(filters), [filters]);
  const stableOrderBy = useMemo(() => JSON.stringify(orderBy), [orderBy]);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase.from(table as any).select(select);

      // Apply filters
      const parsedFilters: QueryFilter[] = JSON.parse(stableFilters);
      for (const filter of parsedFilters) {
        if (filter.value === undefined || filter.value === null) continue;
        
        switch (filter.operator) {
          case 'neq':
            query = query.neq(filter.column, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.column, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.column, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.column, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.column, filter.value);
            break;
          case 'like':
            query = query.like(filter.column, `%${filter.value}%`);
            break;
          case 'ilike':
            query = query.ilike(filter.column, `%${filter.value}%`);
            break;
          case 'or':
            query = query.or(String(filter.value));
            break;
          default:
            query = query.eq(filter.column, filter.value);
        }
      }

      // Apply ordering
      const parsedOrderBy = stableOrderBy ? JSON.parse(stableOrderBy) : null;
      if (parsedOrderBy?.column) {
        query = query.order(parsedOrderBy.column, { ascending: parsedOrderBy.ascending ?? true });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;

      if (isMountedRef.current) {
        const finalData = transformRef.current 
          ? transformRef.current(result || []) 
          : (result || []) as unknown as T[];
        setData(finalData);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
        setError(err instanceof Error ? err : new Error(errMsg));
        setData([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [table, select, stableFilters, stableOrderBy, limit, enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Generic Supabase query hook for fetching a single record by ID
 */
interface UseSingleQueryOptions<T> {
  table: string;
  id: string | undefined;
  select?: string;
  transform?: (data: unknown) => T;
}

interface SingleQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useSupabaseSingle<T>({
  table,
  id,
  select = '*',
  transform,
}: UseSingleQueryOptions<T>): SingleQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
         
        const { data: result, error: queryError } = await supabase
          .from(table as any)
          .select(select)
          .eq('id', id)
          .single();

        if (queryError) throw queryError;

        if (isMounted) {
          const finalData = transform ? transform(result) : (result as unknown as T);
          setData(finalData);
        }
      } catch (err) {
        console.error(`Error fetching ${table} by ID:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, id, select]);

  return { data, isLoading, error };
}
