/**
 * @module useAdmin
 * @description Admin data hooks for providers, services, and categories.
 * 
 * useAdminCheck is re-exported from useIsAdmin (single source of truth).
 * Data hooks use React Query for caching and consistency.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler } from '@/lib/errorHandler';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

// Re-export the canonical admin check hook
export { useIsAdmin as useAdminCheck } from '@/hooks/useIsAdmin';

const errorLog = createErrorHandler('useAdmin');

// ============= Typed aliases from Supabase schema =============
export type Provider = Database['public']['Tables']['providers']['Row'];
type ProviderInsert = Database['public']['Tables']['providers']['Insert'];
type ProviderUpdate = Database['public']['Tables']['providers']['Update'];

export type Service = Database['public']['Tables']['services']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type ServiceUpdate = Database['public']['Tables']['services']['Update'];

type Category = Database['public']['Tables']['categories']['Row'];

// ============= Query Keys =============
const QUERY_KEYS = {
  providers: ['admin', 'providers'] as const,
  services: (providerId?: string) => ['admin', 'services', providerId] as const,
  categories: ['admin', 'categories'] as const,
};

// ============= useAdminProviders =============
export function useAdminProviders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading, isFetching, error } = useQuery({
    queryKey: [...QUERY_KEYS.providers, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        errorLog.silent(error, 'fetch_providers');
        throw error;
      }
      return data as Provider[];
    },
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.providers });
    queryClient.invalidateQueries({ queryKey: ['marketplace-services'] });
  }, [queryClient]);

  const createProvider = useCallback(async (providerData: Partial<ProviderInsert>) => {
    const insertData: ProviderInsert = {
      name: providerData.name ?? '',
      ...providerData,
      is_active: providerData.is_active ?? true,
      is_verified: providerData.is_verified ?? true,
      approval_status: providerData.approval_status ?? 'approved',
      created_by_uno_team: true,
      rating: 0,
      review_count: 0,
      pending_payout: 0,
    };

    const { data, error } = await supabase
      .from('providers')
      .insert(insertData)
      .select()
      .single();

    if (!error) invalidate();
    return { data, error };
  }, [invalidate]);

  const updateProvider = useCallback(async (providerId: string, updates: ProviderUpdate) => {
    const { data, error } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', providerId)
      .select()
      .single();

    if (!error) invalidate();
    return { data, error };
  }, [invalidate]);

  const deleteProvider = useCallback(async (providerId: string) => {
    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', providerId);

    if (!error) invalidate();
    return { error };
  }, [invalidate]);

  return { providers, isLoading, isFetching, error, createProvider, updateProvider, deleteProvider, refetch: invalidate };
}

// ============= useAdminServices =============
export function useAdminServices(providerId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: [...QUERY_KEYS.services(providerId), user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;

      if (error) {
        errorLog.silent(error, 'fetch_services');
        throw error;
      }
      return data as Service[];
    },
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
    queryClient.invalidateQueries({ queryKey: ['marketplace-services'] });
    queryClient.invalidateQueries({ queryKey: ['provider-services-admin'] });
  }, [queryClient, providerId]);

  const createService = useCallback(async (serviceData: Partial<ServiceInsert>) => {
    const insertData: ServiceInsert = {
      name_en: serviceData.name_en ?? '',
      name_ru: serviceData.name_ru ?? '',
      provider_id: serviceData.provider_id ?? '',
      ...serviceData,
      currency: serviceData.currency || 'THB',
      is_active: serviceData.is_active ?? true,
      is_verified: true,
      approval_status: serviceData.approval_status ?? 'approved',
      created_by_uno_team: true,
    };

    const { data, error } = await supabase
      .from('services')
      .insert(insertData)
      .select()
      .single();

    if (!error) invalidate();
    return { data, error };
  }, [invalidate]);

  const updateService = useCallback(async (serviceId: string, updates: ServiceUpdate) => {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (!error) invalidate();
    return { data, error };
  }, [invalidate]);

  const deleteService = useCallback(async (serviceId: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .select('id')
      .single();

    if (!error) invalidate();
    return { error };
  }, [invalidate]);

  return { services, isLoading, error, createService, updateService, deleteService, refetch: invalidate };
}

// ============= useAdminCategories =============
export function useAdminCategories() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        errorLog.silent(error, 'fetch_categories');
        throw error;
      }
      return data as Category[];
    },
  });

  return { categories, isLoading };
}
