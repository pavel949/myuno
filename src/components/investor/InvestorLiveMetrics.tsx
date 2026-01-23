import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building2, ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  Activity, Target, Percent, Ship, Home, Car, Utensils, Sparkles,
  Heart, Scale, Shield, Palmtree, Calendar, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvestorMetrics, MARKET_DATA, PMF_TARGETS, SERVICE_VERTICALS } from '@/hooks/useInvestorMetrics';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { useAdminFinance } from '@/hooks/useAdminFinance';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const verticalIcons: Record<string, React.ElementType> = {
  yacht: Ship,
  property: Home,
  vehicle: Car,
  restaurant: Utensils,
  salon: Sparkles,
  clinic: Heart,
  legal: Scale,
  insurance: Shield,
  tour: Palmtree,
  event: Calendar,
};

export function InvestorLiveMetrics() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { tractionMetrics, revenueChartData, marketData, pmfTargets, isLoading } = useInvestorMetrics();
  const { data: dashboardStats, isLoading: statsLoading, refetch } = useAdminDashboardStats();
  const { summary: financeSummary, byVertical, dailyData, isLoading: financeLoading } = useAdminFinance(30);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Calculate vertical coverage
  const verticalCoverage = useMemo(() => {
    if (!dashboardStats) return [];
    return [
      { name: isRussian ? 'Яхты' : 'Yachts', value: dashboardStats.yachts, icon: Ship },
      { name: isRussian ? 'Недвижимость' : 'Properties', value: dashboardStats.properties, icon: Home },
      { name: isRussian ? 'Транспорт' : 'Vehicles', value: dashboardStats.vehicles, icon: Car },
      { name: isRussian ? 'Рестораны' : 'Restaurants', value: dashboardStats.restaurants, icon: Utensils },
      { name: isRussian ? 'Салоны' : 'Salons', value: dashboardStats.salons, icon: Sparkles },
      { name: isRussian ? 'Клиники' : 'Clinics', value: dashboardStats.clinics, icon: Heart },
      { name: isRussian ? 'Туры' : 'Tours', value: dashboardStats.tours, icon: Palmtree },
      { name: isRussian ? 'Мероприятия' : 'Events', value: dashboardStats.events, icon: Calendar },
    ].filter(v => v.value > 0);
  }, [dashboardStats, isRussian]);

  // Revenue by vertical pie data
  const revenuePieData = useMemo(() => {
    if (!byVertical) return [];
    return byVertical.slice(0, 5).map((v, i) => ({
      name: v.verticalLabel,
      value: v.gmv,
      color: COLORS[i % COLORS.length],
    }));
  }, [byVertical]);

  // Daily GMV chart data
  const chartData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.slice(-14).map(d => ({
      date: new Date(d.date).toLocaleDateString(isRussian ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' }),
      gmv: d.gmv,
      revenue: d.platformRevenue,
    }));
  }, [dailyData, isRussian]);

  const kpiCards = [
    {
      title: isRussian ? 'Всего пользователей' : 'Total Users',
      value: formatNumber(tractionMetrics.totalUsers),
      change: tractionMetrics.growth.users,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: isRussian ? 'Активных провайдеров' : 'Active Providers',
      value: formatNumber(tractionMetrics.totalProviders),
      change: tractionMetrics.growth.providers,
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      title: isRussian ? 'Всего бронирований' : 'Total Bookings',
      value: formatNumber(tractionMetrics.totalBookings),
      change: tractionMetrics.growth.bookings,
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      title: isRussian ? 'GMV (30 дней)' : 'GMV (30 days)',
      value: formatCurrency(financeSummary?.totalGmv || tractionMetrics.gmv),
      change: tractionMetrics.growth.revenue,
      icon: DollarSign,
      color: 'bg-amber-500',
    },
  ];

  const pmfProgress = [
    { label: 'MAU', current: tractionMetrics.totalUsers, target: 10000, unit: '' },
    { label: isRussian ? 'GMV/мес' : 'Monthly GMV', current: financeSummary?.totalGmv || 0, target: 100000, unit: '$' },
    { label: isRussian ? 'Провайдеров' : 'Providers', current: tractionMetrics.totalProviders, target: 200, unit: '' },
    { label: isRussian ? 'Подписок' : 'Paid Subs', current: 15, target: 50, unit: '' },
  ];

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {isRussian ? 'Метрики платформы' : 'Platform Metrics'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRussian ? 'Данные в реальном времени' : 'Real-time data'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || statsLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isRussian ? 'Обновить' : 'Refresh'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${kpi.color}/10`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color.replace('bg-', 'text-')}`} />
                  </div>
                  {kpi.change !== 0 && (
                    <Badge variant={kpi.change > 0 ? 'default' : 'destructive'} className="text-xs">
                      {kpi.change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {Math.abs(kpi.change).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* GMV Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isRussian ? 'Тренд GMV (14 дней)' : 'GMV Trend (14 days)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'GMV']}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gmv" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#gmvGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Vertical */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isRussian ? 'GMV по вертикалям' : 'GMV by Vertical'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenuePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenuePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
      </div>

      {/* Vertical Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {isRussian ? 'Покрытие вертикалей' : 'Vertical Coverage'}
          </CardTitle>
          <CardDescription>
            {isRussian ? 'Активные листинги по категориям' : 'Active listings by category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {verticalCoverage.map((vertical, index) => (
              <motion.div
                key={vertical.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <vertical.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold">{vertical.value}</p>
                  <p className="text-xs text-muted-foreground">{vertical.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PMF Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            {isRussian ? 'Прогресс к PMF' : 'PMF Progress'}
          </CardTitle>
          <CardDescription>
            {isRussian ? '18-месячные цели' : '18-month milestones'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {pmfProgress.map((item, index) => {
              const progress = Math.min((item.current / item.target) * 100, 100);
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.unit}{formatNumber(item.current)} / {item.unit}{formatNumber(item.target)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}%</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Market Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-500" />
            {isRussian ? 'Рыночный контекст' : 'Market Context'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: isRussian ? 'Рынок Пхукета' : 'Phuket Market', value: `$${marketData.phuketTourismRevenue2024}B` },
              { label: isRussian ? 'Диджитал проникновение' : 'Digital Penetration', value: `${marketData.digitalPenetration}%` },
              { label: isRussian ? 'Мобильные платежи' : 'Mobile Payments', value: `${marketData.mobilePaymentAdoption}%` },
              { label: isRussian ? 'Доступный рынок' : 'Addressable Market', value: `$${marketData.addressableMarket}B` },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
