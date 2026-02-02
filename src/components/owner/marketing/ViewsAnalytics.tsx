/**
 * @component ViewsAnalytics
 * @description Property views and performance analytics chart
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Eye, MousePointer, MessageSquare, Calendar,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import type { PropertyAnalytics, AnalyticsSummary } from '@/hooks/usePropertyMarketing';
import { format, parseISO } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface ViewsAnalyticsProps {
  analytics: PropertyAnalytics[];
  summary: AnalyticsSummary;
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d';

export function ViewsAnalytics({ analytics, summary, className }: ViewsAnalyticsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  // Filter data by time range
  const filteredData = analytics.slice(
    timeRange === '7d' ? -7 : 
    timeRange === '30d' ? -30 : 
    -90
  );
  
  // Aggregate data by date for chart
  const chartData = filteredData.reduce((acc, item) => {
    const existingDate = acc.find(d => d.date === item.date);
    if (existingDate) {
      existingDate.views += item.views || 0;
      existingDate.clicks += item.clicks || 0;
      existingDate.inquiries += item.inquiries || 0;
    } else {
      acc.push({
        date: item.date,
        views: item.views || 0,
        clicks: item.clicks || 0,
        inquiries: item.inquiries || 0,
      });
    }
    return acc;
  }, [] as { date: string; views: number; clicks: number; inquiries: number }[]);
  
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };
  
  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  };
  
  const stats = [
    {
      label: isRu ? 'Просмотры' : 'Views',
      value: summary.totalViews,
      change: summary.viewsChange,
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: isRu ? 'Показы в поиске' : 'Impressions',
      value: summary.totalImpressions,
      change: 0,
      icon: MousePointer,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      label: isRu ? 'Запросы' : 'Inquiries',
      value: summary.totalInquiries,
      change: 0,
      icon: MessageSquare,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: isRu ? 'Бронирования' : 'Bookings',
      value: summary.totalBookings,
      change: summary.bookingsChange,
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
  ];
  
  const locale = isRu ? ru : enUS;
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isRu ? 'Аналитика' : 'Analytics'}
          </CardTitle>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? (isRu ? '7 дней' : '7 days') :
                 range === '30d' ? (isRu ? '30 дней' : '30 days') :
                 (isRu ? '90 дней' : '90 days')}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className={cn("p-3 rounded-xl", stat.bgColor)}
            >
              <div className="flex items-center justify-between mb-1">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
                {stat.change !== 0 && (
                  <div className="flex items-center gap-0.5 text-xs">
                    {getTrendIcon(stat.change)}
                    <span className={cn(
                      stat.change > 0 ? "text-green-600" : 
                      stat.change < 0 ? "text-red-500" : 
                      "text-muted-foreground"
                    )}>
                      {formatChange(stat.change)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* Conversion Rate */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
          <div>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Конверсия просмотры → бронь' : 'View to Booking Rate'}
            </p>
            <p className="text-2xl font-bold">{summary.conversionRate}%</p>
          </div>
          <Badge variant={summary.conversionRate >= 3 ? 'default' : 'secondary'}>
            {summary.conversionRate >= 5 ? (isRu ? 'Отлично' : 'Excellent') :
             summary.conversionRate >= 3 ? (isRu ? 'Хорошо' : 'Good') :
             (isRu ? 'Можно лучше' : 'Room for improvement')}
          </Badge>
        </div>
        
        {/* Views Chart */}
        {chartData.length > 0 && (
          <div className="h-[160px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(parseISO(value), 'd MMM', { locale })}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs">
                        <p className="font-medium mb-1">
                          {format(parseISO(label), 'd MMMM yyyy', { locale })}
                        </p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-muted-foreground">
                            {entry.name === 'views' ? (isRu ? 'Просмотры' : 'Views') : entry.name}: {entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {chartData.length === 0 && (
          <div className="h-[160px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isRu ? 'Нет данных за этот период' : 'No data for this period'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
