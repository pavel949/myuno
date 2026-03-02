import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { PropertyFinancialFull, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/hooks/usePropertyFinancials';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/config/currencies';
import { CHART_THEME } from '@/lib/chartTheme';

interface FinancialChartsProps {
  financials: PropertyFinancialFull[];
  dateRange?: { from: Date; to: Date };
}

export function FinancialCharts({ financials, dateRange }: FinancialChartsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Calculate monthly trends
  const monthlyData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthFinancials = financials.filter(f => {
        const date = parseISO(f.transaction_date);
        return date >= monthStart && date <= monthEnd;
      });

      const income = monthFinancials
        .filter(f => f.transaction_type === 'income')
        .reduce((sum, f) => sum + Number(f.amount), 0);

      const expenses = monthFinancials
        .filter(f => f.transaction_type === 'expense')
        .reduce((sum, f) => sum + Number(f.amount), 0);

      return {
        month: format(month, 'MMM', { locale: isRu ? ru : undefined }),
        fullMonth: format(month, 'MMMM yyyy', { locale: isRu ? ru : undefined }),
        income,
        expenses,
        net: income - expenses,
      };
    });
  }, [financials, isRu]);

  // Calculate expense breakdown by category
  const expensesByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    financials
      .filter(f => f.transaction_type === 'expense')
      .forEach(f => {
        const category = f.category || 'other_expense';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(f.amount);
      });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
        return { name: cat ? (isRu ? cat.labelRu : cat.labelEn) : category, value: amount, category };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [financials, isRu]);

  // Calculate income breakdown by category
  const incomeByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    financials
      .filter(f => f.transaction_type === 'income')
      .forEach(f => {
        const category = f.category || 'other_income';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(f.amount);
      });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => {
        const cat = INCOME_CATEGORIES.find(c => c.value === category);
        return { name: cat ? (isRu ? cat.labelRu : cat.labelEn) : category, value: amount, category };
      })
      .sort((a, b) => b.value - a.value);
  }, [financials, isRu]);

  const formatCurrency = (value: number) => `${getCurrencySymbol('THB')}${value.toLocaleString()}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div style={CHART_THEME.tooltip}>
        <p style={CHART_THEME.tooltipLabel}>{payload[0]?.payload?.fullMonth || label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} style={{ ...CHART_THEME.tooltipItem, color: item.color }} className="text-sm">
            {item.name}: {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    );
  };

  if (!financials.length) return null;

  return (
    <div className="space-y-4">
      {/* Monthly Trends Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 tracking-[-0.01em]">
            <TrendingUp className="h-4 w-4" />
            {isRu ? 'Динамика за 6 месяцев' : '6 Month Trend'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                <defs>
                  <linearGradient id="finIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_THEME.colors.success} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_THEME.colors.success} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="finExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_THEME.colors.destructive} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={CHART_THEME.colors.destructive} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_THEME.grid} vertical={false} />
                <XAxis dataKey="month" tick={CHART_THEME.axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_THEME.axisTick} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name={isRu ? 'Доходы' : 'Income'}
                  stroke={CHART_THEME.colors.success}
                  fill="url(#finIncomeGrad)"
                  strokeWidth={CHART_THEME.area.strokeWidth}
                  animationDuration={CHART_THEME.area.animationDuration}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name={isRu ? 'Расходы' : 'Expenses'}
                  stroke={CHART_THEME.colors.destructive}
                  fill="url(#finExpenseGrad)"
                  strokeWidth={CHART_THEME.area.strokeWidth}
                  animationDuration={CHART_THEME.area.animationDuration}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Income/Expense Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {expensesByCategory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 tracking-[-0.01em]">
                <PieChartIcon className="h-4 w-4" />
                {isRu ? 'Структура расходов' : 'Expense Breakdown'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={CHART_THEME.pie.paddingAngle}
                      cornerRadius={CHART_THEME.pie.cornerRadius}
                      dataKey="value"
                      animationDuration={CHART_THEME.pie.animationDuration}
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_THEME.palette[index % CHART_THEME.palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={CHART_THEME.tooltip}
                      formatter={(value: number) => formatCurrency(value)} 
                    />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      formatter={(value) => <span className={CHART_THEME.legend.textClass}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {incomeByCategory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 tracking-[-0.01em]">
                <BarChart3 className="h-4 w-4" />
                {isRu ? 'Источники дохода' : 'Income Sources'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeByCategory} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid {...CHART_THEME.grid} horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={CHART_THEME.axisTick} axisLine={false} tickLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ ...CHART_THEME.axisTick, fontSize: 10 }}
                      width={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={CHART_THEME.tooltip} formatter={(value: number) => formatCurrency(value)} />
                    <Bar 
                      dataKey="value" 
                      fill={CHART_THEME.colors.success} 
                      radius={CHART_THEME.bar.radiusHorizontal}
                      animationDuration={CHART_THEME.bar.animationDuration}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Net Profit Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 tracking-[-0.01em]">
            <TrendingUp className="h-4 w-4" />
            {isRu ? 'Чистый доход по месяцам' : 'Monthly Net Income'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid {...CHART_THEME.grid} vertical={false} />
                <XAxis dataKey="month" tick={CHART_THEME.axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_THEME.axisTick} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="net" 
                  name={isRu ? 'Чистый доход' : 'Net Income'}
                  radius={CHART_THEME.bar.radius}
                  animationDuration={CHART_THEME.bar.animationDuration}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.net >= 0 ? CHART_THEME.colors.success : CHART_THEME.colors.destructive} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
