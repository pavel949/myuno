/**
 * Commission tracking for agent deals.
 * Reads commission_amount from agent_deals, calculates expected commission.
 */
import { useMemo } from 'react';

export interface CommissionInfo {
  dealValue: number;
  commissionRate: number; // 0-100
  expectedAmount: number;
  recordedAmount: number | null;
  currency: string;
  isPaid: boolean;
}

// Default commission rates by deal type (%)
const DEFAULT_RATES: Record<string, number> = {
  sale: 2.5,
  rent: 5,
  investment: 2.5,
  management: 8,
};

export function useCommissionCalc(deal: {
  budget_max?: number | null;
  budget_min?: number | null;
  commission_amount?: number | null;
  commission_rate?: number | null;
  deal_type?: string;
  currency?: string | null;
  stage?: string;
} | null): CommissionInfo | null {
  return useMemo(() => {
    if (!deal) return null;

    const dealValue = deal.budget_max || deal.budget_min || 0;
    const rate = deal.commission_rate ?? DEFAULT_RATES[deal.deal_type || 'sale'] ?? 2.5;
    const expected = dealValue * (rate / 100);

    return {
      dealValue,
      commissionRate: rate,
      expectedAmount: Math.round(expected * 100) / 100,
      recordedAmount: deal.commission_amount ?? null,
      currency: deal.currency || 'THB',
      isPaid: deal.stage === 'closed_won' && !!deal.commission_amount,
    };
  }, [deal]);
}
