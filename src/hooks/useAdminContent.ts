import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import { Yacht } from './useYachts';
import { VendorActivity } from './useVendorActivities';
import { VendorProperty } from './useVendorProperties';

// ── Generic helpers ─────────────────────────────────────────────────────────
type ListingRow = Database['public']['Tables']['listings']['Row'];
type ListingInsert = Database['public']['Tables']['listings']['Insert'];
type ListingUpdate = Database['public']['Tables']['listings']['Update'];

/** Generic record shape used by admin CRUD hooks where the underlying schema
 *  varies across verticals (salons, gyms, events, ...). Consumers (AdminEvents,
 *  AdminRestaurants, AdminFlowers) define their own form types that map onto
 *  these dynamic columns; we keep this as a loose record to interop with
 *  consumer-defined form types without forcing them to add an index signature. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminRecord = Record<string, any>;

// ── Yachts (listings vertical='yacht') ─────────────────────────────────────
export function useAdminYachts(filterProviderId?: string) {
  const { user } = useAuth();
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchYachts = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);

    let query = supabase.from('listings').select('*').eq('vertical', 'yacht');

    if (filterProviderId) {
      query = query.eq('provider_id', filterProviderId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data && checkMounted()) setYachts(data as unknown as Yacht[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => {
    let isMounted = true;
    fetchYachts(() => isMounted);
    return () => { isMounted = false; };
  }, [fetchYachts]);

  const createYacht = async (yachtData: Partial<Yacht> & { provider_id: string }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const insertPayload = {
      ...(yachtData as unknown as ListingInsert),
      vertical: 'yacht',
      approval_status: 'approved',
      is_verified: true,
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(insertPayload)
      .select()
      .single();

    if (!error) await fetchYachts();
    return { data, error };
  };

  const updateYacht = async (id: string, yachtData: Partial<Yacht>) => {
    const { data, error } = await supabase
      .from('listings')
      .update(yachtData as unknown as ListingUpdate)
      .eq('id', id)
      .select()
      .single();

    if (!error) await fetchYachts();
    return { data, error };
  };

  const deleteYacht = async (id: string) => {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (!error) await fetchYachts();
    return { error };
  };

  return { yachts, isLoading, createYacht, updateYacht, deleteYacht, refetch: fetchYachts };
}

// useAdminTours — REMOVED: consolidated into useAdminExperiences({ experienceType: 'tour' })

// ── Activities (water_activities) ──────────────────────────────────────────
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

    if (!error && data && checkMounted()) setActivities(data as unknown as VendorActivity[]);
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
        ...(activityData as Record<string, unknown>),
        is_active: true,
      } as never)
      .select()
      .single();

    if (!error) await fetchActivities();
    return { data, error };
  };

  const updateActivity = async (id: string, activityData: Partial<VendorActivity>) => {
    const { data, error } = await supabase
      .from('water_activities')
      .update(activityData as never)
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

// ── Properties (filter by provider OR management company) ──────────────────
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
        query = query.eq('management_company_id', filterProviderId);
      } else if (filterType === 'provider') {
        query = query.eq('provider_id', filterProviderId);
      } else {
        query = query.or(`provider_id.eq.${filterProviderId},management_company_id.eq.${filterProviderId}`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data && checkMounted()) setProperties(data as unknown as VendorProperty[]);
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
        ...(propertyData as Record<string, unknown>),
        is_active: true,
      } as never)
      .select()
      .single();

    if (!error) await fetchProperties();
    return { data, error };
  };

  const updateProperty = async (id: string, propertyData: Partial<VendorProperty>) => {
    const { data, error } = await supabase
      .from('properties')
      .update(propertyData as never)
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

// ── Restaurants (listings vertical='restaurant') ───────────────────────────
export function useAdminRestaurants(filterProviderId?: string) {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<AdminRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('listings').select('*').eq('vertical', 'restaurant');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setRestaurants(data as AdminRecord[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createRestaurant = async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('listings')
      .insert({ ...data, vertical: 'restaurant', is_verified: true } as ListingInsert)
      .select()
      .single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateRestaurant = async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('listings')
      .update(data as ListingUpdate)
      .eq('id', id)
      .select()
      .single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteRestaurant = async (id: string) => {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { restaurants, isLoading, createRestaurant, updateRestaurant, deleteRestaurant, refetch: fetchData };
}

// ── Salons ─────────────────────────────────────────────────────────────────
export function useAdminSalons(filterProviderId?: string) {
  const { user } = useAuth();
  const [salons, setSalons] = useState<AdminRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('salons').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setSalons(data as AdminRecord[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createSalon = async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from('salons').insert({ ...data, is_verified: true } as never).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateSalon = async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from('salons').update(data as never).eq('id', id).select().single();
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

// ── Clinics (listings vertical='clinic') ───────────────────────────────────
export function useAdminClinics(filterProviderId?: string) {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<AdminRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('listings').select('*').eq('vertical', 'clinic');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setClinics(data as AdminRecord[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createClinic = async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('listings')
      .insert({ ...data, vertical: 'clinic', is_verified: true } as ListingInsert)
      .select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateClinic = async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('listings')
      .update(data as ListingUpdate)
      .eq('id', id).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteClinic = async (id: string) => {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { clinics, isLoading, createClinic, updateClinic, deleteClinic, refetch: fetchData };
}

// ── Gyms ───────────────────────────────────────────────────────────────────
export function useAdminGyms(filterProviderId?: string) {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<AdminRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('gyms').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setGyms(data as AdminRecord[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createGym = async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from('gyms').insert({ ...data, is_verified: true } as never).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateGym = async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from('gyms').update(data as never).eq('id', id).select().single();
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

// ── Vehicles (listings vertical='vehicle') ─────────────────────────────────
export function useAdminVehicles(filterProviderId?: string) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<AdminRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('listings').select('*').eq('vertical', 'vehicle');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setVehicles(data as AdminRecord[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createVehicle = async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('listings')
      .insert({ ...data, vertical: 'vehicle', is_verified: true } as ListingInsert)
      .select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateVehicle = async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase
      .from('listings')
      .update(data as ListingUpdate)
      .eq('id', id).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };
  return { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle, refetch: fetchData };
}

// ── Events ─────────────────────────────────────────────────────────────────
export function useAdminEvents(filterProviderId?: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<AdminRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (!user) return;
    if (checkMounted()) setIsLoading(true);
    let query = supabase.from('events').select('*');
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && checkMounted()) setEvents(data as AdminRecord[]);
    if (checkMounted()) setIsLoading(false);
  }, [user, filterProviderId]);

  useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

  const createEvent = async (data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from('events').insert({ ...data, is_active: true } as never).select().single();
    if (!error) await fetchData();
    return { data: result, error };
  };
  const updateEvent = async (id: string, data: Record<string, unknown>) => {
    const { data: result, error } = await supabase.from('events').update(data as never).eq('id', id).select().single();
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

// ── Generic admin hook factory: listings-based verticals ───────────────────
function createListingsAdminHook(vertical: string) {
  return function useAdminGeneric(filterProviderId?: string) {
    const { user } = useAuth();
    const [items, setItems] = useState<AdminRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (isMounted?: () => boolean) => {
      const checkMounted = isMounted || (() => true);
      if (!user) return;
      if (checkMounted()) setIsLoading(true);
      let query = supabase.from('listings').select('*').eq('vertical', vertical);
      if (filterProviderId) query = query.eq('provider_id', filterProviderId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data && checkMounted()) setItems(data as AdminRecord[]);
      if (checkMounted()) setIsLoading(false);
    }, [user, filterProviderId]);

    useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

    const createItem = async (data: AdminRecord) => {
      const { data: result, error } = await supabase
        .from('listings')
        .insert({ ...data, vertical, is_active: true } as ListingInsert)
        .select().single();
      if (!error) await fetchData();
      return { data: result, error };
    };
    const updateItem = async (data: AdminRecord) => {
      const { id, ...rest } = data;
      const { data: result, error } = await supabase
        .from('listings')
        .update(rest as ListingUpdate)
        .eq('id', String(id))
        .select().single();
      if (!error) await fetchData();
      return { data: result, error };
    };
    const deleteItem = async (id: string) => {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (!error) await fetchData();
      return { error };
    };
    return { items, isLoading, createItem, updateItem, deleteItem, refetch: fetchData };
  };
}

// ── Generic admin hook factory: non-migrated tables ────────────────────────
function createAdminHook(tableName: string) {
  return function useAdminGeneric(filterProviderId?: string) {
    const { user } = useAuth();
    const [items, setItems] = useState<AdminRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (isMounted?: () => boolean) => {
      const checkMounted = isMounted || (() => true);
      if (!user) return;
      if (checkMounted()) setIsLoading(true);
      // Dynamic table name — types cannot be inferred at compile time.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from(tableName as any) as any).select('*');
      if (filterProviderId) query = query.eq('provider_id', filterProviderId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data && checkMounted()) setItems(data as AdminRecord[]);
      if (checkMounted()) setIsLoading(false);
    }, [user, filterProviderId]);

    useEffect(() => { let m = true; fetchData(() => m); return () => { m = false; }; }, [fetchData]);

    const createItem = async (data: AdminRecord) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase.from(tableName as any) as any)
        .insert({ ...data, is_active: true })
        .select().single();
      if (!error) await fetchData();
      return { data: result, error };
    };
    const updateItem = async (data: AdminRecord) => {
      const { id, ...rest } = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase.from(tableName as any) as any)
        .update(rest)
        .eq('id', String(id))
        .select().single();
      if (!error) await fetchData();
      return { data: result, error };
    };
    const deleteItem = async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(tableName as any) as any).delete().eq('id', id);
      if (!error) await fetchData();
      return { error };
    };
    return { items, isLoading, createItem, updateItem, deleteItem, refetch: fetchData };
  };
}

// Migrated verticals → listings table
export const useAdminEducation = createListingsAdminHook('education');
export const useAdminPets = createListingsAdminHook('pet_service');
export const useAdminCleaning = createListingsAdminHook('cleaning');
export const useAdminBabysitters = createListingsAdminHook('babysitter');

// Non-migrated tables
export const useAdminLegal = createAdminHook('legal_services');
export const useAdminFlowers = createAdminHook('flower_shops');
