import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseSupabaseCRUDOptions {
  table: string;
  providerId?: string;
  providerIdField?: string;
  orderByColumn?: string;
  orderAscending?: boolean;
  select?: string;
  enabled?: boolean;
  showToasts?: boolean;
}

interface CRUDResult<T> {
  items: T[];
  isLoading: boolean;
  error: Error | null;
  create: (data: Partial<T>) => Promise<{ data: T | null; error: Error | null }>;
  update: (id: string, data: Partial<T>) => Promise<{ data: T | null; error: Error | null }>;
  remove: (id: string) => Promise<{ error: Error | null }>;
  refetch: () => Promise<void>;
}

/**
 * Generic CRUD hook for Supabase tables
 * Eliminates duplicate code across vendor/admin hooks
 * Includes improved error handling and optional toast notifications
 */
export function useSupabaseCRUD<T extends { id: string }>({
  table,
  providerId,
  providerIdField = 'provider_id',
  orderByColumn = 'created_at',
  orderAscending = false,
  select = '*',
  enabled = true,
  showToasts = false,
}: UseSupabaseCRUDOptions): CRUDResult<T> {
  const { user } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const handleError = useCallback((err: unknown, operation: string): Error => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const error = new Error(`${operation} failed: ${errorMessage}`);
    console.error(`Error in ${operation} for ${table}:`, err);
    
    if (showToasts) {
      toast.error(`${operation} failed`, { description: errorMessage });
    }
    
    return error;
  }, [table, showToasts]);

  const fetchItems = useCallback(async () => {
    if (!user || !enabled) {
      setItems([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const baseQuery = supabase.from(table as any).select(select);
      
      const query = providerId 
        ? baseQuery.eq(providerIdField, providerId)
        : baseQuery;

      const { data, error: queryError } = await query.order(orderByColumn, { ascending: orderAscending });

      if (queryError) throw queryError;

      if (isMountedRef.current) {
        setItems((data || []) as unknown as T[]);
        setError(null);
      }
    } catch (err) {
      const handledError = handleError(err, 'Fetch');
      if (isMountedRef.current) {
        setItems([]);
        setError(handledError);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, enabled, table, providerId, providerIdField, select, orderByColumn, orderAscending, handleError]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchItems();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchItems]);

  const create = useCallback(async (data: Partial<T>) => {
    if (!user) {
      const error = new Error('Not authenticated');
      if (showToasts) toast.error('Please sign in to continue');
      return { data: null, error };
    }

    try {
      const insertData = { ...data } as Record<string, unknown>;
      if (providerId) {
        insertData[providerIdField] = providerId;
      }
      
      // Auto-set pending status for vendor-created content (moderation workflow)
      if (providerId && !('approval_status' in insertData)) {
        insertData.approval_status = 'pending';
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: insertError } = await supabase
        .from(table as any)
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (showToasts) toast.success('Created successfully');
      await fetchItems();
      return { data: result as unknown as T, error: null };
    } catch (err) {
      return { data: null, error: handleError(err, 'Create') };
    }
  }, [user, table, providerId, providerIdField, fetchItems, showToasts, handleError]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: updateError } = await supabase
        .from(table as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (showToasts) toast.success('Updated successfully');
      await fetchItems();
      return { data: result as unknown as T, error: null };
    } catch (err) {
      return { data: null, error: handleError(err, 'Update') };
    }
  }, [table, fetchItems, showToasts, handleError]);

  const remove = useCallback(async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      if (showToasts) toast.success('Deleted successfully');
      await fetchItems();
      return { error: null };
    } catch (err) {
      return { error: handleError(err, 'Delete') };
    }
  }, [table, fetchItems, showToasts, handleError]);

  return {
    items,
    isLoading,
    error,
    create,
    update,
    remove,
    refetch: fetchItems,
  };
}
