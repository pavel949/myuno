import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { VendorPeriodSelector, Period } from './dashboard/VendorPeriodSelector';
import { cn } from '@/lib/utils';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface VendorRevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  previousPeriodRevenue?: number;
}

export function VendorRevenueChart({ 
  data, 
  loading, 
  period = '7d',
  onPeriodChange,
  previousPeriodRevenue 
}: VendorRevenueChartProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `฿${(value / 1000).toFixed(0)}K`;
    return `฿${value}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { 
      day: 'numeric',
      month: 'short' 
    });
  };

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  // Calculate comparison percentage
  let changePercent: number | null = null;
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  
  if (previousPeriodRevenue !== undefined && previousPeriodRevenue > 0) {
    changePercent = ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;
    trend = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral';
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            {isRu ? 'Доход' : 'Revenue'}
          </CardTitle>
          {onPeriodChange && (
            <VendorPeriodSelector 
              value={period} 
              onChange={onPeriodChange}
              compact
            />
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
            {changePercent !== null && (
              <div className={cn("flex items-center gap-0.5 text-sm font-medium", trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {totalOrders} {isRu ? 'заказов' : 'orders'}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
            {isRu ? 'Нет данных за период' : 'No data for period'}
          </div>
        ) : (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="vendorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? (isRu ? 'Доход' : 'Revenue') : (isRu ? 'Заказы' : 'Orders')
                  ]}
                  labelFormatter={formatDate}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#vendorRevenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">
              {isRu ? 'Доход' : 'Revenue'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
