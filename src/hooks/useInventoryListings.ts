import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InventoryListing {
  id: string;
  property_id: string;
  listing_type: string;
  price: number | null;
  currency: string;
  availability_status: string;
  exclusive: boolean;
  commission_structure: Record<string, unknown> | null;
  published_on_channels: string[];
  viewing_count: number;
  inquiry_count: number;
  company_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const LISTING_TYPES = ['sale', 'rent_ltr', 'rent_str', 'club_deal', 'wholesale'] as const;

export const LISTING_TYPE_LABELS: Record<string, { en: string; ru: string }> = {
  sale: { en: 'Sale', ru: 'Продажа' },
  rent_ltr: { en: 'LTR', ru: 'Долгосрок' },
  rent_str: { en: 'STR', ru: 'Краткосрок' },
  club_deal: { en: 'Club Deal', ru: 'Клубная' },
  wholesale: { en: 'Wholesale', ru: 'Оптовая' },
};

export const AVAILABILITY_STATUSES = ['available', 'reserved', 'sold', 'rented', 'withdrawn'] as const;

export const AVAILABILITY_STATUS_LABELS: Record<string, { en: string; ru: string; status: string }> = {
  available: { en: 'Available', ru: 'Доступен', status: 'active' },
  reserved: { en: 'Reserved', ru: 'Резерв', status: 'warning' },
  sold: { en: 'Sold', ru: 'Продан', status: 'info' },
  rented: { en: 'Rented', ru: 'Сдан', status: 'info' },
  withdrawn: { en: 'Withdrawn', ru: 'Снят', status: 'inactive' },
};

export function useInventoryListings(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['inventory-listings', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('inventory_listings')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as InventoryListing[];
    },
    enabled: !!propertyId,
  });
}

export function useCreateInventoryListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      property_id: string;
      listing_type: string;
      price?: number | null;
      currency?: string;
      exclusive?: boolean;
      company_id: string;
      created_by?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('inventory_listings')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['inventory-listings', vars.property_id] });
    },
  });
}

export function useUpdateInventoryListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId, ...updates }: { id: string; propertyId: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from('inventory_listings')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
      return propertyId;
    },
    onSuccess: (propertyId) => {
      qc.invalidateQueries({ queryKey: ['inventory-listings', propertyId] });
    },
  });
}

export function useDeleteInventoryListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await supabase.from('inventory_listings').delete().eq('id', id);
      if (error) throw error;
      return propertyId;
    },
    onSuccess: (propertyId) => {
      qc.invalidateQueries({ queryKey: ['inventory-listings', propertyId] });
    },
  });
}
