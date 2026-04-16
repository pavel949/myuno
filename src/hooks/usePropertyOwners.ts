import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyOwner {
  id: string;
  property_id: string;
  contact_id: string;
  role: string;
  ownership_pct: number | null;
  since: string | null;
  until: string | null;
  notes: string | null;
  company_id: string;
  created_at: string;
  // joined contact fields
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  };
}

export function usePropertyOwners(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-owners', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_owners')
        .select('*, contact:crm_contacts(id, first_name, last_name, phone, email)')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as PropertyOwner[];
    },
    enabled: !!propertyId,
  });
}

export function useContactOwnedProperties(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-owned-properties', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('property_owners')
        .select('*, property:properties(id, title_en, title_ru, property_type, district, bedrooms, price_thb, cover_image_url)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
  });
}

export function useAddPropertyOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      property_id: string;
      contact_id: string;
      role: string;
      ownership_pct?: number | null;
      since?: string | null;
      until?: string | null;
      notes?: string | null;
      company_id: string;
    }) => {
      const { data, error } = await supabase
        .from('property_owners')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['property-owners', vars.property_id] });
    },
  });
}

export function useRemovePropertyOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await supabase.from('property_owners').delete().eq('id', id);
      if (error) throw error;
      return propertyId;
    },
    onSuccess: (propertyId) => {
      qc.invalidateQueries({ queryKey: ['property-owners', propertyId] });
    },
  });
}
