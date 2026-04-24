import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRevenueAnalytics } from '@/hooks/useRevenueAnalytics';
import { useFinancialStats } from '@/hooks/usePropertyFinancials';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, Minus, Receipt, FileText, Target, BarChart3, LineChart,
  ChevronRight, Wallet, PiggyBank, ArrowRightLeft,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

export default function FinanceOverview() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currencyInfo, convertPrice } = useCurrency();
  const isRu = language === 'ru';
  const { monthlyMetrics, kpi, isLoading } = useRevenueAnalytics(6);
  const { data: stats } = useFinancialStats();

  const fmt = (value: number) => {
    const v = convertPrice(value);
    if (v >= 1000000) return `${currencyInfo.symbol}${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${currencyInfo.symbol}${(v / 1000).toFixed(0)}K`;
    return `${currencyInfo.symbol}${Math.round(v)}`;
  };

  // Chart data
  const chartData = monthlyMetrics.map(m => ({
    label: m.label,
    income: Math.round(m.income),
    expenses: Math.round(m.expenses),
    net: Math.round(m.netProfit),
  }));

  const netIncome = stats?.netIncome ?? (kpi?.income ?? 0) - (kpi?.expenses ?? 0);
  const thisMonthIncome = stats?.thisMonthIncome ?? kpi?.income ?? 0;
  const thisMonthExpenses = stats?.thisMonthExpenses ?? kpi?.expenses ?? 0;

  // Quick navigation cards
  const quickLinks = [
    { icon: Receipt, label: isRu ? 'Транзакции' : 'Transactions', path: '/mc/financials', color: 'text-primary' },
    { icon: FileText, label: isRu ? 'Отчёты' : 'Reports', path: '/mc/reports', color: 'text-info' },
    { icon: Target, label: isRu ? 'Бюджет' : 'Budget', path: '/mc/budget', color: 'text-warning' },
    { icon: LineChart, label: isRu ? 'Финансовое планирование' : 'Financial planning', path: APP_ROUTES.MC_FINANCE_PLANNING, color: 'text-success dark:text-success' },
    { icon: Receipt, label: isRu ? 'Инвойсы' : 'Invoices', path: '/mc/invoices', color: 'text-muted-foreground' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Финансы' : 'Finance'}
        subtitle={isRu ? 'Обзор доходов, расходов и аналитики' : 'Income, expenses and analytics overview'}
        showBack
        fallbackPath="/owner"
      />

      {/* Hero Cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-none" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Net Income */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-primary/3" />
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-1 mb-1">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {isRu ? 'Чистый' : 'Net'}
                </span>
              </div>
              <p className={cn(
                "text-lg font-bold leading-tight",
                netIncome >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {fmt(netIncome)}
              </p>
            </CardContent>
          </Card>

          {/* This month income */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/8 to-success/3" />
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {isRu ? 'Доход' : 'Income'}
                </span>
              </div>
              <p className="text-lg font-bold text-success leading-tight">
                {fmt(thisMonthIncome)}
              </p>
              <p className="text-[10px] text-muted-foreground">{isRu ? 'этот месяц' : 'this month'}</p>
            </CardContent>
          </Card>

          {/* This month expenses */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/8 to-destructive/3" />
            <CardContent className="p-3 relative">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {isRu ? 'Расходы' : 'Expenses'}
                </span>
              </div>
              <p className="text-lg font-bold text-destructive leading-tight">
                {fmt(thisMonthExpenses)}
              </p>
              <p className="text-[10px] text-muted-foreground">{isRu ? 'этот месяц' : 'this month'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <Button
          className="flex-1"
          variant="default"
          onClick={() => navigate('/mc/quick-expense')}
        >
          <Minus className="h-4 w-4 mr-2" />
          {isRu ? 'Расход' : 'Expense'}
        </Button>
        <Button
          className="flex-1 border-success text-success hover:bg-success/10"
          variant="outline"
          onClick={() => navigate('/mc/income/quick')}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Доход' : 'Income'}
        </Button>
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {isRu ? 'Доходы и расходы' : 'Income & Expenses'}
              </h3>
              <Badge variant="secondary" className="text-[10px]">
                {isRu ? '6 мес' : '6 mo'}
              </Badge>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} width={50} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      fmt(value),
                      name === 'income' ? (isRu ? 'Доход' : 'Income') :
                      name === 'expenses' ? (isRu ? 'Расход' : 'Expenses') :
                      (isRu ? 'Чистый' : 'Net')
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Row */}
      {kpi && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">
                {isRu ? 'Загрузка' : 'Occupancy'}
              </p>
              <p className="text-xl font-bold">{kpi.occupancy}%</p>
              {kpi.occupancyChange !== 0 && (
                <div className={cn("flex items-center text-xs mt-0.5", kpi.occupancyChange > 0 ? 'text-success' : 'text-destructive')}>
                  {kpi.occupancyChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(kpi.occupancyChange)}%
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">ADR</p>
              <p className="text-xl font-bold">{fmt(kpi.adr)}</p>
              {kpi.revenueChange !== 0 && (
                <div className={cn("flex items-center text-xs mt-0.5", kpi.revenueChange > 0 ? 'text-success' : 'text-destructive')}>
                  {kpi.revenueChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(kpi.revenueChange)}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">
          {isRu ? 'Разделы' : 'Sections'}
        </h3>
        <div className="divide-y rounded-none border overflow-hidden">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors "
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", link.color)} />
                <span className="flex-1 text-sm font-medium text-left">{link.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </button>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
