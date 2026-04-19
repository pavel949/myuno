import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  applyScenario, computePnL, type Drivers, type CapExItem, type LoanItem, type Assumptions, type ExpenseRow,
} from '@/lib/finance/financialModelMath';

interface Props {
  drivers: Drivers;
  budgetExpenses: ExpenseRow[];
  capex: CapExItem[];
  loans: LoanItem[];
  assumptions: Assumptions;
}

const SCENARIOS: Array<{ id: 'pessimistic' | 'base' | 'optimistic'; labelRu: string; labelEn: string; tone: string }> = [
  { id: 'pessimistic', labelRu: 'Пессимистичный', labelEn: 'Pessimistic', tone: 'text-destructive' },
  { id: 'base', labelRu: 'Базовый', labelEn: 'Base', tone: 'text-primary' },
  { id: 'optimistic', labelRu: 'Оптимистичный', labelEn: 'Optimistic', tone: 'text-success' },
];

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${Math.round(v).toLocaleString()}`;
}

export function ScenariosPanel({ drivers, budgetExpenses, capex, loans, assumptions }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const results = useMemo(() => SCENARIOS.map(s => {
    const mult = applyScenario(s.id);
    const c = computePnL({
      drivers,
      budgetExpenses,
      capex,
      loans,
      assumptions: { ...assumptions, scenarioMultipliers: { revenue: mult.revenue, cost: mult.cost } },
    });
    return { ...s, computed: c, mult };
  }), [drivers, budgetExpenses, capex, loans, assumptions]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {isRu
          ? 'Side-by-side сравнение трёх сценариев. Базовые значения — из разделов Драйверы и Бюджет.'
          : 'Side-by-side comparison of three scenarios based on your Drivers + Budget.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {results.map(r => {
          const t = r.computed.totals;
          const k = r.computed.kpis;
          return (
            <Card key={r.id} className={cn('relative overflow-hidden')}>
              <div className={cn('absolute top-0 left-0 right-0 h-1', r.id === 'optimistic' ? 'bg-success' : r.id === 'pessimistic' ? 'bg-destructive' : 'bg-primary')} />
              <CardHeader className="pb-2">
                <CardTitle className={cn('text-sm font-semibold flex items-center justify-between', r.tone)}>
                  {isRu ? r.labelRu : r.labelEn}
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Rev×{r.mult.revenue.toFixed(2)} / Cost×{r.mult.cost.toFixed(2)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <Row label={isRu ? 'Доход (год)' : 'Revenue'} value={fmt(t.grossRevenue)} />
                <Row label={isRu ? 'Расходы (год)' : 'OpEx'} value={fmt(t.totalOpEx)} negative />
                <Row label="NOI" value={fmt(t.noi)} bold tone={t.noi >= 0 ? 'pos' : 'neg'} />
                <Row label={isRu ? 'Чистая прибыль' : 'Net Income'} value={fmt(t.netIncome)} bold tone={t.netIncome >= 0 ? 'pos' : 'neg'} />
                <hr className="my-2" />
                <Row label="Cap Rate" value={k.capRate != null ? `${(k.capRate * 100).toFixed(1)}%` : '—'} />
                <Row label="Cash-on-Cash" value={k.cashOnCash != null ? `${(k.cashOnCash * 100).toFixed(1)}%` : '—'} />
                <Row label="DSCR" value={k.dscr != null ? `${k.dscr.toFixed(2)}x` : '—'} />
                <Row label={isRu ? 'Безуб. загрузка' : 'Break-even occ.'} value={k.breakEvenOccupancy != null ? `${(k.breakEvenOccupancy * 100).toFixed(0)}%` : '—'} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, bold, tone, negative }: { label: string; value: string; bold?: boolean; tone?: 'pos' | 'neg'; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn(
        'tabular-nums',
        bold && 'font-semibold',
        tone === 'pos' && 'text-success',
        tone === 'neg' && 'text-destructive',
        negative && !tone && 'text-destructive',
      )}>{value}</span>
    </div>
  );
}
