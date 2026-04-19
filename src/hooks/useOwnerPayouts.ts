/**
 * @module useOwnerPayouts
 * Owner payouts registry & batch runs (Phase 1: P0 financials).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export type OwnerPayoutStatus = 'draft'|'pending'|'approved'|'processing'|'paid'|'failed'|'cancelled';
export type PayoutRunStatus = 'draft'|'processing'|'completed'|'failed'|'cancelled';

export interface OwnerPayout {
  id: string;
  company_id: string;
  owner_id: string;
  property_id: string | null;
  run_id: string | null;
  payout_number: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  mgmt_commission: number;
  expenses: number;
  wht_amount: number;
  vat_amount: number;
  other_deductions: number;
  net_payout: number;
  currency: string;
  status: OwnerPayoutStatus;
  bank_reference: string | null;
  bank_account_last4: string | null;
  payment_method: string | null;
  paid_at: string | null;
  statement_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface PayoutRun {
  id: string;
  company_id: string;
  run_name: string | null;
  period_start: string;
  period_end: string;
  payouts_count: number;
  total_amount: number;
  currency: string;
  status: PayoutRunStatus;
  notes: string | null;
  processed_at: string | null;
  created_at: string;
}

export function useOwnerPayouts(status?: OwnerPayoutStatus | 'all') {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  return useQuery({
    queryKey: ['owner-payouts', companyId, status],
    queryFn: async () => {
      let q = supabase
        .from('owner_payouts')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (status && status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as OwnerPayout[];
    },
    enabled: !!companyId,
  });
}

export function usePayoutRuns() {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  return useQuery({
    queryKey: ['payout-runs', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_runs')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PayoutRun[];
    },
    enabled: !!companyId,
  });
}

export function useCreatePayout() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();

  return useMutation({
    mutationFn: async (input: Partial<OwnerPayout> & { owner_id: string; period_start: string; period_end: string }) => {
      if (!activeCompany) throw new Error('No active company');
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const net = (input.gross_revenue || 0)
        - (input.mgmt_commission || 0)
        - (input.expenses || 0)
        - (input.wht_amount || 0)
        - (input.vat_amount || 0)
        - (input.other_deductions || 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        ...input,
        company_id: activeCompany.company_id,
        created_by: userId,
        payout_number: '',
        net_payout: net,
        currency: input.currency || 'THB',
        status: input.status || 'draft',
      };
      const { data, error } = await supabase
        .from('owner_payouts')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-payouts'] });
      toast.success('Выплата создана');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePayoutStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, bank_reference }: { id: string; status: OwnerPayoutStatus; bank_reference?: string }) => {
      const update: Record<string, unknown> = { status };
      if (bank_reference) update.bank_reference = bank_reference;
      if (status === 'paid') update.paid_at = new Date().toISOString();
      const { error } = await supabase
        .from('owner_payouts')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(update as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-payouts'] });
      toast.success('Статус обновлён');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
