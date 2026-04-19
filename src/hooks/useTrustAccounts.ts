/**
 * @module useTrustAccounts
 * Trust/escrow segregated accounts (Thai DBD compliance for PM agencies).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export type TrustAccountType = 'guest_deposit'|'owner_funds'|'reserve'|'operating';

export interface TrustAccount {
  id: string;
  company_id: string;
  account_type: TrustAccountType;
  account_name: string;
  account_name_ru: string | null;
  bank_name: string | null;
  bank_account_last4: string | null;
  current_balance: number;
  reserved_balance: number;
  available_balance: number;
  currency: string;
  is_active: boolean;
  notes: string | null;
}

export interface TrustMovement {
  id: string;
  trust_account_id: string;
  company_id: string;
  direction: 'in'|'out'|'reserve'|'release';
  amount: number;
  currency: string;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  movement_date: string;
  created_at: string;
}

export function useTrustAccounts() {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  return useQuery({
    queryKey: ['trust-accounts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_accounts')
        .select('*')
        .eq('company_id', companyId!)
        .order('account_type');
      if (error) throw error;
      return (data || []) as unknown as TrustAccount[];
    },
    enabled: !!companyId,
  });
}

export function useTrustMovements(accountId?: string) {
  return useQuery({
    queryKey: ['trust-movements', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_account_movements')
        .select('*')
        .eq('trust_account_id', accountId!)
        .order('movement_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as TrustMovement[];
    },
    enabled: !!accountId,
  });
}

export function useUpsertTrustAccount() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (input: Partial<TrustAccount> & { account_type: TrustAccountType; account_name: string }) => {
      if (!activeCompany) throw new Error('No active company');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...input, company_id: activeCompany.company_id };
      const { data, error } = await supabase
        .from('trust_accounts')
        .upsert(payload, { onConflict: 'company_id,account_type,currency' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trust-accounts'] });
      toast.success('Счёт сохранён');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecordTrustMovement() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (input: {
      trust_account_id: string;
      direction: TrustMovement['direction'];
      amount: number;
      currency?: string;
      description?: string;
      reference_type?: string;
      reference_id?: string;
    }) => {
      if (!activeCompany) throw new Error('No active company');
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      // Insert movement
      const { error: mErr } = await supabase
        .from('trust_account_movements')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          ...input,
          company_id: activeCompany.company_id,
          currency: input.currency || 'THB',
          created_by: userId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      if (mErr) throw mErr;

      // Update balance atomically — fetch current then update
      const { data: acc, error: aErr } = await supabase
        .from('trust_accounts')
        .select('current_balance,reserved_balance')
        .eq('id', input.trust_account_id)
        .single();
      if (aErr) throw aErr;

      let newCurrent = Number(acc.current_balance);
      let newReserved = Number(acc.reserved_balance);
      if (input.direction === 'in') newCurrent += input.amount;
      else if (input.direction === 'out') newCurrent -= input.amount;
      else if (input.direction === 'reserve') newReserved += input.amount;
      else if (input.direction === 'release') newReserved -= input.amount;

      const { error: uErr } = await supabase
        .from('trust_accounts')
        .update({ current_balance: newCurrent, reserved_balance: newReserved })
        .eq('id', input.trust_account_id);
      if (uErr) throw uErr;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['trust-accounts'] });
      qc.invalidateQueries({ queryKey: ['trust-movements', vars.trust_account_id] });
      toast.success('Движение записано');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
