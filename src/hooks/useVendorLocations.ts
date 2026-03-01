import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserContext } from './useUserContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface VendorLocation {
  id: string;
  org_id: string;
  name: string;
  name_ru?: string;
  description?: string;
  description_ru?: string;
  phone?: string;
  email?: string;
  address: string;
  address_ru?: string;
  district?: string;
  city_id?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  rejection_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LocationFormData {
  name: string;
  name_ru?: string;
  description?: string;
  description_ru?: string;
  phone?: string;
  email?: string;
  address: string;
  address_ru?: string;
  district?: string;
  city_id?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, { open: string; close: string; closed?: boolean }>;
}

export function useVendorLocations() {
  const { user } = useAuth();
  const { activeOrgId } = useUserContext();
  const [locations, setLocations] = useState<VendorLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!activeOrgId) {
      setLocations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_locations')
        .select('*')
        .eq('org_id', activeOrgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations((data as VendorLocation[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const createLocation = async (formData: LocationFormData) => {
    if (!activeOrgId) {
      return { data: null, error: new Error('No active organization') };
    }

    try {
      const { data, error } = await supabase
        .from('vendor_locations')
        .insert({
          org_id: activeOrgId,
          ...formData,
          is_active: true,
          approval_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchLocations();
      return { data: data as VendorLocation, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateLocation = async (id: string, formData: Partial<LocationFormData>) => {
    try {
      const { data, error } = await supabase
        .from('vendor_locations')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchLocations();
      return { data: data as VendorLocation, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendor_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchLocations();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const submitForModeration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendor_locations')
        .update({ 
          approval_status: 'pending',
          rejection_reason: null,
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchLocations();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Get location services
  const getLocationServices = async (locationId: string) => {
    try {
      const { data, error } = await supabase
        .from('vendor_location_services')
        .select(`
          *,
          service:services(*)
        `)
        .eq('location_id', locationId);

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  // Add services to location
  const addServicesToLocation = async (locationId: string, serviceIds: string[]) => {
    try {
      const inserts = serviceIds.map(serviceId => ({
        location_id: locationId,
        service_id: serviceId,
        is_active: true,
      }));

      const { error } = await supabase
        .from('vendor_location_services')
        .upsert(inserts, { onConflict: 'location_id,service_id' });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Remove service from location
  const removeServiceFromLocation = async (locationId: string, serviceId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_location_services')
        .delete()
        .eq('location_id', locationId)
        .eq('service_id', serviceId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return {
    locations,
    isLoading,
    error,
    refetch: fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    submitForModeration,
    getLocationServices,
    addServicesToLocation,
    removeServiceFromLocation,
  };
}

// Hook for admin to manage all locations
export function useAdminVendorLocations() {
  const [locations, setLocations] = useState<VendorLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllLocations = useCallback(async (status?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('vendor_locations')
        .select(`
          *,
          org:orgs(id, name, name_ru)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('approval_status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLocations((data as any[]) || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllLocations();
  }, [fetchAllLocations]);

  const approveLocation = async (id: string) => {
    const { error } = await supabase
      .from('vendor_locations')
      .update({ 
        approval_status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) await fetchAllLocations();
    return { error };
  };

  const rejectLocation = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('vendor_locations')
      .update({ 
        approval_status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) await fetchAllLocations();
    return { error };
  };

  const requestInfo = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('vendor_locations')
      .update({ 
        approval_status: 'info_requested',
        rejection_reason: `[INFO REQUEST] ${reason}`,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) await fetchAllLocations();
    return { error };
  };

  return {
    locations,
    isLoading,
    refetch: fetchAllLocations,
    approveLocation,
    rejectLocation,
    requestInfo,
  };
}
