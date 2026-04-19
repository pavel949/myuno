import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';
import { useMemo } from 'react';
import {
  computePnL, applyScenario, emptyDrivers,
  type Drivers, type CapExItem, type LoanItem, type Assumptions, type ExpenseRow,
} from '@/lib/finance/financialModelMath';
import { usePropertyBudgets } from '@/hooks/usePropertyBudgets';

export type Scenario = 'base' | 'optimistic' | 'pessimistic';

export interface FinancialModel {
  id: string;
  property_id: string | null;
  company_id: string | null;
  owner_id: string;
  model_year: number;
  scenario: Scenario;
  drivers: Drivers;
  capex: CapExItem[];
  loans: LoanItem[];
  assumptions: Assumptions;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useFinancialModel(propertyId: string | undefined, year: number, scenario: Scenario = 'base') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['financial-model', user?.id, propertyId, year, scenario],
    queryFn: async (): Promise<FinancialModel | null> => {
      if (!user || !propertyId) return null;
      const { data, error } = await supabase
        .from('property_financial_models' as never)
        .select('*')
        .eq('property_id', propertyId)
        .eq('model_year', year)
        .eq('scenario', scenario)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      const row = data as Record<string, unknown>;
      return {
        ...(row as object),
        drivers: (row.drivers as Drivers) || emptyDrivers(year),
        capex: (row.capex as CapExItem[]) || [],
        loans: (row.loans as LoanItem[]) || [],
        assumptions: (row.assumptions as Assumptions) || {},
      } as FinancialModel;
    },
    enabled: !!user && !!propertyId,
  });
}

export function useSaveFinancialModel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  return useMutation({
    mutationFn: async (input: {
      property_id: string;
      model_year: number;
      scenario: Scenario;
      drivers: Drivers;
      capex?: CapExItem[];
      loans?: LoanItem[];
      assumptions?: Assumptions;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const row = {
        property_id: input.property_id,
        company_id: activeCompany?.company_id ?? null,
        owner_id: user.id,
        model_year: input.model_year,
        scenario: input.scenario,
        drivers: input.drivers,
        capex: input.capex ?? [],
        loans: input.loans ?? [],
        assumptions: input.assumptions ?? {},
        notes: input.notes ?? null,
      };
      const { error } = await supabase
        .from('property_financial_models' as never)
        .upsert(row as never, { onConflict: 'property_id,model_year,scenario' });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['financial-model'] });
      qc.invalidateQueries({ queryKey: ['financial-model', user?.id, vars.property_id, vars.model_year, vars.scenario] });
    },
    onError: (e: Error) => toast.error('Ошибка сохранения: ' + e.message),
  });
}

/**
 * Build budget ExpenseRow[] for a given year by aggregating monthly property_budgets.
 */
function useYearlyBudgetRows(propertyId: string | undefined, year: number, type: 'income' | 'expense') {
  const { data: budgets } = usePropertyBudgets(propertyId, undefined);
  return useMemo(() => {
    if (!budgets) return [] as ExpenseRow[];
    const map = new Map<string, number[]>();
    budgets
      .filter(b => b.transaction_type === type)
      .filter(b => new Date(b.budget_month).getFullYear() === year)
      .forEach(b => {
        const monthIdx = new Date(b.budget_month).getMonth();
        const cur = map.get(b.category) || Array(12).fill(0);
        cur[monthIdx] = (cur[monthIdx] || 0) + Number(b.planned_amount || 0);
        map.set(b.category, cur);
      });
    return Array.from(map.entries()).map(([category, monthly]) => ({ category, monthly }));
  }, [budgets, year, type]);
}

export function useFinancialModelComputed(
  propertyId: string | undefined,
  year: number,
  scenario: Scenario = 'base'
) {
  const { data: model, isLoading } = useFinancialModel(propertyId, year, scenario);
  const expenseRows = useYearlyBudgetRows(propertyId, year, 'expense');
  const incomeRows = useYearlyBudgetRows(propertyId, year, 'income');

  const computed = useMemo(() => {
    const drivers = model?.drivers || emptyDrivers(year);
    const mult = applyScenario(scenario);
    const assumptions: Assumptions = {
      ...(model?.assumptions || {}),
      scenarioMultipliers: { revenue: mult.revenue, cost: mult.cost },
    };
    return computePnL({
      drivers,
      budgetExpenses: expenseRows,
      budgetExtraIncome: incomeRows.filter(r => r.category !== 'rent'),
      capex: model?.capex || [],
      loans: model?.loans || [],
      assumptions,
    });
  }, [model, expenseRows, incomeRows, year, scenario]);

  return { model, computed, isLoading };
}

/**
 * Plan vs Actual aggregator for the year — sums actuals per month from property_financials.
 */
export function usePlanVsActual(propertyId: string | undefined, year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['plan-vs-actual', user?.id, propertyId, year],
    queryFn: async () => {
      if (!user || !propertyId) return null;
      const { data, error } = await supabase
        .from('property_financials')
        .select('amount, transaction_type, transaction_date, category')
        .eq('property_id', propertyId)
        .gte('transaction_date', `${year}-01-01`)
        .lte('transaction_date', `${year}-12-31`);
      if (error) throw error;
      const incomeByMonth = Array(12).fill(0);
      const expenseByMonth = Array(12).fill(0);
      (data || []).forEach((r: { amount: number; transaction_type: string; transaction_date: string }) => {
        const m = new Date(r.transaction_date).getMonth();
        if (r.transaction_type === 'income') incomeByMonth[m] += Number(r.amount);
        else if (r.transaction_type === 'expense') expenseByMonth[m] += Number(r.amount);
      });
      return { incomeByMonth, expenseByMonth };
    },
    enabled: !!user && !!propertyId,
  });
}
