import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

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
          <CardTitle className="text-base font-medium">
            {isRussian ? 'Доход за период' : 'Revenue Trend'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
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
        <CardTitle className="text-base font-medium">
          {isRussian ? 'Доход за период' : 'Revenue Trend'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43 74% 49%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43 74% 49%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'revenue' ? (isRussian ? 'Доход' : 'Revenue') : 'GMV'
                ]}
                labelFormatter={formatDate}
              />
              <Area
                type="monotone"
                dataKey="gmv"
                stroke="hsl(199 89% 48%)"
                strokeWidth={2}
                fill="url(#gmvGradient)"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(43 74% 49%)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(43_74%_49%)]" />
            <span className="text-xs text-muted-foreground">
              {isRussian ? 'Доход платформы' : 'Platform Revenue'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(199_89%_48%)]" />
            <span className="text-xs text-muted-foreground">GMV</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
