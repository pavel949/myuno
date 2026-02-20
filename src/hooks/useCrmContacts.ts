import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CrmContact {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  line_id: string | null;
  nationality: string | null;
  language: string | null;
  source: string | null;
  contact_type: string | null;
  company_name: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  preferred_districts: string[] | null;
  preferred_types: string[] | null;
  bedrooms_min: number | null;
  notes: string | null;
  tags: string[];
  avatar_url: string | null;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CrmContactInsert = Omit<CrmContact, 'id' | 'created_at' | 'updated_at'>;
export type CrmContactUpdate = Partial<CrmContactInsert>;

export const CONTACT_TYPES = ['buyer', 'seller', 'investor', 'tenant', 'landlord', 'agent'] as const;
export const CONTACT_SOURCES = ['website', 'referral', 'walk-in', 'social', 'agent_network', 'other'] as const;
export const CONTACT_TAGS = ['VIP', 'hot', 'warm', 'cold', 'follow-up', 'priority'] as const;

export function useCrmContacts(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-contacts', companyId],
    queryFn: async (): Promise<CrmContact[]> => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('company_id', companyId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CrmContact[];
    },
    enabled: !!companyId,
  });
}

export function useCrmContact(contactId: string | undefined) {
  return useQuery({
    queryKey: ['crm-contact', contactId],
    queryFn: async (): Promise<CrmContact | null> => {
      if (!contactId) return null;
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CrmContact | null;
    },
    enabled: !!contactId,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: CrmContactInsert) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contact as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: CrmContactUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
      qc.invalidateQueries({ queryKey: ['crm-contact', vars.id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
  });
}

/** Search contacts by name/phone for autocomplete */
export function useContactSearch(companyId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['crm-contact-search', companyId, query],
    queryFn: async (): Promise<CrmContact[]> => {
      const q = query.trim().toLowerCase();
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('company_id', companyId!)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as CrmContact[];
    },
    enabled: !!companyId && query.trim().length >= 2,
  });
}

/** Get deals linked to a contact */
export function useContactDeals(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-deals', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_deals')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
  });
}
