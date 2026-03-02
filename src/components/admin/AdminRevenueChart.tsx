import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { CHART_THEME } from '@/lib/chartTheme';

interface AdminRevenueChartProps {
  data: { date: string; revenue: number; gmv: number }[];
  loading?: boolean;
}

export function AdminRevenueChart({ data, loading }: AdminRevenueChartProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium tracking-[-0.01em]">
            {isRussian ? 'Доход за период' : 'Revenue Trend'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRussian ? 'ru-RU' : 'en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium tracking-[-0.01em]">
          {isRussian ? 'Доход за период' : 'Revenue Trend'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent-cyan))" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="hsl(var(--accent-cyan))" stopOpacity={0} />
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
                width={50}
              />
              <Tooltip 
                contentStyle={CHART_THEME.tooltip}
                labelStyle={CHART_THEME.tooltipLabel}
                itemStyle={CHART_THEME.tooltipItem}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'revenue' ? (isRussian ? 'Доход' : 'Revenue') : 'GMV'
                ]}
                labelFormatter={formatDate}
              />
              <Area
                type="monotone"
                dataKey="gmv"
                stroke={CHART_THEME.colors.cyan}
                strokeWidth={CHART_THEME.area.strokeWidth}
                fill="url(#gmvGradient)"
                animationDuration={CHART_THEME.area.animationDuration}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART_THEME.colors.primary}
                strokeWidth={CHART_THEME.area.strokeWidth}
                fill="url(#revenueGradient)"
                animationDuration={CHART_THEME.area.animationDuration}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className={CHART_THEME.legend.containerClass}>
          <div className="flex items-center gap-2">
            <div className={`${CHART_THEME.legend.dotSize} bg-primary`} />
            <span className={CHART_THEME.legend.textClass}>
              {isRussian ? 'Доход платформы' : 'Platform Revenue'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`${CHART_THEME.legend.dotSize} bg-accent-cyan`} />
            <span className={CHART_THEME.legend.textClass}>GMV</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
