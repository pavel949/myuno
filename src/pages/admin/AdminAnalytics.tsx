import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminAnalytics, useRealtimeStats, useTopProviders } from '@/hooks/useAdminAnalytics';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Building2, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  CreditCard,
  Star,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [period, setPeriod] = useState(30);
  
  const { summary, revenueChartData, userChartData, bookingChartData, isLoading } = useAdminAnalytics(period);
  const { stats, isLoading: statsLoading } = useRealtimeStats();
  const { providers: topProviders, isLoading: providersLoading } = useTopProviders(5);

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      growth: summary.userGrowth,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Total Providers',
      value: stats.totalProviders,
      growth: summary.providerGrowth,
      icon: Building2,
      color: 'text-green-500'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      growth: summary.bookingGrowth,
      icon: ShoppingCart,
      color: 'text-orange-500'
    },
    {
      title: 'Total Revenue',
      value: `$${summary.totalRevenue.toLocaleString()}`,
      growth: summary.revenueGrowth,
      icon: DollarSign,
      color: 'text-emerald-500'
    }
  ];

  const quickStats = [
    { label: 'Pending Bookings', value: stats.pendingBookings, icon: Calendar },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: CreditCard },
    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, icon: Activity },
    { label: 'GMV (Period)', value: `$${summary.totalGMV.toLocaleString()}`, icon: TrendingUp }
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title="Platform Analytics" 
          showBack
          fallbackPath="/admin"
        />

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === days 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">
                      {statsLoading ? <Skeleton className="h-8 w-20" /> : stat.value}
                    </p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {!statsLoading && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.growth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${stat.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(stat.growth).toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs prev period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="bg-muted/50">
              <CardContent className="py-4 flex items-center gap-3">
                <stat.icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>GMV and platform revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="gmv" 
                        stackId="1"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                        name="GMV"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="2"
                        stroke="hsl(var(--secondary))" 
                        fill="hsl(var(--secondary))" 
                        fillOpacity={0.3}
                        name="Platform Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Total, new, and active users over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalUsers" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Total Users"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newUsers" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        name="New Users"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="activeUsers" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        name="Active Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking Activity</CardTitle>
                <CardDescription>New, completed, and cancelled bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bookingChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="newBookings" fill="hsl(var(--primary))" name="New" />
                      <Bar dataKey="completed" fill="hsl(var(--secondary))" name="Completed" />
                      <Bar dataKey="cancelled" fill="hsl(var(--destructive))" name="Cancelled" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Top Providers */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Top Providers</CardTitle>
            <CardDescription>Highest rated active providers</CardDescription>
          </CardHeader>
          <CardContent>
            {providersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topProviders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No providers yet</p>
            ) : (
              <div className="space-y-3">
                {topProviders.map((provider, index) => (
                  <div 
                    key={provider.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{provider.business_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {provider.business_category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{provider.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
