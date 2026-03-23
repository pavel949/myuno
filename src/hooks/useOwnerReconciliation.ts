/**
 * Cumulative financial reconciliation for owner report.
 * Aggregates property_financials by period (month) with opening/closing balance.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReconciliationRow {
  period: string;
  periodLabel: string;
  openingBalance: number;
  income: number;
  expenses: number;
  managementFee: number;
  netMovement: number;
  closingBalance: number;
}

export function useOwnerReconciliation(propertyId: string | undefined, limitMonths = 12) {
  return useQuery({
    queryKey: ['owner-reconciliation', propertyId, limitMonths],
    queryFn: async (): Promise<ReconciliationRow[]> => {
      if (!propertyId) return [];

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - limitMonths);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const { data: rows, error } = await supabase
        .from('property_financials')
        .select('transaction_date, transaction_type, amount, category')
        .eq('property_id', propertyId)
        .gte('transaction_date', cutoffStr);

      if (error) throw error;

      // Group by month
      const byPeriod = new Map<
        string,
        { income: number; expenses: number; managementFee: number }
      >();

      (rows || []).forEach((r: { transaction_date: string; transaction_type: string; amount: number; category: string | null }) => {
        const period = r.transaction_date.slice(0, 7); // YYYY-MM
        const amt = Number(r.amount || 0);
        const rec = byPeriod.get(period) || { income: 0, expenses: 0, managementFee: 0 };

        if (r.transaction_type === 'income') {
          rec.income += amt;
        } else if (r.transaction_type === 'expense') {
          rec.expenses += amt;
          if (r.category === 'management_fee' || r.category === 'commission') {
            rec.managementFee += amt;
          }
        }
        byPeriod.set(period, rec);
      });

      // Sort periods ascending, build cumulative rows
      const periods = Array.from(byPeriod.keys()).sort();
      const result: ReconciliationRow[] = [];
      let prevClosing = 0;

      for (const p of periods) {
        const rec = byPeriod.get(p)!;
        const netMovement = rec.income - rec.expenses;
        const closingBalance = prevClosing + netMovement;

        const [y, m] = p.split('-');
        const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        const periodLabel = d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });

        result.push({
          period: p,
          periodLabel,
          openingBalance: prevClosing,
          income: rec.income,
          expenses: rec.expenses,
          managementFee: rec.managementFee,
          netMovement,
          closingBalance,
        });
        prevClosing = closingBalance;
      }

      return result;
    },
    enabled: !!propertyId,
  });
}
