import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OtaConnection {
  id: string;
  owner_id: string;
  property_id: string | null;
  platform: 'airbnb' | 'booking' | 'vrbo' | 'expedia';
  listing_url: string;
  listing_id: string | null;
  is_active: boolean;
  auto_sync_enabled: boolean;
  sync_interval_hours: number;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'partial' | 'failed' | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface OtaSyncedListing {
  id: string;
  connection_id: string;
  title: string | null;
  description: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  max_guests: number | null;
  amenities: string[] | null;
  house_rules: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  photos: Array<{ url: string; caption?: string; order?: number }> | null;
  cover_photo: string | null;
  price_per_night: number | null;
  currency: string;
  cleaning_fee: number | null;
  ical_url: string | null;
  rating: number | null;
  review_count: number | null;
  synced_at: string;
  parsed_at: string | null;
}

export interface OtaSyncLog {
  id: string;
  connection_id: string;
  sync_type: 'full' | 'calendar' | 'photos' | 'details';
  status: 'started' | 'success' | 'partial' | 'failed';
  items_synced: Record<string, any>;
  error_message: string | null;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

// Hook to manage OTA connections
export function useOtaConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['ota-connections', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ota_listing_connections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OtaConnection[];
    },
    enabled: !!user,
  });

  const createConnection = useMutation({
    mutationFn: async (input: {
      platform: OtaConnection['platform'];
      listing_url: string;
      property_id?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('ota_listing_connections')
        .insert({
          owner_id: user.id,
          platform: input.platform,
          listing_url: input.listing_url,
          property_id: input.property_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as OtaConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ota-connections'] });
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('ota_listing_connections')
        .delete()
        .eq('id', connectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ota-connections'] });
    },
  });

  const updateConnection = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OtaConnection> & { id: string }) => {
      const { data, error } = await supabase
        .from('ota_listing_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as OtaConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ota-connections'] });
    },
  });

  return {
    connections,
    isLoading,
    error,
    createConnection,
    deleteConnection,
    updateConnection,
  };
}

// Hook to get synced listing data
export function useOtaSyncedListing(connectionId?: string) {
  return useQuery({
    queryKey: ['ota-synced-listing', connectionId],
    queryFn: async () => {
      if (!connectionId) return null;
      
      const { data, error } = await supabase
        .from('ota_synced_listings')
        .select('*')
        .eq('connection_id', connectionId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      // Transform photos from Json to typed array
      return {
        ...data,
        photos: Array.isArray(data.photos) ? data.photos as Array<{ url: string; caption?: string; order?: number }> : null,
      } as OtaSyncedListing;
    },
    enabled: !!connectionId,
  });
}

// Hook to get sync history
export function useOtaSyncLogs(connectionId?: string) {
  return useQuery({
    queryKey: ['ota-sync-logs', connectionId],
    queryFn: async () => {
      if (!connectionId) return [];
      
      const { data, error } = await supabase
        .from('ota_sync_logs')
        .select('*')
        .eq('connection_id', connectionId)
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as OtaSyncLog[];
    },
    enabled: !!connectionId,
  });
}

// Hook to trigger sync
export function useOtaSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      connection_id?: string;
      listing_url?: string;
      sync_type?: 'full' | 'calendar' | 'photos' | 'details';
    }) => {
      const { data, error } = await supabase.functions.invoke('airbnb-sync', {
        body: input,
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Sync failed');
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ota-connections'] });
      if (variables.connection_id) {
        queryClient.invalidateQueries({ queryKey: ['ota-synced-listing', variables.connection_id] });
        queryClient.invalidateQueries({ queryKey: ['ota-sync-logs', variables.connection_id] });
      }
      toast.success('Синхронизация завершена');
    },
    onError: (error) => {
      toast.error(`Ошибка синхронизации: ${error.message}`);
    },
  });
}

// Hook to apply synced data to property
export function useApplySyncedData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      connectionId, 
      propertyId,
      fields 
    }: { 
      connectionId: string; 
      propertyId: string;
      fields: string[];
    }) => {
      // Get synced listing data
      const { data: syncedListing, error: fetchError } = await supabase
        .from('ota_synced_listings')
        .select('*')
        .eq('connection_id', connectionId)
        .single();
      
      if (fetchError || !syncedListing) {
        throw new Error('Synced listing not found');
      }

      // Build update object based on selected fields
      const updates: Record<string, any> = {};
      
      if (fields.includes('title') && syncedListing.title) {
        updates.title = syncedListing.title;
        updates.title_ru = syncedListing.title; // Can be translated later
      }
      if (fields.includes('description') && syncedListing.description) {
        updates.description = syncedListing.description;
        updates.description_ru = syncedListing.description;
      }
      if (fields.includes('bedrooms') && syncedListing.bedrooms) {
        updates.bedrooms = syncedListing.bedrooms;
      }
      if (fields.includes('bathrooms') && syncedListing.bathrooms) {
        updates.bathrooms = syncedListing.bathrooms;
      }
      if (fields.includes('max_guests') && syncedListing.max_guests) {
        updates.max_guests = syncedListing.max_guests;
      }
      if (fields.includes('price') && syncedListing.price_per_night) {
        updates.price_per_night = syncedListing.price_per_night;
        updates.currency = syncedListing.currency;
      }
      if (fields.includes('photos') && syncedListing.photos) {
        const photosArray = Array.isArray(syncedListing.photos) ? syncedListing.photos : [];
        updates.images = photosArray.map((p: { url: string }) => p.url);
        if (syncedListing.cover_photo) {
          updates.cover_image = syncedListing.cover_photo;
        }
      }
      if (fields.includes('amenities') && syncedListing.amenities) {
        updates.amenities = syncedListing.amenities;
      }
      if (fields.includes('house_rules') && syncedListing.house_rules) {
        updates.house_rules = syncedListing.house_rules;
      }
      if (fields.includes('address') && syncedListing.address) {
        updates.address = syncedListing.address;
      }

      // Update the property
      const { error: updateError } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId);
      
      if (updateError) throw updateError;

      // Link connection to property
      await supabase
        .from('ota_listing_connections')
        .update({ property_id: propertyId })
        .eq('id', connectionId);

      return { updated: Object.keys(updates) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['ota-connections'] });
      toast.success('Данные применены к объекту');
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });
}
