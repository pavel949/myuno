import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface PlatformMetrics {
  id: string;
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_providers: number;
  active_providers: number;
  new_providers: number;
  total_bookings: number;
  new_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  gmv: number;
  platform_revenue: number;
  subscription_revenue: number;
  page_views: number;
  unique_visitors: number;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalGMV: number;
  totalRevenue: number;
  userGrowth: number;
  providerGrowth: number;
  bookingGrowth: number;
  revenueGrowth: number;
}

export function useAdminAnalytics(days: number = 30) {
  const startDate = useMemo(() => format(subDays(new Date(), days), 'yyyy-MM-dd'), [days]);

  // Main metrics query with React Query caching
  const { data: metrics = [], isLoading, error } = useQuery({
    queryKey: ['admin-analytics-metrics', days, startDate],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('platform_metrics')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;
      return (data as PlatformMetrics[]) || [];
    },
    ...CACHE_PROFILES.ADMIN,
  });

  // Fill in missing dates with zero values
  const filledMetrics = useMemo(() => {
    const dateRange = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date()
    });

    const metricsMap = new Map(metrics.map(m => [m.date, m]));

    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return metricsMap.get(dateStr) || {
        id: dateStr,
        date: dateStr,
        total_users: 0,
        new_users: 0,
        active_users: 0,
        total_providers: 0,
        active_providers: 0,
        new_providers: 0,
        total_bookings: 0,
        new_bookings: 0,
        completed_bookings: 0,
        cancelled_bookings: 0,
        gmv: 0,
        platform_revenue: 0,
        subscription_revenue: 0,
        page_views: 0,
        unique_visitors: 0
      };
    });
  }, [metrics, days]);

  // Calculate summary with growth percentages
  const summary = useMemo((): AnalyticsSummary => {
    if (filledMetrics.length === 0) {
      return {
        totalUsers: 0,
        totalProviders: 0,
        totalBookings: 0,
        totalGMV: 0,
        totalRevenue: 0,
        userGrowth: 0,
        providerGrowth: 0,
        bookingGrowth: 0,
        revenueGrowth: 0
      };
    }

    const latest = filledMetrics[filledMetrics.length - 1];
    const halfPoint = Math.floor(filledMetrics.length / 2);
    const midPoint = filledMetrics[halfPoint] || filledMetrics[0];

    const calcGrowth = (current: number, previous: number) => 
      previous === 0 ? 0 : ((current - previous) / previous) * 100;

    const totalGMV = filledMetrics.reduce((sum, m) => sum + (m.gmv || 0), 0);
    const totalRevenue = filledMetrics.reduce((sum, m) => sum + (m.platform_revenue || 0) + (m.subscription_revenue || 0), 0);
    
    const firstHalfRevenue = filledMetrics.slice(0, halfPoint).reduce((sum, m) => sum + (m.platform_revenue || 0) + (m.subscription_revenue || 0), 0);
    const secondHalfRevenue = filledMetrics.slice(halfPoint).reduce((sum, m) => sum + (m.platform_revenue || 0) + (m.subscription_revenue || 0), 0);

    return {
      totalUsers: latest.total_users || 0,
      totalProviders: latest.total_providers || 0,
      totalBookings: latest.total_bookings || 0,
      totalGMV,
      totalRevenue,
      userGrowth: calcGrowth(latest.total_users || 0, midPoint.total_users || 0),
      providerGrowth: calcGrowth(latest.total_providers || 0, midPoint.total_providers || 0),
      bookingGrowth: calcGrowth(latest.total_bookings || 0, midPoint.total_bookings || 0),
      revenueGrowth: calcGrowth(secondHalfRevenue, firstHalfRevenue)
    };
  }, [filledMetrics]);

  // Chart data for revenue
  const revenueChartData = useMemo(() => {
    return filledMetrics.map(m => ({
      date: format(parseISO(m.date), 'MMM dd'),
      gmv: m.gmv || 0,
      revenue: (m.platform_revenue || 0) + (m.subscription_revenue || 0),
      platformFee: m.platform_revenue || 0,
      subscriptions: m.subscription_revenue || 0
    }));
  }, [filledMetrics]);

  // Chart data for users
  const userChartData = useMemo(() => {
    return filledMetrics.map(m => ({
      date: format(parseISO(m.date), 'MMM dd'),
      totalUsers: m.total_users || 0,
      newUsers: m.new_users || 0,
      activeUsers: m.active_users || 0
    }));
  }, [filledMetrics]);

  // Chart data for bookings
  const bookingChartData = useMemo(() => {
    return filledMetrics.map(m => ({
      date: format(parseISO(m.date), 'MMM dd'),
      newBookings: m.new_bookings || 0,
      completed: m.completed_bookings || 0,
      cancelled: m.cancelled_bookings || 0
    }));
  }, [filledMetrics]);

  return {
    metrics: filledMetrics,
    summary,
    revenueChartData,
    userChartData,
    bookingChartData,
    isLoading,
    error: error?.message || null
  };
}

// Hook for fetching real-time stats (not from snapshots)
export function useRealtimeStats() {
  const { data: stats = {
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    pendingBookings: 0,
    activeSubscriptions: 0,
    todayRevenue: 0
  }, isLoading } = useQuery({
    queryKey: ['admin-realtime-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const [
        usersRes,
        providersRes,
        bookingsRes,
        confirmedRes,
        subscriptionsRes,
        todayBookingsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('vendor_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('bookings').select('total_amount').gte('created_at', today).eq('status', 'completed')
      ]);

      const todayRevenue = todayBookingsRes.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalProviders: providersRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        pendingBookings: confirmedRes.count || 0,
        activeSubscriptions: subscriptionsRes.count || 0,
        todayRevenue: todayRevenue * 0.1 // Platform fee
      };
    },
    ...CACHE_PROFILES.REALTIME,
  });

  return { stats, isLoading };
}

// Hook for top providers
export function useTopProviders(limit: number = 10) {
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['admin-top-providers', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    ...CACHE_PROFILES.ADMIN,
  });

  return { providers, isLoading };
}
