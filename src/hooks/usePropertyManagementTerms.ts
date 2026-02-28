import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ExpenseParty = 'owner' | 'manager' | 'split';

export interface ExpenseResponsibility {
  cleaning: ExpenseParty;
  electricity: ExpenseParty;
  water: ExpenseParty;
  internet: ExpenseParty;
  repairs_minor: ExpenseParty;
  repairs_major: ExpenseParty;
  cam_fees: ExpenseParty;
  insurance: ExpenseParty;
  marketing: ExpenseParty;
}

export interface ManagementTerms {
  id: string;
  property_id: string;
  manager_user_id: string;
  commission_rate: number | null;
  commission_type: 'percent' | 'fixed';
  commission_amount: number | null;
  commission_base: 'gross' | 'net';
  revenue_split_owner: number | null;
  revenue_split_manager: number | null;
  expense_responsibility: ExpenseResponsibility;
  payment_day: number | null;
  payment_currency: string;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
  status: 'draft' | 'active' | 'pending_approval' | 'archived';
  created_at: string;
  updated_at: string;
  // joined
  property?: {
    id: string;
    title_en: string | null;
    title_ru: string | null;
    management_type: string | null;
    address: string | null;
  };
}

export type ManagementTermsUpdate = Partial<Omit<ManagementTerms, 'id' | 'created_at' | 'updated_at' | 'property'>>;

export const DEFAULT_EXPENSES: ExpenseResponsibility = {
  cleaning: 'manager',
  electricity: 'owner',
  water: 'owner',
  internet: 'owner',
  repairs_minor: 'manager',
  repairs_major: 'owner',
  cam_fees: 'owner',
  insurance: 'owner',
  marketing: 'manager',
};
// Type-safe: property_management_terms exists in Database schema
const db = supabase;

export function usePropertyManagementTerms(propertyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['management-terms', propertyId],
    enabled: !!user && !!propertyId,
    queryFn: async () => {
      const { data, error } = await db
        .from('property_management_terms')
        .select('*')
        .eq('property_id', propertyId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ManagementTerms[];
    },
  });
}

export function useAllManagementTerms() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['management-terms-all', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('property_management_terms')
        .select(`
          *,
          property:properties(id, title_en, title_ru, management_type, address)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ManagementTerms[];
    },
  });
}

export function useCreateManagementTerms() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ManagementTermsUpdate & { property_id: string }) => {
      if (!user) throw new Error('Not authenticated');

      const payload = {
        property_id: data.property_id,
        manager_user_id: data.manager_user_id || user.id,
        commission_rate: data.commission_rate ?? null,
        commission_type: data.commission_type ?? 'percent',
        commission_amount: data.commission_amount ?? null,
        commission_base: data.commission_base ?? 'gross',
        revenue_split_owner: data.revenue_split_owner ?? null,
        revenue_split_manager: data.revenue_split_manager ?? null,
        expense_responsibility: (data.expense_responsibility ?? DEFAULT_EXPENSES) as unknown as Record<string, string>,
        payment_day: data.payment_day ?? null,
        payment_currency: data.payment_currency ?? 'THB',
        valid_from: data.valid_from ?? null,
        valid_until: data.valid_until ?? null,
        notes: data.notes ?? null,
        status: data.status ?? 'draft',
      };

      const { data: result, error } = await db
        .from('property_management_terms')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result as unknown as ManagementTerms;
    },
    onSuccess: (result: ManagementTerms) => {
      queryClient.invalidateQueries({ queryKey: ['management-terms', result.property_id] });
      queryClient.invalidateQueries({ queryKey: ['management-terms-all'] });
    },
  });
}

export function useUpdateManagementTerms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ManagementTermsUpdate }) => {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.expense_responsibility) {
        payload.expense_responsibility = updates.expense_responsibility as unknown as Record<string, string>;
      }

      const { data, error } = await db
        .from('property_management_terms')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ManagementTerms;
    },
    onSuccess: (result: ManagementTerms) => {
      queryClient.invalidateQueries({ queryKey: ['management-terms', result.property_id] });
      queryClient.invalidateQueries({ queryKey: ['management-terms-all'] });
    },
  });
}

export function useDeleteManagementTerms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await db
        .from('property_management_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, propertyId };
    },
    onSuccess: ({ propertyId }: { id: string; propertyId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['management-terms', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['management-terms-all'] });
      toast.success('Условия управления удалены');
    },
  });
}
