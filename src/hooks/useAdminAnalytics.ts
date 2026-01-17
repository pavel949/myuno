import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

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
  const [metrics, setMetrics] = useState<PlatformMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMetrics = async () => {
      try {
        if (isMounted) setIsLoading(true);
        const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
        
        const { data, error: fetchError } = await supabase
          .from('platform_metrics')
          .select('*')
          .gte('date', startDate)
          .order('date', { ascending: true });

        if (fetchError) throw fetchError;
        if (isMounted) setMetrics((data as PlatformMetrics[]) || []);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMetrics();
    return () => { isMounted = false; };
  }, [days]);

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
    error
  };
}

// Hook for fetching real-time stats (not from snapshots)
export function useRealtimeStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    pendingBookings: 0,
    activeSubscriptions: 0,
    todayRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
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

        if (isMounted) {
          setStats({
            totalUsers: usersRes.count || 0,
            totalProviders: providersRes.count || 0,
            totalBookings: bookingsRes.count || 0,
            pendingBookings: confirmedRes.count || 0,
            activeSubscriptions: subscriptionsRes.count || 0,
            todayRevenue: todayRevenue * 0.1 // Platform fee
          });
        }
      } catch (err) {
        console.error('Error fetching realtime stats:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { stats, isLoading };
}

// Hook for top providers
export function useTopProviders(limit: number = 10) {
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTopProviders = async () => {
      try {
        const { data, error } = await supabase
          .from('providers')
          .select(`
            id,
            business_name,
            business_category,
            rating,
            review_count,
            is_verified
          `)
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(limit);

        if (error) throw error;
        if (isMounted) setProviders(data || []);
      } catch (err) {
        console.error('Error fetching top providers:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTopProviders();
    return () => { isMounted = false; };
  }, [limit]);

  return { providers, isLoading };
}
