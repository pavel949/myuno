/**
 * @module useCrmQuotes
 * CRUD hooks for crm_quotes
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';

export interface CrmQuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CrmQuote {
  id: string;
  company_id: string;
  deal_id: string | null;
  contact_id: string;
  quote_number: string;
  status: string;
  title: string | null;
  items: CrmQuoteItem[];
  subtotal: number | null;
  tax_percent: number | null;
  total: number | null;
  currency: string;
  valid_until: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_by: string;
  created_at: string;
}

export function useCrmQuotes(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-quotes', companyId],
    queryFn: async (): Promise<CrmQuote[]> => {
      const { data, error } = await typedFrom('crm_quotes')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CrmQuote[];
    },
    enabled: !!companyId,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quote: Omit<CrmQuote, 'id' | 'created_at'>) => {
      const { data, error } = await typedFrom('crm_quotes').insert(quote).select().single();
      if (error) throw error;
      return data as CrmQuote;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-quotes'] }),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmQuote> & { id: string }) => {
      const { error } = await typedFrom('crm_quotes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-quotes'] }),
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await typedFrom('crm_quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-quotes'] }),
  });
}
