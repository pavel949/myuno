import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useAdmin');

// Flexible types to match DB schema - admin tools handle display logic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Provider = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Service = Record<string, any>;

export function useAdminCheck() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdmin = async () => {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (error) throw error;
        if (isMounted) setIsAdmin(data === true);
      } catch (err) {
        errorLog.silent(err, 'check_admin_role');
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAdmin();
    return () => { isMounted = false; };
  }, [user]);

  return { isAdmin, isLoading };
}

export function useAdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProviders = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    try {
      if (checkMounted()) setIsLoading(true);
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (checkMounted()) setProviders(data || []);
    } catch (err) {
      errorLog.silent(err, 'fetch_providers');
    } finally {
      if (checkMounted()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchProviders(() => isMounted);
    return () => { isMounted = false; };
  }, [fetchProviders]);

  const createProvider = async (providerData: Partial<Provider>) => {
    const { data, error } = await supabase
      .from('providers')
      .insert({
        ...providerData,
        is_active: providerData.is_active ?? true,
        is_verified: true, // Admin-created providers are auto-verified
        approval_status: 'approved', // Auto-approved
        created_by_uno_team: true,
        rating: 0,
        review_count: 0,
        pending_payout: 0,
      } as any)
      .select()
      .single();

    if (!error) await fetchProviders();
    return { data, error };
  };

  const updateProvider = async (providerId: string, updates: Partial<Provider>) => {
    const { data, error } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', providerId)
      .select()
      .single();

    if (!error) await fetchProviders();
    return { data, error };
  };

  const deleteProvider = async (providerId: string) => {
    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', providerId);

    if (!error) await fetchProviders();
    return { error };
  };

  return { providers, isLoading, createProvider, updateProvider, deleteProvider, refetch: fetchProviders };
}

export function useAdminServices(providerId?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    try {
      if (checkMounted()) setIsLoading(true);
      let query = supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (checkMounted()) setServices(data || []);
    } catch (err) {
      errorLog.silent(err, 'fetch_services');
    } finally {
      if (checkMounted()) setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    fetchServices(() => isMounted);
    return () => { isMounted = false; };
  }, [fetchServices]);

  const createService = async (serviceData: Partial<Service>) => {
    const { data, error } = await supabase
      .from('services')
      .insert({
        ...serviceData,
        currency: serviceData.currency || 'THB',
        max_capacity: serviceData.max_capacity || 1,
        is_active: serviceData.is_active ?? true,
        is_featured: serviceData.is_featured ?? false,
        is_verified: true, // Admin-created services are auto-verified
        approval_status: 'approved', // Auto-approved
        created_by_uno_team: true,
      } as any)
      .select()
      .single();

    if (!error) await fetchServices();
    return { data, error };
  };

  const updateService = async (serviceId: string, updates: Partial<Service>) => {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (!error) await fetchServices();
    return { data, error };
  };

  const deleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (!error) await fetchServices();
    return { error };
  };

  return { services, isLoading, createService, updateService, deleteService, refetch: fetchServices };
}

 
export function useAdminCategories() {
  const [categories, setCategories] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        if (isMounted) setCategories(data || []);
      } catch (err) {
        errorLog.silent(err, 'fetch_categories');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  return { categories, isLoading };
}
