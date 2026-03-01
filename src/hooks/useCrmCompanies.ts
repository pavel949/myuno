/**
 * @module useCrmCompanies
 * CRUD hooks for crm_companies entity
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrmCompanyEntity {
  id: string;
  company_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  logo_url: string | null;
  tags: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  contact_count?: number;
}

const from = (table: string) => (supabase as any).from(table);

export function useCrmCompanies(companyId: string | undefined, search?: string) {
  return useQuery({
    queryKey: ['crm-companies', companyId, search],
    queryFn: async (): Promise<CrmCompanyEntity[]> => {
      let q = from('crm_companies')
        .select('*, crm_contacts(id)')
        .eq('company_id', companyId!)
        .eq('is_active', true)
        .order('name');

      if (search && search.trim().length >= 2) {
        q = q.ilike('name', `%${search.trim()}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((c: Record<string, unknown>) => ({
        ...c,
        contact_count: Array.isArray(c.crm_contacts) ? c.crm_contacts.length : 0,
        crm_contacts: undefined,
      })) as CrmCompanyEntity[];
    },
    enabled: !!companyId,
  });
}

export function useCrmCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['crm-company', id],
    queryFn: async (): Promise<CrmCompanyEntity | null> => {
      const { data, error } = await from('crm_companies')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as CrmCompanyEntity | null;
    },
    enabled: !!id,
  });
}

export function useCreateCrmCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (company: Omit<CrmCompanyEntity, 'id' | 'created_at' | 'updated_at' | 'contact_count'>) => {
      const { data, error } = await from('crm_companies').insert(company).select().single();
      if (error) throw error;
      return data as CrmCompanyEntity;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-companies'] }),
  });
}

export function useUpdateCrmCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmCompanyEntity> & { id: string }) => {
      const { error } = await from('crm_companies').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm-companies'] });
      qc.invalidateQueries({ queryKey: ['crm-company', vars.id] });
    },
  });
}

export function useDeleteCrmCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from('crm_companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-companies'] }),
  });
}

/** Search companies for autocomplete */
export function useCrmCompanySearch(companyId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['crm-company-search', companyId, query],
    queryFn: async (): Promise<CrmCompanyEntity[]> => {
      const { data, error } = await from('crm_companies')
        .select('*')
        .eq('company_id', companyId!)
        .ilike('name', `%${query.trim()}%`)
        .limit(10);
      if (error) throw error;
      return (data || []) as CrmCompanyEntity[];
    },
    enabled: !!companyId && query.trim().length >= 2,
  });
}

export const COMPANY_SIZES = ['small', 'medium', 'large', 'enterprise'] as const;
export const COMPANY_INDUSTRIES = [
  'Real Estate', 'Technology', 'Finance', 'Healthcare', 'Retail',
  'Hospitality', 'Construction', 'Education', 'Consulting', 'Other',
] as const;
