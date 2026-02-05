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

interface FinancialChartsProps {
  financials: PropertyFinancialFull[];
  dateRange?: { from: Date; to: Date };
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#a855f7',
  '#ec4899',
];

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
        return {
          name: cat ? (isRu ? cat.labelRu : cat.labelEn) : category,
          value: amount,
          category,
        };
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
        return {
          name: cat ? (isRu ? cat.labelRu : cat.labelEn) : category,
          value: amount,
          category,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [financials, isRu]);

  // Format currency for tooltip
  const formatCurrency = (value: number) => `${getCurrencySymbol('THB')}${value.toLocaleString()}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{payload[0]?.payload?.fullMonth || label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} style={{ color: item.color }} className="text-sm">
            {item.name}: {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    );
  };

  if (!financials.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Monthly Trends Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {isRu ? 'Динамика за 6 месяцев' : '6 Month Trend'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name={isRu ? 'Доходы' : 'Income'}
                  stroke="#22c55e"
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name={isRu ? 'Расходы' : 'Expenses'}
                  stroke="#ef4444"
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Income/Expense Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expense Breakdown */}
        {expensesByCategory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                {isRu ? 'Структура расходов' : 'Expense Breakdown'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Income Sources */}
        {incomeByCategory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {isRu ? 'Источники дохода' : 'Income Sources'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeByCategory} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      width={80}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
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
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {isRu ? 'Чистый доход по месяцам' : 'Monthly Net Income'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="net" 
                  name={isRu ? 'Чистый доход' : 'Net Income'}
                  radius={[4, 4, 0, 0]}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.net >= 0 ? '#22c55e' : '#ef4444'} 
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
