/**
 * @module useCooperationTerms
 * CRUD hook for crm_cooperation_terms (contact-level defaults + deal-level overrides)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const PAYMENT_METHODS = [
  'bank_transfer',
  'cash',
  'crypto',
  'paypal',
  'wise',
  'promptpay',
  'stripe',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { en: string; ru: string; icon: string }> = {
  bank_transfer: { en: 'Bank Transfer', ru: 'Банковский перевод', icon: '🏦' },
  cash: { en: 'Cash', ru: 'Наличные', icon: '💵' },
  crypto: { en: 'Cryptocurrency', ru: 'Криптовалюта', icon: '₿' },
  paypal: { en: 'PayPal', ru: 'PayPal', icon: '💳' },
  wise: { en: 'Wise', ru: 'Wise', icon: '🌐' },
  promptpay: { en: 'PromptPay', ru: 'PromptPay', icon: '📱' },
  stripe: { en: 'Stripe', ru: 'Stripe', icon: '💎' },
};

export const PAYOUT_FREQUENCIES = [
  'weekly', 'biweekly', 'monthly', 'per_deal', 'on_completion',
] as const;
export type PayoutFrequency = (typeof PAYOUT_FREQUENCIES)[number];

export const PAYOUT_FREQUENCY_LABELS: Record<PayoutFrequency, { en: string; ru: string }> = {
  weekly: { en: 'Weekly', ru: 'Еженедельно' },
  biweekly: { en: 'Bi-weekly', ru: 'Раз в 2 недели' },
  monthly: { en: 'Monthly', ru: 'Ежемесячно' },
  per_deal: { en: 'Per deal', ru: 'За сделку' },
  on_completion: { en: 'On completion', ru: 'По завершении' },
};

export interface CooperationTerms {
  id: string;
  company_id: string;
  contact_id: string | null;
  deal_id: string | null;
  commission_percent: number | null;
  commission_type: string;
  commission_fixed_amount: number | null;
  commission_currency: string;
  payment_methods: string[];
  preferred_payment_method: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_swift: string | null;
  bank_iban: string | null;
  crypto_wallet_address: string | null;
  crypto_network: string | null;
  paypal_email: string | null;
  wise_email: string | null;
  promptpay_id: string | null;
  stripe_account_id: string | null;
  payout_frequency: string;
  payout_day: number | null;
  minimum_payout_amount: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  auto_renew: boolean;
  notice_period_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCooperationTerms(contactId?: string, dealId?: string) {
  return useQuery({
    queryKey: ['cooperation-terms', contactId, dealId],
    queryFn: async (): Promise<CooperationTerms | null> => {
      let query = supabase.from('crm_cooperation_terms' as any).select('*');
      if (dealId) {
        query = query.eq('deal_id', dealId);
      } else if (contactId) {
        query = query.eq('contact_id', contactId).is('deal_id', null);
      } else {
        return null;
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as CooperationTerms | null;
    },
    enabled: !!(contactId || dealId),
  });
}

export function useUpsertCooperationTerms() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: {
      id?: string;
      companyId: string;
      contactId?: string;
      dealId?: string;
      data: Partial<CooperationTerms>;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const payload = {
        ...args.data,
        company_id: args.companyId,
        contact_id: args.contactId || null,
        deal_id: args.dealId || null,
        created_by: user.id,
      };
      // Remove fields that shouldn't be in upsert
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;

      if (args.id) {
        const { data, error } = await supabase
          .from('crm_cooperation_terms' as any)
          .update(payload)
          .eq('id', args.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('crm_cooperation_terms' as any)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cooperation-terms', vars.contactId, vars.dealId] });
      toast.success('Условия сохранены / Terms saved');
    },
    onError: (e: Error) => {
      toast.error('Ошибка: ' + e.message);
    },
  });
}
