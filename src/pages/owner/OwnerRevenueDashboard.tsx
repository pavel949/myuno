import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRevenueAnalytics } from '@/hooks/useRevenueAnalytics';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, TrendingDown, BedDouble, DollarSign,
  BarChart3, Calendar, Target, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line,
} from 'recharts';

function MetricSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-7 w-28" />
      </CardContent>
    </Card>
  );
}

export default function OwnerRevenueDashboard() {
  const { language } = useLanguage();
  const { currencyInfo, convertPrice } = useCurrency();
  const isRu = language === 'ru';
  const { monthlyMetrics, propertyRevenue, forecast, kpi, isLoading } = useRevenueAnalytics(6);

  const fmt = (value: number) => {
    const v = convertPrice(value);
    if (v >= 1000000) return `${currencyInfo.symbol}${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${currencyInfo.symbol}${(v / 1000).toFixed(0)}K`;
    return `${currencyInfo.symbol}${Math.round(v)}`;
  };

  const fmtShort = (value: number) => {
    const v = convertPrice(value);
    return `${currencyInfo.symbol}${Math.round(v).toLocaleString()}`;
  };

  // Chart data: historical + forecast
  const chartData = [
    ...monthlyMetrics.map(m => ({
      label: m.label,
      income: m.income,
      expenses: m.expenses,
      occupancy: Math.round(m.occupancy),
      adr: Math.round(m.adr),
      revpar: Math.round(m.revpar),
      type: 'actual' as const,
    })),
    ...forecast.map(f => ({
      label: `${f.label}*`,
      income: f.projected,
      expenses: 0,
      occupancy: 0,
      adr: 0,
      revpar: 0,
      projected: f.projected,
      lower: f.lower,
      upper: f.upper,
      type: 'forecast' as const,
    })),
  ];

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner" />
      <PageHeader
        title={isRu ? 'Revenue Dashboard' : 'Revenue Dashboard'}
        subtitle={isRu ? 'ADR · RevPAR · Загрузка · Прогноз' : 'ADR · RevPAR · Occupancy · Forecast'}
      />

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => <MetricSkeleton key={i} />)}
        </div>
      ) : kpi ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Revenue */}
          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-success" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  {isRu ? 'Доход' : 'Revenue'}
                </span>
                {kpi.revenueChange !== 0 && (
                  <Badge variant="outline" className={cn(
                    'h-4 text-[9px] px-1 ml-auto',
                    kpi.revenueChange > 0 ? 'text-success border-success/30' : 'text-destructive border-destructive/30'
                  )}>
                    {kpi.revenueChange > 0 ? '+' : ''}{kpi.revenueChange.toFixed(0)}%
                  </Badge>
                )}
              </div>
              <p className="text-xl font-bold text-success">{fmt(kpi.income)}</p>
            </CardContent>
          </Card>

          {/* Occupancy */}
          <Card className="bg-gradient-to-br from-info/10 to-info/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <BedDouble className="h-3.5 w-3.5 text-info" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  {isRu ? 'Загрузка' : 'Occupancy'}
                </span>
                {kpi.occupancyChange !== 0 && (
                  <Badge variant="outline" className={cn(
                    'h-4 text-[9px] px-1 ml-auto',
                    kpi.occupancyChange > 0 ? 'text-success border-success/30' : 'text-destructive border-destructive/30'
                  )}>
                    {kpi.occupancyChange > 0 ? '+' : ''}{kpi.occupancyChange.toFixed(0)}pp
                  </Badge>
                )}
              </div>
              <p className="text-xl font-bold text-info">{kpi.occupancy.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {kpi.bookedNights}/{kpi.totalNights} {isRu ? 'ночей' : 'nights'}
              </p>
            </CardContent>
          </Card>

          {/* ADR */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">ADR</span>
              </div>
              <p className="text-xl font-bold">{fmtShort(kpi.adr)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isRu ? 'Средняя за ночь' : 'Avg. daily rate'}
              </p>
            </CardContent>
          </Card>

          {/* RevPAR */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">RevPAR</span>
              </div>
              <p className="text-xl font-bold">{fmtShort(kpi.revpar)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isRu ? 'Доход на номер' : 'Rev. per available'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm mb-6">
          {isRu ? 'Нет данных за период' : 'No data for period'}
        </div>
      )}

      {/* Revenue + Forecast Chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            {isRu ? 'Доход и прогноз' : 'Revenue & Forecast'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        income: isRu ? 'Доход' : 'Income',
                        expenses: isRu ? 'Расходы' : 'Expenses',
                        projected: isRu ? 'Прогноз' : 'Forecast',
                      };
                      return [fmt(value), labels[name] || name];
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="projected" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fcGrad)" strokeDasharray="6 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-success inline-block rounded-none" />
              {isRu ? 'Доход' : 'Income'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-destructive inline-block rounded-none" style={{ borderTop: '1px dashed' }} />
              {isRu ? 'Расходы' : 'Expenses'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-primary inline-block rounded-none" style={{ borderTop: '1px dashed' }} />
              {isRu ? 'Прогноз' : 'Forecast'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Occupancy & ADR Trend */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isRu ? 'Загрузка и ADR по месяцам' : 'Occupancy & ADR Trend'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyMetrics.map(m => ({
                  label: m.label,
                  occupancy: Math.round(m.occupancy),
                  adr: Math.round(convertPrice(m.adr)),
                }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="occ" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <YAxis yAxisId="adr" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'occupancy') return [`${value}%`, isRu ? 'Загрузка' : 'Occupancy'];
                      return [`${currencyInfo.symbol}${value}`, 'ADR'];
                    }}
                  />
                  <Bar yAxisId="occ" dataKey="occupancy" fill="hsl(var(--info))" opacity={0.3} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="adr" type="monotone" dataKey="adr" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-none bg-info/30 inline-block" />
              {isRu ? 'Загрузка %' : 'Occupancy %'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-primary inline-block rounded-none" />
              ADR
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Per-property Revenue Table */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {isRu ? 'Доходность по объектам (30д)' : 'Revenue by Property (30d)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : propertyRevenue.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              {isRu ? 'Нет данных' : 'No data'}
            </p>
          ) : (
            <div className="space-y-3">
              {propertyRevenue.map(p => (
                <div key={p.id} className="p-3 rounded-none border bg-card">
                  <div className="flex items-center gap-3 mb-2">
                    {p.coverImage ? (
                      <img src={p.coverImage} alt="" className="w-10 h-10 rounded-none object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center">
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.bookingCount} {isRu ? 'бронирований' : 'bookings'}
                      </p>
                    </div>
                    <Badge variant={p.income - p.expenses >= 0 ? 'default' : 'destructive'} className="text-xs">
                      {p.income - p.expenses >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                      {fmt(p.income - p.expenses)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    <div className="text-center">
                      <p className="text-muted-foreground">{isRu ? 'Доход' : 'Rev.'}</p>
                      <p className="font-semibold text-success">{fmt(p.income)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">{isRu ? 'Загр.' : 'Occ.'}</p>
                      <p className="font-semibold">{p.occupancy.toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">ADR</p>
                      <p className="font-semibold">{fmt(p.adr)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">RevPAR</p>
                      <p className="font-semibold">{fmt(p.revpar)}</p>
                    </div>
                  </div>

                  <Progress value={p.occupancy} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Table */}
      {forecast.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isRu ? 'Прогноз на 3 мес.' : '3-Month Forecast'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {forecast.map(f => (
                <div key={f.month} className="flex items-center justify-between p-3 rounded-none bg-muted/50">
                  <span className="font-medium text-sm">{f.label}</span>
                  <div className="text-right">
                    <p className="font-bold text-sm">{fmt(f.projected)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {fmt(f.lower)} – {fmt(f.upper)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              {isRu
                ? '* Прогноз на основе скользящего среднего за 3 мес.'
                : '* Forecast based on 3-month moving average'}
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
