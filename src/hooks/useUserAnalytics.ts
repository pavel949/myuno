import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export interface UserAnalyticsDaily {
  id: string;
  date: string;
  user_id: string;
  sessions: number;
  page_views: number;
  events: number;
  time_spent: number;
  orders: number;
  revenue: number;
}

export interface UserSegment {
  id: string;
  user_id: string;
  lifecycle_stage: string | null;
  value_segment: string | null;
  engagement_level: string | null;
  is_vip: boolean;
  is_at_risk: boolean;
  total_orders: number;
  total_spent: number;
  lifetime_value: number;
}

export interface RealtimeStats {
  id: string;
  online_users: number;
  active_sessions: number;
  page_views_today: number;
  orders_today: number;
  revenue_today: number;
  new_users_today: number;
  updated_at: string;
}

export function useUserAnalyticsDashboard(days: number = 30) {
  const [dailyData, setDailyData] = useState<UserAnalyticsDaily[]>([]);
  const [segments, setSegments] = useState<{ segment_type: string; count: number }[]>([]);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

        // Fetch daily analytics (aggregated)
        const { data: dailyRes, error: dailyErr } = await supabase
          .from('user_analytics_daily')
          .select('*')
          .gte('date', startDate)
          .order('date', { ascending: true });

        if (dailyErr) throw dailyErr;

        // Fetch segment distribution
        const { data: segmentRes, error: segmentErr } = await supabase
          .from('user_segments')
          .select('lifecycle_stage, value_segment, is_vip, is_at_risk');

        if (segmentErr) throw segmentErr;

        // Count segments by lifecycle_stage
        const segmentCounts: Record<string, number> = {};
        segmentRes?.forEach((s) => {
          const stage = s.lifecycle_stage || 'unknown';
          segmentCounts[stage] = (segmentCounts[stage] || 0) + 1;
          
          if (s.is_vip) {
            segmentCounts['vip'] = (segmentCounts['vip'] || 0) + 1;
          }
          if (s.is_at_risk) {
            segmentCounts['at_risk'] = (segmentCounts['at_risk'] || 0) + 1;
          }
        });

        // Fetch realtime stats
        const { data: realtimeRes, error: realtimeErr } = await supabase
          .from('realtime_stats')
          .select('*')
          .limit(1)
          .single();

        if (realtimeErr && realtimeErr.code !== 'PGRST116') throw realtimeErr;

        if (isMounted) {
          setDailyData((dailyRes as UserAnalyticsDaily[]) || []);
          setSegments(
            Object.entries(segmentCounts).map(([type, count]) => ({
              segment_type: type,
              count,
            }))
          );
          setRealtimeStats(realtimeRes as RealtimeStats | null);
        }
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime stats updates
    const channel = supabase
      .channel('realtime-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'realtime_stats' },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setRealtimeStats(payload.new as RealtimeStats);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [days]);

  // Aggregate data by date
  const aggregatedData = useMemo(() => {
    const byDate = new Map<string, {
      sessions: number;
      page_views: number;
      events: number;
      time_spent: number;
      orders: number;
      revenue: number;
      users: Set<string>;
    }>();

    dailyData.forEach((d) => {
      const existing = byDate.get(d.date) || {
        sessions: 0,
        page_views: 0,
        events: 0,
        time_spent: 0,
        orders: 0,
        revenue: 0,
        users: new Set<string>(),
      };
      
      existing.sessions += d.sessions || 0;
      existing.page_views += d.page_views || 0;
      existing.events += d.events || 0;
      existing.time_spent += d.time_spent || 0;
      existing.orders += d.orders || 0;
      existing.revenue += Number(d.revenue) || 0;
      existing.users.add(d.user_id);
      
      byDate.set(d.date, existing);
    });

    return byDate;
  }, [dailyData]);

  // Fill missing dates
  const filledData = useMemo(() => {
    const dateRange = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date(),
    });

    return dateRange.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const data = aggregatedData.get(dateStr);
      
      return {
        date: dateStr,
        activeUsers: data?.users.size || 0,
        sessions: data?.sessions || 0,
        pageViews: data?.page_views || 0,
        events: data?.events || 0,
        timeSpent: data?.time_spent || 0,
        orders: data?.orders || 0,
        revenue: data?.revenue || 0,
      };
    });
  }, [aggregatedData, days]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalSessions = filledData.reduce((sum, d) => sum + d.sessions, 0);
    const totalPageViews = filledData.reduce((sum, d) => sum + d.pageViews, 0);
    const totalEvents = filledData.reduce((sum, d) => sum + d.events, 0);
    const totalRevenue = filledData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = filledData.reduce((sum, d) => sum + d.orders, 0);
    const avgTimeSpent = totalSessions > 0
      ? filledData.reduce((sum, d) => sum + d.timeSpent, 0) / totalSessions
      : 0;

    // Calculate growth
    const midPoint = Math.floor(filledData.length / 2);
    const firstHalf = filledData.slice(0, midPoint);
    const secondHalf = filledData.slice(midPoint);
    
    const firstHalfSessions = firstHalf.reduce((s, d) => s + d.sessions, 0);
    const secondHalfSessions = secondHalf.reduce((s, d) => s + d.sessions, 0);
    const sessionGrowth = firstHalfSessions > 0 
      ? ((secondHalfSessions - firstHalfSessions) / firstHalfSessions) * 100 
      : 0;

    return {
      totalUsers: realtimeStats?.online_users || 0,
      newUsers: realtimeStats?.new_users_today || 0,
      activeUsers: realtimeStats?.active_sessions || 0,
      totalSessions,
      totalPageViews,
      totalEvents,
      totalRevenue,
      totalOrders,
      avgSessionDuration: avgTimeSpent,
      avgBounceRate: 0, // Would need bounce tracking
      userGrowth: 0,
      sessionGrowth,
    };
  }, [filledData, realtimeStats]);

  // Chart data
  const chartData = useMemo(() => {
    return filledData.map((d) => ({
      date: format(parseISO(d.date), 'd MMM', { locale: ru }),
      activeUsers: d.activeUsers,
      newUsers: 0, // Would need daily new user tracking
      sessions: d.sessions,
      pageViews: d.pageViews,
      revenue: d.revenue,
    }));
  }, [filledData]);

  return {
    dailyData: filledData,
    segments,
    realtimeStats: {
      online_users: realtimeStats?.online_users || 0,
      active_sessions: realtimeStats?.active_sessions || 0,
      page_views_today: realtimeStats?.page_views_today || 0,
      orders_today: realtimeStats?.orders_today || 0,
      revenue_today: realtimeStats?.revenue_today || 0,
      new_users_today: realtimeStats?.new_users_today || 0,
    },
    summary,
    chartData,
    isLoading,
    error,
  };
}

// Hook for fetching user segments with details
export function useUserSegments() {
  const [users, setUsers] = useState<{
    id: string;
    email: string | null;
    full_name: string | null;
    segments: string[];
    created_at: string;
    last_active: string | null;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch profiles with their segments
        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('id, email, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(500);

        if (profilesErr) throw profilesErr;

        const userIds = profiles?.map((p) => p.id) || [];

        const { data: segments, error: segmentsErr } = await supabase
          .from('user_segments')
          .select('user_id, lifecycle_stage, value_segment, is_vip, is_at_risk')
          .in('user_id', userIds);

        if (segmentsErr) throw segmentsErr;

        const { data: sessions, error: sessionsErr } = await supabase
          .from('user_sessions')
          .select('user_id, last_activity_at')
          .in('user_id', userIds)
          .order('last_activity_at', { ascending: false });

        if (sessionsErr) throw sessionsErr;

        // Map segments to users
        const segmentMap = new Map<string, string[]>();
        segments?.forEach((s) => {
          const existing = segmentMap.get(s.user_id) || [];
          if (s.lifecycle_stage) existing.push(s.lifecycle_stage);
          if (s.value_segment) existing.push(s.value_segment);
          if (s.is_vip) existing.push('vip');
          if (s.is_at_risk) existing.push('at_risk');
          segmentMap.set(s.user_id, [...new Set(existing)]);
        });

        // Map last activity
        const activityMap = new Map<string, string>();
        sessions?.forEach((s) => {
          if (s.last_activity_at && !activityMap.has(s.user_id)) {
            activityMap.set(s.user_id, s.last_activity_at);
          }
        });

        setUsers(
          (profiles || []).map((p) => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            segments: segmentMap.get(p.id) || [],
            created_at: p.created_at,
            last_active: activityMap.get(p.id) || null,
          }))
        );
      } catch {
        // Silent fail for segments
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, isLoading };
}

// Hook for cohort analysis
export function useCohortAnalysis() {
  const [cohorts, setCohorts] = useState<{
    cohort_month: string;
    periods: { period: number; retention: number; users: number }[];
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const { data, error } = await supabase
          .from('cohort_analytics')
          .select('*')
          .order('cohort_month', { ascending: true })
          .order('period_number', { ascending: true });

        if (error) throw error;

        // Group by cohort month
        const grouped = new Map<string, { period: number; retention: number; users: number }[]>();
        data?.forEach((row) => {
          const existing = grouped.get(row.cohort_month) || [];
          existing.push({
            period: row.period_number,
            retention: row.retention_rate || 0,
            users: row.active_users || 0,
          });
          grouped.set(row.cohort_month, existing);
        });

        setCohorts(
          Array.from(grouped.entries()).map(([month, periods]) => ({
            cohort_month: month,
            periods,
          }))
        );
      } catch {
        // Silent fail for cohorts
      } finally {
        setIsLoading(false);
      }
    };

    fetchCohorts();
  }, []);

  return { cohorts, isLoading };
}

// Hook for funnel analysis
export function useFunnelAnalysis(funnelName?: string) {
  const [funnels, setFunnels] = useState<{
    id: string;
    name: string;
    date: string;
    steps: { step: number; count: number; conversion: number }[];
    overallConversion: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFunnels = async () => {
      try {
        let query = supabase
          .from('funnel_analytics')
          .select('*')
          .order('date', { ascending: false });

        if (funnelName) {
          query = query.eq('funnel_name', funnelName);
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;

        setFunnels(
          (data || []).map((f) => ({
            id: f.id,
            name: f.funnel_name,
            date: f.date,
            steps: [
              { step: 1, count: f.step_1_count || 0, conversion: 100 },
              { step: 2, count: f.step_2_count || 0, conversion: Number(f.conversion_1_2) || 0 },
              { step: 3, count: f.step_3_count || 0, conversion: Number(f.conversion_2_3) || 0 },
              { step: 4, count: f.step_4_count || 0, conversion: Number(f.conversion_3_4) || 0 },
              { step: 5, count: f.step_5_count || 0, conversion: Number(f.conversion_4_5) || 0 },
            ].filter((s) => s.count > 0),
            overallConversion: Number(f.overall_conversion) || 0,
          }))
        );
      } catch {
        // Silent fail for funnels
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunnels();
  }, [funnelName]);

  return { funnels, isLoading };
}
