import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PayoutRule } from '@/hooks/usePayoutRules';
import { cn } from '@/lib/utils';

interface PayoutWaterfallProps {
  grossIncome?: number;
  expenses?: Record<string, number>;
  payoutRules: PayoutRule[];
  ownerSplitPercent: number;
  managerSplitPercent: number;
  commissionBase: 'gross' | 'net';
  currency?: string;
}

export function PayoutWaterfall({
  grossIncome = 100000,
  expenses = {},
  payoutRules,
  ownerSplitPercent,
  managerSplitPercent,
  commissionBase,
  currency = 'THB',
}: PayoutWaterfallProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const totalExpenses = Object.values(expenses).reduce((s, v) => s + v, 0);
  const netIncome = grossIncome - totalExpenses;

  // Calculate agent commissions
  const activeRules = payoutRules.filter(r => r.is_active);
  const agentDeductions: { name: string; amount: number }[] = [];

  for (const rule of activeRules) {
    let amount = 0;
    const base = rule.commission_type === 'percent_gross' ? grossIncome : netIncome;
    switch (rule.commission_type) {
      case 'percent_net':
        amount = netIncome * (rule.commission_value / 100);
        break;
      case 'percent_gross':
        amount = grossIncome * (rule.commission_value / 100);
        break;
      case 'fixed':
      case 'per_booking':
        amount = rule.commission_value;
        break;
    }
    agentDeductions.push({
      name: rule.recipient_name || (isRu ? 'Получатель' : 'Recipient'),
      amount: Math.round(amount),
    });
  }

  const totalAgentDeductions = agentDeductions.reduce((s, d) => s + d.amount, 0);
  const distributable = netIncome - totalAgentDeductions;
  const commissionBaseAmount = commissionBase === 'gross' ? grossIncome : netIncome;
  const ownerAmount = Math.round(distributable * (ownerSplitPercent / 100));
  const managerAmount = Math.round(distributable * (managerSplitPercent / 100));

  const fmt = (n: number) => n.toLocaleString('en-US');

  const rows: { label: string; amount: number; type: 'income' | 'expense' | 'subtotal' | 'result' }[] = [
    { label: isRu ? 'Валовый доход' : 'Gross Income', amount: grossIncome, type: 'income' },
  ];

  if (totalExpenses > 0) {
    for (const [key, val] of Object.entries(expenses)) {
      if (val > 0) {
        rows.push({ label: key, amount: -val, type: 'expense' });
      }
    }
    rows.push({ label: isRu ? 'Чистый доход' : 'Net Income', amount: netIncome, type: 'subtotal' });
  }

  for (const d of agentDeductions) {
    rows.push({ label: d.name, amount: -d.amount, type: 'expense' });
  }

  if (agentDeductions.length > 0) {
    rows.push({ label: isRu ? 'К распределению' : 'Distributable', amount: distributable, type: 'subtotal' });
  }

  rows.push(
    { label: `${isRu ? 'Собственник' : 'Owner'} (${ownerSplitPercent}%)`, amount: ownerAmount, type: 'result' },
    { label: `${isRu ? 'УК' : 'Manager'} (${managerSplitPercent}%)`, amount: managerAmount, type: 'result' },
  );

  return (
    <div className="space-y-1 font-mono text-sm">
      {rows.map((row, i) => (
        <div
          key={i}
          className={cn(
            'flex justify-between items-center px-3 py-1.5 rounded-none',
            row.type === 'income' && 'bg-primary/10 text-primary font-semibold',
            row.type === 'expense' && 'text-muted-foreground pl-6',
            row.type === 'subtotal' && 'border-t border-border font-semibold mt-1 pt-2',
            row.type === 'result' && 'bg-primary/5 font-bold',
          )}
        >
          <span className="truncate">
            {row.type === 'expense' && '− '}
            {row.type === 'result' && '→ '}
            {row.label}
          </span>
          <span className={cn(
            'tabular-nums flex-shrink-0 ml-4',
            row.amount < 0 && 'text-destructive',
          )}>
            {row.amount < 0 ? '-' : ''}{fmt(Math.abs(row.amount))} {currency}
          </span>
        </div>
      ))}
    </div>
  );
}
