/**
 * Admin data hooks for B2B partner leads captured by the /thai-business landing.
 *
 * Reads from `thai_partner_leads` (admin-only SELECT/UPDATE per RLS). Uses the
 * untyped `thaiTable` boundary since the table is not yet in the generated
 * Supabase types.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { thaiTable } from './db';

export type ThaiLeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';

export interface ThaiPartnerLead {
  id: string;
  contact_name: string;
  business_name: string | null;
  phone: string;
  email: string | null;
  category: string | null;
  interests: string[];
  message: string | null;
  preferred_lang: string | null;
  source: string;
  status: ThaiLeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const LEADS_KEY = ['admin-thai-partner-leads'] as const;

export function useThaiPartnerLeads() {
  return useQuery({
    queryKey: LEADS_KEY,
    queryFn: async (): Promise<ThaiPartnerLead[]> => {
      const { data, error } = await thaiTable('thai_partner_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ThaiPartnerLead[];
    },
  });
}

export function useUpdateThaiLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ThaiLeadStatus }) => {
      const { error } = await thaiTable('thai_partner_leads').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}
