import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile, useVendorAnalytics } from '@/hooks/useVendor';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar, 
  Users,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

const VendorAnalytics = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const [period, setPeriod] = useState(30);
  const { analytics, summary, isLoading: analyticsLoading } = useVendorAnalytics(profile?.id, period);

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  if (authLoading || profileLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!profile) return null;

  // Calculate trends (mock data for now)
  const revenueTrend = 12.5;
  const bookingsTrend = 8.3;
  const completionRate = summary.totalBookings > 0 
    ? Math.round((summary.completedBookings / summary.totalBookings) * 100) 
    : 0;

  // Prepare chart data
  const chartData = analytics.map(day => ({
    date: format(new Date(day.date), 'dd MMM', { locale: isRussian ? ru : undefined }),
    revenue: day.net_revenue,
    bookings: day.total_bookings,
  }));

  // Fill in missing dates with zeros
  const filledChartData = [];
  for (let i = period - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'dd MMM', { locale: isRussian ? ru : undefined });
    const existing = chartData.find(d => d.date === date);
    filledChartData.push(existing || { date, revenue: 0, bookings: 0 });
  }

  const pieData = [
    { name: isRussian ? 'Завершено' : 'Completed', value: summary.completedBookings, color: '#22c55e' },
    { name: isRussian ? 'Отменено' : 'Cancelled', value: summary.cancelledBookings, color: '#ef4444' },
    { name: isRussian ? 'В процессе' : 'In Progress', value: summary.totalBookings - summary.completedBookings - summary.cancelledBookings, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const stats = [
    {
      label: isRussian ? 'Доход' : 'Revenue',
      value: `${summary.totalRevenue.toLocaleString()} ₽`,
      trend: revenueTrend,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: isRussian ? 'Бронирования' : 'Bookings',
      value: summary.totalBookings.toString(),
      trend: bookingsTrend,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: isRussian ? 'Выполнено' : 'Completion',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: isRussian ? 'Рейтинг' : 'Rating',
      value: profile.rating.toFixed(1),
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Аналитика' : 'Analytics'}
          showBack
        />

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              variant={period === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(days)}
            >
              {days} {isRussian ? 'дн' : 'days'}
            </Button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold">{stat.value}</span>
                  {stat.trend !== undefined && (
                    <span className={`text-xs flex items-center ${stat.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.trend >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(stat.trend)}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {isRussian ? 'Динамика дохода' : 'Revenue Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={filledChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} ₽`, isRussian ? 'Доход' : 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bookings Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {isRussian ? 'Бронирования' : 'Bookings'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={filledChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value, isRussian ? 'Бронирования' : 'Bookings']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="bookings" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isRussian ? 'Статусы бронирований' : 'Booking Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </AppLayout>
  );
};

export default VendorAnalytics;
