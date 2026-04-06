import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReconciliationResult {
  totalOrders: number;
  matchedOrders: number;
  missingLedger: number;
  amountMismatch: number;
  totalOrderAmount: number;
  totalLedgerAmount: number;
  isHealthy: boolean;
}

/**
 * Compares confirmed orders against ledger_entries to detect discrepancies.
 * Returns reconciliation health status.
 */
export function useLedgerReconciliation(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  return useQuery({
    queryKey: ['ledger-reconciliation', days],
    queryFn: async (): Promise<ReconciliationResult> => {
      // Get all confirmed/completed orders in period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount')
        .gte('created_at', startDateStr)
        .in('status', ['confirmed', 'completed']);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        return {
          totalOrders: 0,
          matchedOrders: 0,
          missingLedger: 0,
          amountMismatch: 0,
          totalOrderAmount: 0,
          totalLedgerAmount: 0,
          isHealthy: true,
        };
      }

      const orderIds = orders.map(o => o.id);

      // Get ledger entries grouped by order_id
      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from('ledger_entries')
        .select('order_id, amount, entry_type')
        .in('order_id', orderIds);

      if (ledgerError) throw ledgerError;

      // Group ledger totals by order_id (sum platform_fee entries only for comparison)
      const ledgerByOrder = new Map<string, number>();
      (ledgerEntries || []).forEach(entry => {
        if (!entry.order_id) return;
        const current = ledgerByOrder.get(entry.order_id) || 0;
        // Sum all entry amounts for this order (platform_fee + vendor_payment should ≈ total)
        ledgerByOrder.set(entry.order_id, current + Number(entry.amount));
      });

      let matchedOrders = 0;
      let missingLedger = 0;
      let amountMismatch = 0;
      let totalOrderAmount = 0;
      let totalLedgerAmount = 0;

      orders.forEach(order => {
        const orderAmount = Number(order.total_amount) || 0;
        totalOrderAmount += orderAmount;
        const ledgerTotal = ledgerByOrder.get(order.id);

        if (ledgerTotal === undefined) {
          missingLedger++;
        } else {
          totalLedgerAmount += ledgerTotal;
          // Allow 1 THB rounding tolerance
          if (Math.abs(ledgerTotal - orderAmount) > 1) {
            amountMismatch++;
          } else {
            matchedOrders++;
          }
        }
      });

      return {
        totalOrders: orders.length,
        matchedOrders,
        missingLedger,
        amountMismatch,
        totalOrderAmount,
        totalLedgerAmount,
        isHealthy: missingLedger === 0 && amountMismatch === 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
