import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getAccessiblePropertyIds } from '@/hooks/usePropertyFinancials';

export interface PropertyBudget {
  id: string;
  property_id: string;
  owner_id: string;
  budget_month: string;
  category: string;
  transaction_type: 'income' | 'expense';
  planned_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetVsActual {
  category: string;
  transaction_type: 'income' | 'expense';
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export function usePropertyBudgets(propertyId?: string, month?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-budgets', user?.id, propertyId, month],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('property_budgets')
        .select('*')
        .order('transaction_type', { ascending: true })
        .order('category', { ascending: true });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        const ids = await getAccessiblePropertyIds(user.id);
        if (ids.length === 0) return [];
        query = query.in('property_id', ids);
      }

      if (month) {
        query = query.eq('budget_month', month);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PropertyBudget[];
    },
    enabled: !!user,
  });
}

export function useBudgetVsActual(propertyId: string, month: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget-vs-actual', user?.id, propertyId, month],
    queryFn: async (): Promise<BudgetVsActual[]> => {
      if (!user || !propertyId || !month) return [];

      // Get the month range
      const startDate = month; // e.g. '2025-03-01'
      const endDate = new Date(new Date(month).getFullYear(), new Date(month).getMonth() + 1, 0)
        .toISOString().split('T')[0];

      // Fetch budgets and actuals in parallel
      const [{ data: budgets }, { data: actuals }] = await Promise.all([
        supabase
          .from('property_budgets')
          .select('*')
          .eq('property_id', propertyId)
          .eq('budget_month', month),
        supabase
          .from('property_financials')
          .select('category, transaction_type, amount')
          .eq('property_id', propertyId)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate),
      ]);

      // Build map of actuals by category+type
      const actualMap: Record<string, number> = {};
      (actuals || []).forEach((a: any) => {
        const key = `${a.transaction_type}:${a.category || 'other'}`;
        actualMap[key] = (actualMap[key] || 0) + Number(a.amount);
      });

      // Build comparison rows
      const allCategories = new Set<string>();
      (budgets || []).forEach((b: any) => allCategories.add(`${b.transaction_type}:${b.category}`));
      Object.keys(actualMap).forEach(k => allCategories.add(k));

      const results: BudgetVsActual[] = [];
      allCategories.forEach(key => {
        const [type, category] = key.split(':');
        const budget = (budgets || []).find(
          (b: any) => b.category === category && b.transaction_type === type
        );
        const planned = budget ? Number((budget as any).planned_amount) : 0;
        const actual = actualMap[key] || 0;
        const variance = planned - actual;
        const variancePercent = planned > 0 ? Math.round((variance / planned) * 100) : actual > 0 ? -100 : 0;

        results.push({
          category,
          transaction_type: type as 'income' | 'expense',
          planned,
          actual,
          variance,
          variancePercent,
        });
      });

      return results.sort((a, b) => {
        if (a.transaction_type !== b.transaction_type) return a.transaction_type === 'income' ? -1 : 1;
        return a.category.localeCompare(b.category);
      });
    },
    enabled: !!user && !!propertyId && !!month,
  });
}

export function useSaveBudget() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (items: Array<{
      property_id: string;
      budget_month: string;
      category: string;
      transaction_type: 'income' | 'expense';
      planned_amount: number;
      currency?: string;
      notes?: string;
    }>) => {
      if (!user) throw new Error('Not authenticated');

      const rows = items.map(i => ({
        ...i,
        owner_id: user.id,
        currency: i.currency || 'THB',
      }));

      const { error } = await supabase
        .from('property_budgets')
        .upsert(rows as any, {
          onConflict: 'property_id,budget_month,category,transaction_type',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property-budgets'] });
      qc.invalidateQueries({ queryKey: ['budget-vs-actual'] });
      toast.success('Бюджет сохранён');
    },
    onError: (e: Error) => {
      toast.error('Ошибка: ' + e.message);
    },
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_budgets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property-budgets'] });
      qc.invalidateQueries({ queryKey: ['budget-vs-actual'] });
    },
  });
}
