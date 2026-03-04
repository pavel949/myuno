import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';

export interface CrmContact {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  phone2: string | null;
  mobile: string | null;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  line_id: string | null;
  nationality: string | null;
  language: string | null;
  source: string | null;
  contact_type: string | null;
  company_name: string | null;
  job_title: string | null;
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
  is_company: boolean;
  created_by: string | null;
  birthday: string | null;
  family_info: string | null;
  interests: string[] | null;
  scoring: number | null;
  created_at: string;
  updated_at: string;
  deal_count?: number;
  // Odoo-style fields
  address_street: string | null;
  address_street2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  address_country: string | null;
  tax_id: string | null;
  website: string | null;
}

export type CrmContactInsert = Omit<CrmContact, 'id' | 'created_at' | 'updated_at' | 'job_title' | 'birthday' | 'family_info' | 'interests' | 'scoring' | 'deal_count' | 'mobile' | 'is_company' | 'address_street' | 'address_street2' | 'address_city' | 'address_state' | 'address_zip' | 'address_country' | 'tax_id' | 'website'> & {
  job_title?: string | null;
  birthday?: string | null;
  family_info?: string | null;
  interests?: string[] | null;
  scoring?: number | null;
  mobile?: string | null;
  is_company?: boolean;
  address_street?: string | null;
  address_street2?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  address_country?: string | null;
  tax_id?: string | null;
  website?: string | null;
};
export type CrmContactUpdate = Partial<CrmContactInsert>;

export const CONTACT_TYPES = ['buyer', 'seller', 'investor', 'tenant', 'landlord', 'agent'] as const;
export const CONTACT_SOURCES = ['website', 'referral', 'walk-in', 'social', 'agent_network', 'other'] as const;
export const CONTACT_TAGS = ['VIP', 'hot', 'warm', 'cold', 'follow-up', 'priority'] as const;

export function useCrmContacts(
  companyId: string | undefined,
  page = 0,
  pageSize = 20,
  filters?: { search?: string; contactType?: string; tag?: string; showArchived?: boolean; source?: string; lifecycleStage?: string; sortBy?: string }
) {
  return useQuery({
    queryKey: ['crm-contacts', companyId, page, pageSize, filters],
    queryFn: async (): Promise<{ data: CrmContact[]; count: number }> => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Determine sort
      const sortField = filters?.sortBy || 'updated_at';
      const ascending = sortField === 'first_name'; // name ascending, rest descending

      let q = supabase
        .from('crm_contacts')
        .select('*, agent_deals(id)', { count: 'exact' })
        .eq('company_id', companyId!)
        .order(sortField, { ascending })
        .range(from, to);

      // Server-side archived filter (default: hide archived)
      if (!filters?.showArchived) {
        q = q.eq('is_archived', false);
      }

      // Server-side search
      if (filters?.search && filters.search.trim().length >= 2) {
        const s = sanitizeSearchTerm(filters.search);
        if (s) q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
      }

      // Server-side type filter
      if (filters?.contactType) {
        q = q.eq('contact_type', filters.contactType);
      }

      // Server-side source filter
      if (filters?.source) {
        q = q.eq('source', filters.source);
      }

      // Server-side lifecycle stage filter
      if (filters?.lifecycleStage) {
        q = q.eq('lifecycle_stage', filters.lifecycleStage);
      }

      // Server-side tag filter
      if (filters?.tag) {
        q = q.contains('tags', [filters.tag]);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      // Attach deal_count to each contact
      const enriched = (data || []).map((c: Record<string, unknown>) => ({
        ...c,
        deal_count: Array.isArray(c.agent_deals) ? c.agent_deals.length : 0,
        agent_deals: undefined,
      }));
      return { data: enriched as unknown as CrmContact[], count: count || 0 };
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
      const q = sanitizeSearchTerm(query);
      if (!q) return [];
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
      return (data || []) as unknown as import('@/hooks/useAgentDeals').AgentDeal[];
    },
    enabled: !!contactId,
  });
}
