import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';
import { SectionHeader } from '@/components/ds';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, BarChart3, Activity, ShoppingCart } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

type OrderRow = { total_amount: number | string | null; currency: string | null; status: string; created_at: string };
type ProfileRow = { created_at: string };
type EventRow = { event_name: string; created_at: string };

function useInvestorMetrics() {
  return useQuery({
    queryKey: ['investor-metrics'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const sevenDaysAgo = subDays(now, 7).toISOString();

      const [orders, profiles, events, bookings] = await Promise.all([
        supabase.from('orders').select('total_amount, currency, status, created_at')
          .gte('created_at', subDays(now, 90).toISOString()),
        supabase.from('profiles').select('created_at')
          .order('created_at', { ascending: false }).limit(1000),
        typedFrom('analytics_events')
          .select('event_name, created_at')
          .gte('created_at', thirtyDaysAgo).limit(1000),
        supabase.from('bookings').select('status, total_amount, created_at')
          .gte('created_at', subDays(now, 90).toISOString()),
      ]);

      const ordersList: OrderRow[] = (orders.data || []) as OrderRow[];
      const profilesList: ProfileRow[] = (profiles.data || []) as ProfileRow[];
      const eventsList: EventRow[] = (events.data || []) as EventRow[];

      // GMV
      const paidOrders = ordersList.filter(o => o.status === 'paid' || o.status === 'completed');
      const gmvTotal = paidOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const gmvLast30 = paidOrders
        .filter(o => new Date(o.created_at) >= new Date(thirtyDaysAgo))
        .reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

      // Users
      const totalUsers = profilesList.length;
      const newUsersLast30 = profilesList.filter(
        p => new Date(p.created_at) >= new Date(thirtyDaysAgo)
      ).length;
      const newUsersLast7 = profilesList.filter(
        p => new Date(p.created_at) >= new Date(sevenDaysAgo)
      ).length;

      // Page views (MAU proxy)
      const pageViews = eventsList.filter(e => e.event_name === 'page_view').length;

      // GMV trend (last 30 days, grouped by day)
      const gmvByDay: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const day = format(subDays(now, i), 'MM/dd');
        gmvByDay[day] = 0;
      }
      paidOrders
        .filter(o => new Date(o.created_at) >= new Date(thirtyDaysAgo))
        .forEach(o => {
          const day = format(new Date(o.created_at), 'MM/dd');
          if (gmvByDay[day] !== undefined) gmvByDay[day] += Number(o.total_amount) || 0;
        });
      const gmvTrend = Object.entries(gmvByDay).map(([date, amount]) => ({ date, amount }));

      // Orders by status
      const statusCounts: Record<string, number> = {};
      ordersList.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Avg order value
      const avgOrderValue = paidOrders.length > 0 ? gmvTotal / paidOrders.length : 0;

      return {
        gmvTotal,
        gmvLast30,
        totalUsers,
        newUsersLast30,
        newUsersLast7,
        pageViews,
        totalOrders: ordersList.length,
        paidOrders: paidOrders.length,
        avgOrderValue,
        gmvTrend,
        ordersByStatus,
      };
    },
    staleTime: 60_000,
  });
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

function MetricCard({ title, value, subtitle, icon: Icon }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold font-display">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminInvestorMetrics() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: m, isLoading } = useInvestorMetrics();

  if (isLoading || !m) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {isRu ? 'Загрузка метрик...' : 'Loading metrics...'}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto w-full">
      <SectionHeader
        title={isRu ? 'Метрики для инвесторов' : 'Investor Metrics'}
        subtitle={isRu ? 'Ключевые показатели бизнеса' : 'Key business metrics'}
        icon={TrendingUp}
        size="lg"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="GMV (Total)"
          value={`฿${m.gmvTotal.toLocaleString()}`}
          subtitle={isRu ? 'Все время' : 'All time'}
          icon={DollarSign}
        />
        <MetricCard
          title="GMV (30d)"
          value={`฿${m.gmvLast30.toLocaleString()}`}
          subtitle={isRu ? 'Последние 30 дней' : 'Last 30 days'}
          icon={TrendingUp}
        />
        <MetricCard
          title={isRu ? 'Пользователи' : 'Users'}
          value={m.totalUsers.toLocaleString()}
          subtitle={`+${m.newUsersLast30} (30d)`}
          icon={Users}
        />
        <MetricCard
          title={isRu ? 'Заказы' : 'Orders'}
          value={m.totalOrders.toLocaleString()}
          subtitle={`${m.paidOrders} ${isRu ? 'оплачено' : 'paid'}`}
          icon={ShoppingCart}
        />
        <MetricCard
          title={isRu ? 'Средний чек' : 'Avg Order'}
          value={`฿${Math.round(m.avgOrderValue).toLocaleString()}`}
          icon={BarChart3}
        />
        <MetricCard
          title={isRu ? 'Просмотры' : 'Page Views'}
          value={m.pageViews.toLocaleString()}
          subtitle="30d"
          icon={Activity}
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {isRu ? 'GMV по дням (30d)' : 'GMV by Day (30d)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={m.gmvTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {isRu ? 'Заказы по статусу' : 'Orders by Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={m.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {m.ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
