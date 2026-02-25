import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Target, Calendar, Download, Loader2
} from 'lucide-react';
import { useMCCAnalytics, AnalyticsPeriod } from '@/hooks/useMCCAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function MCCAnalyticsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  const {
    channelSummary,
    topPages,
    segmentsDistribution,
    eventsByType,
    summary,
    isLoading,
    hasRealData,
  } = useMCCAnalytics(period);

  const lifecycleData = segmentsDistribution
    ? Object.entries(segmentsDistribution.lifecycle).map(([name, value]) => ({ name, value }))
    : [];

  const eventData = Object.entries(eventsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Аналитика и атрибуция' : 'Analytics & Attribution'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Реальные данные платформы' : 'Live platform data'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{isRu ? '7 дней' : '7 days'}</SelectItem>
              <SelectItem value="30d">{isRu ? '30 дней' : '30 days'}</SelectItem>
              <SelectItem value="90d">{isRu ? '90 дней' : '90 days'}</SelectItem>
              <SelectItem value="ytd">{isRu ? 'С начала года' : 'Year to date'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {isRu ? 'Экспорт' : 'Export'}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !hasRealData && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{isRu ? 'Данные пока собираются. Трекинг активирован — метрики появятся в течение часа.' : 'Data is being collected. Tracking is active — metrics will appear within an hour.'}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">{isRu ? 'Выручка' : 'Revenue'}</p>
                <p className="text-2xl font-bold">
                  {summary.revenue >= 1000 ? `$${(summary.revenue / 1000).toFixed(1)}k` : `$${Math.round(summary.revenue)}`}
                </p>
                <div className={`flex items-center gap-1 text-xs ${summary.revenueChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summary.revenueChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {summary.revenueChange !== 0 ? `${summary.revenueChange > 0 ? '+' : ''}${summary.revenueChange.toFixed(1)}%` : '—'}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">{isRu ? 'Расход' : 'Spend'}</p>
                <p className="text-2xl font-bold">
                  {summary.spend >= 1000 ? `$${(summary.spend / 1000).toFixed(1)}k` : `$${Math.round(summary.spend)}`}
                </p>
                <div className="text-xs text-muted-foreground">{isRu ? 'каналы' : 'channels'}</div>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">ROAS</p>
                <p className="text-2xl font-bold">{summary.roas > 0 ? `${summary.roas.toFixed(1)}x` : '—'}</p>
                <div className="text-xs text-muted-foreground">{isRu ? 'возврат на расход' : 'return on spend'}</div>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">{isRu ? 'Сегменты' : 'Segments'}</p>
                <p className="text-2xl font-bold">{segmentsDistribution?.total || '—'}</p>
                <div className="text-xs text-muted-foreground">
                  {segmentsDistribution ? `${segmentsDistribution.vipCount} VIP` : isRu ? 'пользователей' : 'users'}
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lifecycle Distribution */}
        {lifecycleData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRu ? 'Стадии жизненного цикла' : 'Lifecycle Stages'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={lifecycleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {lifecycleData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Events by type */}
        {eventData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRu ? 'События по категориям' : 'Events by Category'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={eventData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Channel Performance Table */}
      {channelSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isRu ? 'Эффективность по каналам' : 'Channel Performance'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">{isRu ? 'Канал' : 'Channel'}</th>
                    <th className="text-right p-3 font-medium">{isRu ? 'Показы' : 'Impressions'}</th>
                    <th className="text-right p-3 font-medium">{isRu ? 'Клики' : 'Clicks'}</th>
                    <th className="text-right p-3 font-medium">{isRu ? 'Лиды' : 'Leads'}</th>
                    <th className="text-right p-3 font-medium">{isRu ? 'Конверсии' : 'Conversions'}</th>
                    <th className="text-right p-3 font-medium">{isRu ? 'Расход' : 'Spend'}</th>
                    <th className="text-right p-3 font-medium">{isRu ? 'Выручка' : 'Revenue'}</th>
                    <th className="text-right p-3 font-medium">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {channelSummary.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3 font-medium">{row.channel}</td>
                      <td className="p-3 text-right">{row.impressions.toLocaleString()}</td>
                      <td className="p-3 text-right">{row.clicks.toLocaleString()}</td>
                      <td className="p-3 text-right">{row.leads.toLocaleString()}</td>
                      <td className="p-3 text-right">{row.conversions}</td>
                      <td className="p-3 text-right">${row.spend.toFixed(0)}</td>
                      <td className="p-3 text-right">${row.revenue.toFixed(0)}</td>
                      <td className="p-3 text-right">
                        {row.roas != null ? (
                          <Badge variant={row.roas >= 3 ? 'default' : 'secondary'}>
                            {row.roas}x
                          </Badge>
                        ) : <span className="text-muted-foreground">N/A</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Pages */}
      {topPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isRu ? 'Топ страниц' : 'Top Pages'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPages.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-mono text-muted-foreground truncate max-w-[60%]">{page.path}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{page.views} {isRu ? 'просм.' : 'views'}</span>
                    <span className="text-muted-foreground">{page.avgTime}s avg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
