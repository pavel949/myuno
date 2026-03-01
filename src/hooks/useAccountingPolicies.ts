import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export interface AccountingPolicy {
  id: string;
  property_id: string;
  owner_contact_id: string | null;
  company_id: string | null;
  created_by: string;
  report_grouping: 'period' | 'per_booking';
  default_report_type: string;
  default_period: string;
  include_income: boolean;
  include_expenses: boolean;
  include_guest_details: boolean;
  include_booking_source: boolean;
  include_occupancy: boolean;
  include_maintenance: boolean;
  include_commission: boolean;
  income_categories: string[] | null;
  expense_categories: string[] | null;
  policy_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const untypedFrom = (table: string) => (supabase as any).from(table);

export function useAccountingPolicies() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id || null;

  return useQuery({
    queryKey: ['accounting-policies', user?.id, companyId],
    queryFn: async () => {
      if (!user) return [];
      let query = untypedFrom('property_accounting_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AccountingPolicy[];
    },
    enabled: !!user,
  });
}

export function useAccountingPolicyForProperty(propertyId?: string) {
  const { data: policies } = useAccountingPolicies();
  if (!propertyId || !policies) return null;
  return policies.find(p => p.property_id === propertyId) || null;
}

export function useSaveAccountingPolicy() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();

  return useMutation({
    mutationFn: async (input: Partial<AccountingPolicy> & { property_id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const companyId = activeCompany?.company_id || null;

      const payload = {
        ...input,
        company_id: companyId,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      // Upsert on property_id + company_id
      const { data, error } = await untypedFrom('property_accounting_policies')
        .upsert(payload, { onConflict: 'property_id,company_id' })
        .select()
        .single();

      if (error) throw error;
      return data as AccountingPolicy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-policies'] });
      toast.success('Учётная политика сохранена');
    },
    onError: (error: Error) => {
      toast.error('Ошибка сохранения: ' + error.message);
    },
  });
}
