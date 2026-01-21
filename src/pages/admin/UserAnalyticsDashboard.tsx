import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  Clock,
  MousePointerClick,
  Eye,
  TrendingUp,
  TrendingDown,
  Download,
  UserPlus,
  Timer,
  BarChart3,
  ShoppingCart,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useUserAnalyticsDashboard,
  useUserSegments,
  useCohortAnalysis,
} from '@/hooks/useUserAnalytics';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const SEGMENT_COLORS: Record<string, string> = {
  new: 'hsl(var(--chart-1))',
  active: 'hsl(var(--chart-2))',
  churned: 'hsl(var(--chart-3))',
  vip: 'hsl(var(--chart-4))',
  at_risk: 'hsl(var(--chart-5))',
  returning: 'hsl(var(--primary))',
  unknown: 'hsl(var(--muted))',
};

const SEGMENT_LABELS: Record<string, { en: string; ru: string }> = {
  new: { en: 'New Users', ru: 'Новые' },
  active: { en: 'Active', ru: 'Активные' },
  churned: { en: 'Churned', ru: 'Ушедшие' },
  vip: { en: 'VIP', ru: 'VIP' },
  at_risk: { en: 'At Risk', ru: 'В зоне риска' },
  returning: { en: 'Returning', ru: 'Возвращающиеся' },
  unknown: { en: 'Unknown', ru: 'Неизвестно' },
};

export default function UserAnalyticsDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const isRu = language === 'ru';

  const [days, setDays] = useState(30);
  const { summary, chartData, segments, realtimeStats, isLoading } = useUserAnalyticsDashboard(days);
  const { users, isLoading: usersLoading } = useUserSegments();
  const { cohorts, isLoading: cohortsLoading } = useCohortAnalysis();

  if (adminLoading || !user) {
    return (
      <AppLayout>
        <div className="container py-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const statCards = [
    {
      title: isRu ? 'Онлайн сейчас' : 'Online Now',
      value: realtimeStats.online_users.toLocaleString(),
      icon: Activity,
      color: 'text-green-500',
      isLive: true,
    },
    {
      title: isRu ? 'Активных сессий' : 'Active Sessions',
      value: realtimeStats.active_sessions.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
      isLive: true,
    },
    {
      title: isRu ? 'Новые сегодня' : 'New Today',
      value: realtimeStats.new_users_today.toLocaleString(),
      icon: UserPlus,
      color: 'text-purple-500',
    },
    {
      title: isRu ? 'Сессий за период' : 'Sessions',
      value: summary.totalSessions.toLocaleString(),
      change: summary.sessionGrowth,
      icon: MousePointerClick,
      color: 'text-orange-500',
    },
    {
      title: isRu ? 'Просмотров страниц' : 'Page Views',
      value: summary.totalPageViews.toLocaleString(),
      icon: Eye,
      color: 'text-cyan-500',
    },
    {
      title: isRu ? 'Ср. длит. сессии' : 'Avg Session',
      value: formatDuration(summary.avgSessionDuration),
      icon: Timer,
      color: 'text-indigo-500',
    },
    {
      title: isRu ? 'Заказов сегодня' : 'Orders Today',
      value: realtimeStats.orders_today.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-amber-500',
    },
    {
      title: isRu ? 'Выручка сегодня' : 'Revenue Today',
      value: `฿${realtimeStats.revenue_today.toLocaleString()}`,
      icon: BarChart3,
      color: 'text-emerald-500',
    },
  ];

  const handleExport = async (exportFormat: 'csv' | 'json') => {
    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.full_name,
      segments: u.segments.join(', '),
      created_at: u.created_at,
      last_active: u.last_active,
    }));

    if (exportFormat === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row) => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
    }
  };

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">
            {isRu ? 'Аналитика пользователей' : 'User Analytics'}
          </h1>
          <p className="text-muted-foreground">
            {isRu ? 'Детальная статистика и сегментация' : 'Detailed statistics and segmentation'}
          </p>
        </div>

        {/* Period selector & actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                variant={days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d} {isRu ? 'дн.' : 'days'}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    {stat.isLive && (
                      <Badge variant="secondary" className="text-xs">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                        Live
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : stat.value}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{stat.title}</span>
                    {stat.change !== undefined && (
                      <span
                        className={`text-xs flex items-center ${
                          stat.change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {stat.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {formatPercent(stat.change)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{isRu ? 'Обзор' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="segments">{isRu ? 'Сегменты' : 'Segments'}</TabsTrigger>
            <TabsTrigger value="cohorts">{isRu ? 'Когорты' : 'Cohorts'}</TabsTrigger>
            <TabsTrigger value="users">{isRu ? 'Пользователи' : 'Users'}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Users chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRu ? 'Активность' : 'Activity'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="sessions"
                          stackId="1"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          name={isRu ? 'Сессии' : 'Sessions'}
                        />
                        <Area
                          type="monotone"
                          dataKey="activeUsers"
                          stackId="2"
                          stroke="hsl(var(--chart-2))"
                          fill="hsl(var(--chart-2))"
                          fillOpacity={0.3}
                          name={isRu ? 'Активные' : 'Active'}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Page Views & Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRu ? 'Просмотры и выручка' : 'Views & Revenue'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis yAxisId="left" className="text-xs" />
                        <YAxis yAxisId="right" orientation="right" className="text-xs" />
                        <Tooltip />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="pageViews"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={2}
                          dot={false}
                          name={isRu ? 'Просмотры' : 'Page Views'}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--chart-4))"
                          strokeWidth={2}
                          dot={false}
                          name={isRu ? 'Выручка' : 'Revenue'}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pie chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRu ? 'Распределение сегментов' : 'Segment Distribution'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={segments}
                          dataKey="count"
                          nameKey="segment_type"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ segment_type, percent }) =>
                            `${SEGMENT_LABELS[segment_type]?.[isRu ? 'ru' : 'en'] || segment_type} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {segments.map((entry) => (
                            <Cell
                              key={entry.segment_type}
                              fill={SEGMENT_COLORS[entry.segment_type] || 'hsl(var(--muted))'}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Segment list */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRu ? 'Сегменты' : 'Segments'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {segments.map((seg) => (
                      <div key={seg.segment_type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: SEGMENT_COLORS[seg.segment_type] || 'hsl(var(--muted))' }}
                          />
                          <span className="font-medium">
                            {SEGMENT_LABELS[seg.segment_type]?.[isRu ? 'ru' : 'en'] || seg.segment_type}
                          </span>
                        </div>
                        <Badge variant="secondary">{seg.count.toLocaleString()}</Badge>
                      </div>
                    ))}
                    {segments.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        {isRu ? 'Нет данных о сегментах' : 'No segment data available'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isRu ? 'Когортный анализ' : 'Cohort Analysis'}</CardTitle>
                <CardDescription>
                  {isRu ? 'Retention по месяцам регистрации' : 'Retention by registration month'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cohortsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : cohorts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isRu ? 'Данные когорт пока не рассчитаны' : 'Cohort data not calculated yet'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">{isRu ? 'Когорта' : 'Cohort'}</th>
                          {[...Array(6)].map((_, i) => (
                            <th key={i} className="text-center p-2">
                              M{i}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cohorts.slice(-6).map((cohort) => (
                          <tr key={cohort.cohort_month} className="border-b">
                            <td className="p-2 font-medium">{cohort.cohort_month}</td>
                            {[...Array(6)].map((_, i) => {
                              const period = cohort.periods.find((p) => p.period === i);
                              const retention = period?.retention || 0;
                              const opacity = retention / 100;
                              return (
                                <td
                                  key={i}
                                  className="text-center p-2"
                                  style={{
                                    backgroundColor: `hsl(var(--primary) / ${opacity})`,
                                  }}
                                >
                                  {period ? `${retention.toFixed(0)}%` : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{isRu ? 'База пользователей' : 'User Database'}</CardTitle>
                  <Badge variant="outline">{users.length} {isRu ? 'записей' : 'records'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">{isRu ? 'Пользователь' : 'User'}</th>
                          <th className="text-left p-2">{isRu ? 'Сегменты' : 'Segments'}</th>
                          <th className="text-left p-2">{isRu ? 'Регистрация' : 'Registered'}</th>
                          <th className="text-left p-2">{isRu ? 'Последняя активность' : 'Last Active'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 50).map((u) => (
                          <tr key={u.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">{u.full_name || '-'}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {u.segments.map((seg) => (
                                  <Badge
                                    key={seg}
                                    variant="secondary"
                                    className="text-xs"
                                    style={{ backgroundColor: `${SEGMENT_COLORS[seg] || 'hsl(var(--muted))'}20` }}
                                  >
                                    {SEGMENT_LABELS[seg]?.[isRu ? 'ru' : 'en'] || seg}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {format(new Date(u.created_at), 'd MMM yyyy', { locale: ru })}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {u.last_active
                                ? format(new Date(u.last_active), 'd MMM, HH:mm', { locale: ru })
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
