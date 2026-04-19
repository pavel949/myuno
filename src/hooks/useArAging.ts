/**
 * @module useArAging
 * Accounts receivable aging — debtor balances bucketed 0-30/31-60/61-90/90+.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface ArAgingRow {
  company_id: string;
  recipient_name: string;
  recipient_email: string | null;
  currency: string;
  open_invoices: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total_outstanding: number;
}

export function useArAging() {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  return useQuery({
    queryKey: ['ar-aging', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('v_ar_aging' as any)
        .select('*')
        .eq('company_id', companyId!)
        .order('total_outstanding', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ArAgingRow[];
    },
    enabled: !!companyId,
  });
}
