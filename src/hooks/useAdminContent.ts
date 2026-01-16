import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Yacht } from './useYachts';
import { VendorTour } from './useVendorTours';
import { VendorActivity } from './useVendorActivities';
import { VendorProperty } from './useVendorProperties';

// Admin hook for yachts - can see all yachts and assign to any provider
export function useAdminYachts(filterProviderId?: string) {
  const { user } = useAuth();
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchYachts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('yachts').select('*');
    
    if (filterProviderId) {
      query = query.eq('provider_id', filterProviderId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setYachts(data as Yacht[]);
    setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => {
    fetchYachts();
  }, [fetchYachts]);

  const createYacht = async (yachtData: Partial<Yacht> & { provider_id: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('yachts')
      .insert({
        ...yachtData,
        approval_status: 'approved',
        is_verified: true,
      } as any)
      .select()
      .single();
    
    if (!error) await fetchYachts();
    return { data, error };
  };

  const updateYacht = async (id: string, yachtData: Partial<Yacht>) => {
    const { data, error } = await supabase
      .from('yachts')
      .update(yachtData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchYachts();
    return { data, error };
  };

  const deleteYacht = async (id: string) => {
    const { error } = await supabase
      .from('yachts')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchYachts();
    return { error };
  };

  return { yachts, isLoading, createYacht, updateYacht, deleteYacht, refetch: fetchYachts };
}

// Admin hook for tours
export function useAdminTours(filterProviderId?: string) {
  const { user } = useAuth();
  const [tours, setTours] = useState<VendorTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTours = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('tours').select('*');
    
    if (filterProviderId) {
      query = query.eq('provider_id', filterProviderId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setTours(data as VendorTour[]);
    setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const createTour = async (tourData: Partial<VendorTour> & { provider_id: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('tours')
      .insert({
        ...tourData,
        is_active: true,
      } as any)
      .select()
      .single();
    
    if (!error) await fetchTours();
    return { data, error };
  };

  const updateTour = async (id: string, tourData: Partial<VendorTour>) => {
    const { data, error } = await supabase
      .from('tours')
      .update(tourData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchTours();
    return { data, error };
  };

  const deleteTour = async (id: string) => {
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchTours();
    return { error };
  };

  return { tours, isLoading, createTour, updateTour, deleteTour, refetch: fetchTours };
}

// Admin hook for activities
export function useAdminActivities(filterProviderId?: string) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<VendorActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('water_activities').select('*');
    
    if (filterProviderId) {
      query = query.eq('provider_id', filterProviderId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setActivities(data as VendorActivity[]);
    setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = async (activityData: Partial<VendorActivity> & { provider_id: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('water_activities')
      .insert({
        ...activityData,
        is_active: true,
      } as any)
      .select()
      .single();
    
    if (!error) await fetchActivities();
    return { data, error };
  };

  const updateActivity = async (id: string, activityData: Partial<VendorActivity>) => {
    const { data, error } = await supabase
      .from('water_activities')
      .update(activityData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchActivities();
    return { data, error };
  };

  const deleteActivity = async (id: string) => {
    const { error } = await supabase
      .from('water_activities')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchActivities();
    return { error };
  };

  return { activities, isLoading, createActivity, updateActivity, deleteActivity, refetch: fetchActivities };
}

// Admin hook for properties
export function useAdminProperties(filterProviderId?: string) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<VendorProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('properties').select('*');
    
    if (filterProviderId) {
      query = query.eq('provider_id', filterProviderId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setProperties(data as VendorProperty[]);
    setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const createProperty = async (propertyData: Partial<VendorProperty> & { provider_id: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        is_active: true,
      } as any)
      .select()
      .single();
    
    if (!error) await fetchProperties();
    return { data, error };
  };

  const updateProperty = async (id: string, propertyData: Partial<VendorProperty>) => {
    const { data, error } = await supabase
      .from('properties')
      .update(propertyData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchProperties();
    return { data, error };
  };

  const deleteProperty = async (id: string) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchProperties();
    return { error };
  };

  return { properties, isLoading, createProperty, updateProperty, deleteProperty, refetch: fetchProperties };
}
