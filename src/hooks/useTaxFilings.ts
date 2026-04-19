/**
 * @module useTaxFilings
 * Thai tax filings: WHT 3%, VAT 7%, PND 1/3/53, SBT.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export type TaxFilingType = 'wht_3'|'vat_7'|'pnd_1'|'pnd_3'|'pnd_53'|'sbt';
export type TaxFilingStatus = 'draft'|'calculated'|'filed'|'paid'|'overdue';

export interface TaxFiling {
  id: string;
  company_id: string;
  filing_type: TaxFilingType;
  period_start: string;
  period_end: string;
  taxable_base: number;
  tax_rate: number;
  tax_amount: number;
  currency: string;
  status: TaxFilingStatus;
  filed_at: string | null;
  paid_at: string | null;
  reference_number: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
}

export const TAX_TYPE_INFO: Record<TaxFilingType, { defaultRate: number; labelEn: string; labelRu: string; descRu: string }> = {
  wht_3: { defaultRate: 3, labelEn: 'WHT 3%', labelRu: 'WHT 3%', descRu: 'Удерживаемый налог с услуг' },
  vat_7: { defaultRate: 7, labelEn: 'VAT 7%', labelRu: 'НДС 7%', descRu: 'НДС на услуги управления' },
  pnd_1: { defaultRate: 0, labelEn: 'PND 1', labelRu: 'PND 1', descRu: 'WHT с зарплат сотрудникам' },
  pnd_3: { defaultRate: 0, labelEn: 'PND 3', labelRu: 'PND 3', descRu: 'WHT с физлиц-подрядчиков' },
  pnd_53: { defaultRate: 0, labelEn: 'PND 53', labelRu: 'PND 53', descRu: 'WHT с компаний-контрагентов' },
  sbt: { defaultRate: 3.3, labelEn: 'SBT', labelRu: 'SBT', descRu: 'Спец-налог на бизнес' },
};

export function useTaxFilings(status?: TaxFilingStatus | 'all') {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  return useQuery({
    queryKey: ['tax-filings', companyId, status],
    queryFn: async () => {
      let q = supabase
        .from('tax_filings')
        .select('*')
        .eq('company_id', companyId!)
        .order('period_end', { ascending: false });
      if (status && status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as TaxFiling[];
    },
    enabled: !!companyId,
  });
}

export function useCreateTaxFiling() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (input: {
      filing_type: TaxFilingType;
      period_start: string;
      period_end: string;
      taxable_base: number;
      tax_rate?: number;
      notes?: string;
    }) => {
      if (!activeCompany) throw new Error('No active company');
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const rate = input.tax_rate ?? TAX_TYPE_INFO[input.filing_type].defaultRate;
      const tax = (input.taxable_base * rate) / 100;

      const { data, error } = await supabase
        .from('tax_filings')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          company_id: activeCompany.company_id,
          filing_type: input.filing_type,
          period_start: input.period_start,
          period_end: input.period_end,
          taxable_base: input.taxable_base,
          tax_rate: rate,
          tax_amount: tax,
          currency: 'THB',
          status: 'calculated',
          notes: input.notes ?? null,
          created_by: userId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax-filings'] });
      toast.success('Декларация рассчитана');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTaxFilingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reference_number }: { id: string; status: TaxFilingStatus; reference_number?: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === 'filed') update.filed_at = new Date().toISOString();
      if (status === 'paid') update.paid_at = new Date().toISOString();
      if (reference_number) update.reference_number = reference_number;
      const { error } = await supabase
        .from('tax_filings')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(update as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax-filings'] });
      toast.success('Статус обновлён');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
