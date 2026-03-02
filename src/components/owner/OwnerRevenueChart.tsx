import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_THEME } from '@/lib/chartTheme';

interface RevenueDataPoint {
  date: string;
  income: number;
  expenses: number;
}

interface OwnerRevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
}

export function OwnerRevenueChart({ data, loading }: OwnerRevenueChartProps) {
  const { language } = useLanguage();
  const { currencyInfo, convertPrice } = useCurrency();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    const converted = convertPrice(value);
    if (converted >= 1000000) return `${currencyInfo.symbol}${(converted / 1000000).toFixed(1)}M`;
    if (converted >= 1000) return `${currencyInfo.symbol}${(converted / 1000).toFixed(0)}K`;
    return `${currencyInfo.symbol}${converted}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { 
      day: 'numeric',
      month: 'short' 
    });
  };

  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 tracking-[-0.01em]">
            <TrendingUp className="h-4 w-4 text-success" />
            {isRu ? 'Финансы за месяц' : 'Monthly Finances'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/owner/portfolio')}
              className="h-7 px-2 text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              {isRu ? 'Портфель' : 'Portfolio'}
            </Button>
            <div className="text-right">
              <p className="text-lg font-bold text-success tracking-[-0.02em]">{formatCurrency(netProfit)}</p>
              <p className="text-[11px] text-muted-foreground">{isRu ? 'Чистая прибыль' : 'Net Profit'}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            {isRu ? 'Нет данных за период' : 'No data for period'}
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ownerIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ownerExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_THEME.grid} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={CHART_THEME.axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={CHART_THEME.axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={CHART_THEME.tooltip}
                  labelStyle={CHART_THEME.tooltipLabel}
                  itemStyle={CHART_THEME.tooltipItem}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'income' ? (isRu ? 'Доход' : 'Income') : (isRu ? 'Расходы' : 'Expenses')
                  ]}
                  labelFormatter={formatDate}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke={CHART_THEME.colors.success}
                  strokeWidth={CHART_THEME.area.strokeWidth}
                  fill="url(#ownerIncomeGradient)"
                  animationDuration={CHART_THEME.area.animationDuration}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke={CHART_THEME.colors.destructive}
                  strokeWidth={CHART_THEME.area.strokeWidth}
                  fill="url(#ownerExpenseGradient)"
                  animationDuration={CHART_THEME.area.animationDuration}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className={CHART_THEME.legend.containerClass}>
          <div className="flex items-center gap-2">
            <div className={`${CHART_THEME.legend.dotSize} bg-success`} />
            <span className={CHART_THEME.legend.textClass}>
              {isRu ? 'Доход' : 'Income'} ({formatCurrency(totalIncome)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`${CHART_THEME.legend.dotSize} bg-destructive`} />
            <span className={CHART_THEME.legend.textClass}>
              {isRu ? 'Расходы' : 'Expenses'} ({formatCurrency(totalExpenses)})
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
