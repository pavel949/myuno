import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { ArrowUpRight, ArrowDownLeft, Gift, TrendingUp } from 'lucide-react';

interface Transaction {
  type: 'topup' | 'payment' | 'refund' | 'bonus' | 'cashback';
  amount: number;
  status: string;
  created_at: string;
}

interface SpendingInsightsProps {
  transactions: Transaction[];
}

const CATEGORY_CONFIG = {
  payment: { icon: ArrowUpRight, labelEn: 'Payments', labelRu: 'Оплата', color: 'bg-destructive/15 text-destructive' },
  topup: { icon: ArrowDownLeft, labelEn: 'Top-ups', labelRu: 'Пополнения', color: 'bg-success/15 text-success' },
  cashback: { icon: TrendingUp, labelEn: 'Cashback', labelRu: 'Кэшбэк', color: 'bg-success/15 text-success' },
  bonus: { icon: Gift, labelEn: 'Bonuses', labelRu: 'Бонусы', color: 'bg-accent-purple/15 text-accent-purple' },
} as const;

export function SpendingInsights({ transactions }: SpendingInsightsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const insights = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = transactions.filter(
      t => t.status === 'completed' && new Date(t.created_at) >= monthStart
    );

    if (thisMonth.length === 0) return null;

    const byType: Record<string, number> = {};
    thisMonth.forEach(t => {
      byType[t.type] = (byType[t.type] || 0) + Math.abs(t.amount);
    });

    const maxAmount = Math.max(...Object.values(byType), 1);

    return { byType, maxAmount, count: thisMonth.length };
  }, [transactions]);

  if (!insights) return null;

  const monthName = new Date().toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { month: 'long' });

  return (
    <SectionCard>
      <SectionTitle>
        {isRu ? `Расходы за ${monthName}` : `${monthName} spending`}
      </SectionTitle>
      <div className="space-y-2.5">
        {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>)
          .filter(type => insights.byType[type])
          .map(type => {
            const config = CATEGORY_CONFIG[type];
            const amount = insights.byType[type];
            const pct = (amount / insights.maxAmount) * 100;
            const Icon = config.icon;

            return (
              <div key={type} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {isRu ? config.labelRu : config.labelEn}
                    </span>
                    <span className="text-sm font-semibold">
                      {amount.toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        type === 'payment' ? 'bg-destructive/60' : 'bg-success/60'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">
        {isRu ? `${insights.count} операций в этом месяце` : `${insights.count} transactions this month`}
      </p>
    </SectionCard>
  );
}
