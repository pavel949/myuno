import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';
import { sanitizePayload } from '@/lib/sanitizePayload';

interface AdditionalFilter {
  column: string;
  value: string | number | boolean;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
}

interface UseSupabaseCRUDOptions {
  table: string;
  providerId?: string;
  providerIdField?: string;
  orderByColumn?: string;
  orderAscending?: boolean;
  select?: string;
  enabled?: boolean;
  showToasts?: boolean;
  additionalFilters?: AdditionalFilter[];
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
  additionalFilters = [],
}: UseSupabaseCRUDOptions): CRUDResult<T> {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
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
      let query = supabase.from(table as never).select(select);
      
      // Apply provider filter
      if (providerId) {
        query = query.eq(providerIdField, providerId);
      }
      
      // Apply additional filters
      for (const filter of additionalFilters) {
        const op = filter.operator || 'eq';
        switch (op) {
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
            query = query.like(filter.column, filter.value as string);
            break;
          case 'ilike':
            query = query.ilike(filter.column, filter.value as string);
            break;
          default:
            query = query.eq(filter.column, filter.value);
        }
      }

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
  // Stringify additionalFilters to prevent infinite loop from unstable array reference
  }, [user, enabled, table, providerId, providerIdField, select, orderByColumn, orderAscending, JSON.stringify(additionalFilters), handleError]);

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
      const insertData = sanitizePayload({ ...data } as Record<string, unknown>);
      if (providerId) {
        insertData[providerIdField] = providerId;
      }
      
      // Admin-created content is auto-approved; vendor content goes to moderation
      if (!('approval_status' in insertData)) {
        if (isAdmin) {
          insertData.approval_status = 'approved';
          insertData.is_verified = true;
          insertData.created_by_uno_team = true;
          insertData.uno_team_creator_id = user?.id;
        } else if (providerId) {
          insertData.approval_status = 'pending';
        }
      }

       
      const { data: result, error: insertError } = await supabase
        .from(table as never)
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      const successMsg = isAdmin 
        ? 'Created and published' 
        : 'Submitted for moderation';
      if (showToasts) toast.success(successMsg);
      await fetchItems();
      return { data: result as unknown as T, error: null };
    } catch (err) {
      return { data: null, error: handleError(err, 'Create') };
    }
  }, [user, table, providerId, providerIdField, fetchItems, showToasts, handleError, isAdmin]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    try {
      // Auto-set updated_at timestamp
      const updateData = sanitizePayload({
        ...data,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>);
       
      const { data: result, error: updateError } = await supabase
        .from(table as never)
        .update(updateData)
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
       
      const { error: deleteError } = await supabase
        .from(table as never)
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
