import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Yacht } from './useYachts';
import { VendorActivity } from './useVendorActivities';
import { VendorProperty } from './useVendorProperties';

// Admin hook for yachts - can see all yachts and assign to any provider
export function useAdminYachts(filterProviderId?: string) {
  const { user } = useAuth();
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchYachts = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    
    let query = supabase.from('yachts').select('*');
    
    if (filterProviderId) {
      query = query.eq('provider_id', filterProviderId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data && checkMounted()) setYachts(data as Yacht[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => {
    let isMounted = true;
    fetchYachts(() => isMounted);
    return () => { isMounted = false; };
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

// useAdminTours — REMOVED: consolidated into useAdminExperiences({ experienceType: 'tour' })

// Admin hook for activities
export function useAdminActivities(filterProviderId?: string) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<VendorActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    
    let query = supabase.from('water_activities').select('*');
    
    if (filterProviderId) {
      query = query.eq('provider_id', filterProviderId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data && checkMounted()) setActivities(data as VendorActivity[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => {
    let isMounted = true;
    fetchActivities(() => isMounted);
    return () => { isMounted = false; };
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
// Supports filtering by provider_id OR management_company_id (for УК)
export function useAdminProperties(filterProviderId?: string, filterType?: 'provider' | 'mc') {
  const { user } = useAuth();
  const [properties, setProperties] = useState<VendorProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    
    let query = supabase.from('properties').select('*');
    
    if (filterProviderId) {
      if (filterType === 'mc') {
        // Filter by management company
        query = query.eq('management_company_id', filterProviderId);
      } else if (filterType === 'provider') {
        // Filter by provider only
        query = query.eq('provider_id', filterProviderId);
      } else {
        // Auto-detect: search in both provider_id and management_company_id
        query = query.or(`provider_id.eq.${filterProviderId},management_company_id.eq.${filterProviderId}`);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data && checkMounted()) setProperties(data as VendorProperty[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId, filterType]);

  useEffect(() => {
    let isMounted = true;
    fetchProperties(() => isMounted);
    return () => { isMounted = false; };
  }, [fetchProperties]);

  const createProperty = async (propertyData: Partial<VendorProperty> & { provider_id?: string; management_company_id?: string }) => {
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

// Admin hook for restaurants
export function useAdminRestaurants(filterProviderId?: string) {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('restaurants').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setRestaurants(data);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createRestaurant = async (data: any) => {
    const { data: result, error } = await supabase.from('restaurants').insert({ ...data, is_verified: true }).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateRestaurant = async (id: string, data: any) => {
    const { data: result, error } = await supabase.from('restaurants').update(data).eq('id', id).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteRestaurant = async (id: string) => {
    const { error } = await supabase.from('restaurants').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { restaurants, isLoading, createRestaurant, updateRestaurant, deleteRestaurant, refetch: fetchData };
}

// Admin hook for salons
export function useAdminSalons(filterProviderId?: string) {
  const { user } = useAuth();
  const [salons, setSalons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('salons').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setSalons(data);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createSalon = async (data: any) => {
    const { data: result, error } = await supabase.from('salons').insert({ ...data, is_verified: true }).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateSalon = async (id: string, data: any) => {
    const { data: result, error } = await supabase.from('salons').update(data).eq('id', id).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteSalon = async (id: string) => {
    const { error } = await supabase.from('salons').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { salons, isLoading, createSalon, updateSalon, deleteSalon, refetch: fetchData };
}

// Admin hook for clinics
export function useAdminClinics(filterProviderId?: string) {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('clinics').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setClinics(data);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createClinic = async (data: any) => {
    const { data: result, error } = await supabase.from('clinics').insert({ ...data, is_verified: true }).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateClinic = async (id: string, data: any) => {
    const { data: result, error } = await supabase.from('clinics').update(data).eq('id', id).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteClinic = async (id: string) => {
    const { error } = await supabase.from('clinics').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { clinics, isLoading, createClinic, updateClinic, deleteClinic, refetch: fetchData };
}

// Admin hook for gyms
export function useAdminGyms(filterProviderId?: string) {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('gyms').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setGyms(data);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createGym = async (data: any) => {
    const { data: result, error } = await supabase.from('gyms').insert({ ...data, is_verified: true }).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateGym = async (id: string, data: any) => {
    const { data: result, error } = await supabase.from('gyms').update(data).eq('id', id).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteGym = async (id: string) => {
    const { error } = await supabase.from('gyms').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { gyms, isLoading, createGym, updateGym, deleteGym, refetch: fetchData };
}

// Admin hook for vehicles
export function useAdminVehicles(filterProviderId?: string) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('vehicles').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setVehicles(data);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createVehicle = async (data: any) => {
    const { data: result, error } = await supabase.from('vehicles').insert({ ...data, is_verified: true }).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateVehicle = async (id: string, data: any) => {
    const { data: result, error } = await supabase.from('vehicles').update(data).eq('id', id).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle, refetch: fetchData };
}

// Admin hook for events
export function useAdminEvents(filterProviderId?: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('events').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setEvents(data);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createEvent = async (data: any) => {
    const { data: result, error } = await supabase.from('events').insert({ ...data, is_active: true }).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateEvent = async (id: string, data: any) => {
    const { data: result, error } = await supabase.from('events').update(data).eq('id', id).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { events, isLoading, createEvent, updateEvent, deleteEvent, refetch: fetchData };
}

// Generic admin hook factory
function createAdminHook(tableName: string) {
  return function useAdminGeneric(filterProviderId?: string) {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (isMounted?: () => boolean) => {
      const checkMounted = isMounted || (() => true);
      if (!user) return;
      if (checkMounted()) setIsLoading(true);
      let query = supabase.from(tableName as any).select('*');
      if (filterProviderId) query = query.eq('provider_id', filterProviderId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data && checkMounted()) setItems(data);
      if (checkMounted()) setIsLoading(false);
    }, [user, filterProviderId]);

    useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

    const createItem = async (data: any) => {
      const { data: result, error } = await supabase.from(tableName as any).insert({ ...data, is_active: true }).select().single();
      if (!error) await fetchData();
      return { data: result, error };
    };
    const updateItem = async (data: any) => {
      const { id, ...rest } = data;
      const { data: result, error } = await supabase.from(tableName as any).update(rest).eq('id', id).select().single();
      if (!error) await fetchData();
      return { data: result, error };
    };
    const deleteItem = async (id: string) => {
      const { error } = await supabase.from(tableName as any).delete().eq('id', id);
      if (!error) await fetchData();
      return { error };
    };
    return { items, isLoading, createItem, updateItem, deleteItem, refetch: fetchData };
  };
}

export const useAdminEducation = createAdminHook('education_providers');
export const useAdminLegal = createAdminHook('legal_services');
export const useAdminPets = createAdminHook('pet_services');
export const useAdminCleaning = createAdminHook('cleaning_services');
export const useAdminBabysitters = createAdminHook('babysitters');
export const useAdminFlowers = createAdminHook('flower_shops');
