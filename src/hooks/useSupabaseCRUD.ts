import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseSupabaseCRUDOptions {
  table: string;
  providerId?: string;
  providerIdField?: string;
  orderByColumn?: string;
  orderAscending?: boolean;
  select?: string;
  enabled?: boolean;
}

interface CRUDResult<T> {
  items: T[];
  isLoading: boolean;
  create: (data: Partial<T>) => Promise<{ data: T | null; error: Error | null }>;
  update: (id: string, data: Partial<T>) => Promise<{ data: T | null; error: Error | null }>;
  remove: (id: string) => Promise<{ error: Error | null }>;
  refetch: () => Promise<void>;
}

/**
 * Generic CRUD hook for Supabase tables
 * Eliminates duplicate code across vendor/admin hooks
 */
export function useSupabaseCRUD<T extends { id: string }>({
  table,
  providerId,
  providerIdField = 'provider_id',
  orderByColumn = 'created_at',
  orderAscending = false,
  select = '*',
  enabled = true,
}: UseSupabaseCRUDOptions): CRUDResult<T> {
  const { user } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchItems = useCallback(async () => {
    if (!user || !enabled) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const baseQuery = supabase.from(table as any).select(select);
      
      const query = providerId 
        ? baseQuery.eq(providerIdField, providerId)
        : baseQuery;

      const { data, error } = await query.order(orderByColumn, { ascending: orderAscending });

      if (error) throw error;

      if (isMountedRef.current) {
        setItems((data || []) as unknown as T[]);
      }
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      if (isMountedRef.current) {
        setItems([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, enabled, table, providerId, providerIdField, select, orderByColumn, orderAscending]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchItems();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchItems]);

  const create = useCallback(async (data: Partial<T>) => {
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    try {
      const insertData = { ...data } as Record<string, unknown>;
      if (providerId) {
        insertData[providerIdField] = providerId;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await supabase
        .from(table as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await fetchItems();
      return { data: result as unknown as T, error: null };
    } catch (err) {
      console.error(`Error creating ${table}:`, err);
      return { data: null, error: err as Error };
    }
  }, [user, table, providerId, providerIdField, fetchItems]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await supabase
        .from(table as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchItems();
      return { data: result as unknown as T, error: null };
    } catch (err) {
      console.error(`Error updating ${table}:`, err);
      return { data: null, error: err as Error };
    }
  }, [table, fetchItems]);

  const remove = useCallback(async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchItems();
      return { error: null };
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
      return { error: err as Error };
    }
  }, [table, fetchItems]);

  return {
    items,
    isLoading,
    create,
    update,
    remove,
    refetch: fetchItems,
  };
}
