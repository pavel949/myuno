import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type RecipientType = 'coagent' | 'staff' | 'partner' | 'broker' | 'ota';
export type CommissionType = 'percent_net' | 'percent_gross' | 'fixed' | 'per_booking';
export type PayoutFrequency = 'per_booking' | 'monthly' | 'quarterly';

export interface PayoutRule {
  id: string;
  property_id: string;
  management_terms_id: string | null;
  recipient_type: RecipientType;
  recipient_staff_id: string | null;
  recipient_name: string | null;
  commission_type: CommissionType;
  commission_value: number;
  deduct_before_owner: boolean;
  min_payout: number | null;
  payout_frequency: PayoutFrequency;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PayoutRuleInsert = Omit<PayoutRule, 'id' | 'created_at' | 'updated_at'>;
export type PayoutRuleUpdate = Partial<PayoutRuleInsert>;

// Use untyped access since table is new
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = () => (supabase as any).from('property_payout_rules');

export function usePayoutRules(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payout-rules', propertyId],
    enabled: !!user && !!propertyId,
    queryFn: async () => {
      const { data, error } = await from()
        .select('*')
        .eq('property_id', propertyId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as PayoutRule[];
    },
  });
}

export function useCreatePayoutRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: PayoutRuleInsert) => {
      const { data, error } = await from()
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data as PayoutRule;
    },
    onSuccess: (result: PayoutRule) => {
      queryClient.invalidateQueries({ queryKey: ['payout-rules', result.property_id] });
      toast.success('Правило выплаты добавлено');
    },
  });
}

export function useUpdatePayoutRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, propertyId, updates }: { id: string; propertyId: string; updates: PayoutRuleUpdate }) => {
      const { data, error } = await from()
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...(data as PayoutRule), property_id: propertyId };
    },
    onSuccess: (result: PayoutRule) => {
      queryClient.invalidateQueries({ queryKey: ['payout-rules', result.property_id] });
    },
  });
}

export function useDeletePayoutRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await from()
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, propertyId };
    },
    onSuccess: ({ propertyId }: { id: string; propertyId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['payout-rules', propertyId] });
      toast.success('Правило удалено');
    },
  });
}

// Accounting policy types
export interface AccountingPolicy {
  net_profit_deductions: string[];
  report_frequency: 'monthly' | 'quarterly' | 'on_demand';
  report_format: 'summary' | 'detailed';
  report_language: string;
  minimum_payout: number | null;
  payout_hold_days: number | null;
  include_pending_bookings: boolean;
  owner_approval_required_above: number | null;
  tax_withholding_percent: number | null;
}

export const DEFAULT_ACCOUNTING_POLICY: AccountingPolicy = {
  net_profit_deductions: ['cleaning', 'electricity', 'water', 'internet', 'cam_fees'],
  report_frequency: 'monthly',
  report_format: 'detailed',
  report_language: 'ru',
  minimum_payout: null,
  payout_hold_days: 7,
  include_pending_bookings: false,
  owner_approval_required_above: null,
  tax_withholding_percent: null,
};
