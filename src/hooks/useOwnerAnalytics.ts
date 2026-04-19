/**
 * Owner profitability cohort analytics — last 12 months revenue/expenses/net per owner.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface OwnerProfitabilityRow {
  owner_id: string;
  company_id: string;
  property_count: number;
  revenue_12m: number;
  expenses_12m: number;
  net_income_12m: number;
  net_margin_pct: number;
  first_property_at: string | null;
  last_transaction_date: string | null;
}

export function useOwnerProfitability() {
  const { activeCompany } = useActiveCompany();
  return useQuery({
    queryKey: ['owner-profitability', activeCompany?.company_id],
    queryFn: async (): Promise<OwnerProfitabilityRow[]> => {
      if (!activeCompany) return [];
      const { data, error } = await (supabase as any)
        .from('v_owner_profitability')
        .select('*')
        .eq('company_id', activeCompany.company_id)
        .order('net_income_12m', { ascending: false });
      if (error) throw error;
      return (data || []) as OwnerProfitabilityRow[];
    },
    enabled: !!activeCompany,
  });
}
