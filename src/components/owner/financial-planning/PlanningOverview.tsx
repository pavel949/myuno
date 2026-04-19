import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Percent, Calculator, Activity } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { ComputedPnL } from '@/lib/finance/financialModelMath';

interface Props {
  computed: ComputedPnL;
  actuals?: { incomeByMonth: number[]; expenseByMonth: number[] } | null;
}

function fmt(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${Math.round(value).toLocaleString()}`;
}

export function PlanningOverview({ computed, actuals }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = computed.totals;
  const k = computed.kpis;

  const kpis = [
    { label: isRu ? 'План: Доход' : 'Plan: Revenue', value: fmt(t.grossRevenue), icon: TrendingUp, tone: 'text-success' },
    { label: isRu ? 'План: Расходы' : 'Plan: Expenses', value: fmt(t.totalOpEx), icon: TrendingDown, tone: 'text-destructive' },
    { label: 'NOI', value: fmt(t.noi), icon: Target, tone: 'text-primary' },
    { label: isRu ? 'Cap Rate' : 'Cap Rate', value: k.capRate != null ? `${(k.capRate * 100).toFixed(1)}%` : '—', icon: Percent, tone: 'text-info' },
    { label: isRu ? 'Загрузка' : 'Occupancy', value: `${(t.avgOccupancy * 100).toFixed(0)}%`, icon: Activity, tone: 'text-warning' },
    { label: 'DSCR', value: k.dscr != null ? `${k.dscr.toFixed(2)}x` : '—', icon: Calculator, tone: 'text-muted-foreground' },
  ];

  const chartData = computed.months.map((m, i) => ({
    month: m,
    planRev: Math.round(computed.grossRevenuePerMonth[i]),
    planNoi: Math.round(computed.noiPerMonth[i]),
    actualRev: actuals ? Math.round(actuals.incomeByMonth[i] || 0) : null,
    actualNet: actuals ? Math.round((actuals.incomeByMonth[i] || 0) - (actuals.expenseByMonth[i] || 0)) : null,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={cn('h-3.5 w-3.5', k.tone)} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</span>
                </div>
                <p className={cn('text-lg font-bold leading-tight', k.tone)}>{k.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">
            {isRu ? 'План vs Факт по месяцам' : 'Plan vs Actual by month'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmt} width={50} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="planRev" stroke="hsl(var(--success))" name={isRu ? 'План: доход' : 'Plan: revenue'} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="planNoi" stroke="hsl(var(--primary))" name="Plan: NOI" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                {actuals && <Line type="monotone" dataKey="actualRev" stroke="hsl(var(--info))" name={isRu ? 'Факт: доход' : 'Actual: revenue'} strokeWidth={2} dot={false} />}
                {actuals && <Line type="monotone" dataKey="actualNet" stroke="hsl(var(--warning))" name={isRu ? 'Факт: net' : 'Actual: net'} strokeWidth={2} dot={false} strokeDasharray="2 2" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
